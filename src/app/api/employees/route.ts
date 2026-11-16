import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
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

