import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { isCurrentManager } from '@/lib/employee-access';
import { Role, EmploymentStatus } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  employeeCode: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().min(1),
  managerId: z.string().optional(),
  baseSalary: z.number().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role === Role.EMPLOYEE) {
      return NextResponse.json({ error: 'Forbidden: Staff cannot access staff directory' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status') as EmploymentStatus | null;

    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Check if email or employeeCode already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const existingCode = await prisma.employee.findUnique({ where: { employeeCode: data.employeeCode } });
    if (existingCode) {
      return NextResponse.json({ error: 'Employee code already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);

    const newEmployee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          departmentId: data.departmentId || null,
          designation: data.designation,
          managerId: data.managerId || null,
          baseSalary: data.baseSalary,
        },
        include: {
          user: { select: { email: true, role: true } },
          department: true,
        },
      });

      // Initialize default leave balances for current year
      const leaveTypes = await tx.leaveType.findMany();
      const currentYear = new Date().getFullYear();
      for (const lt of leaveTypes) {
        await tx.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            totalDays: lt.defaultDays,
            usedDays: 0,
            year: currentYear,
          },
        });
      }

      return employee;
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !(await isCurrentManager(session))) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const rawIds: string[] = Array.isArray(body?.ids)
      ? body.ids
      : body?.id
      ? [body.id]
      : [];

    const ids = rawIds.filter((id) => typeof id === 'string' && id.trim().length > 0);

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid staff IDs provided for deletion' }, { status: 400 });
    }

    // Fetch the employees to be deleted
    const employeesToDelete = await prisma.employee.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (employeesToDelete.length === 0) {
      return NextResponse.json({ error: 'No matching staff members found' }, { status: 404 });
    }

    // Safety check: Manager cannot delete their own account
    const includesSelf = employeesToDelete.some(
      (emp) => emp.id === session.employeeId || emp.userId === session.userId
    );
    if (includesSelf) {
      return NextResponse.json(
        { error: 'Cannot delete your own manager account. Please deselect yourself and try again.' },
        { status: 400 }
      );
    }

    const validIds = employeesToDelete.map((emp) => emp.id);
    const validUserIds = employeesToDelete
      .map((emp) => emp.userId)
      .filter((uid): uid is string => Boolean(uid));

    const count = await prisma.$transaction(async (tx) => {
      // 1. Unlink subordinates
      await tx.employee.updateMany({
        where: { managerId: { in: validIds } },
        data: { managerId: null },
      });

      // 2. Delete all related records
      await tx.attendanceRecord.deleteMany({
        where: { employeeId: { in: validIds } },
      });

      await tx.leaveRequest.deleteMany({
        where: { employeeId: { in: validIds } },
      });

      await tx.leaveBalance.deleteMany({
        where: { employeeId: { in: validIds } },
      });

      await tx.payslip.deleteMany({
        where: { employeeId: { in: validIds } },
      });

      // 3. Delete employee records
      const deleted = await tx.employee.deleteMany({
        where: { id: { in: validIds } },
      });

      // 4. Delete associated user accounts
      if (validUserIds.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: validUserIds } },
        });
      }
      return deleted.count;
    });

    return NextResponse.json({
      success: true,
      count,
      message: count === 0
        ? 'No staff members remained to delete'
        : `Successfully deleted ${count} staff member${count > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Batch delete employees error:', error);
    return NextResponse.json({ error: 'Failed to delete staff members' }, { status: 500 });
  }
}


