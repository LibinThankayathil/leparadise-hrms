import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { isCurrentManager } from '@/lib/employee-access';
import { Role, EmploymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const emailConflict = 'Email address is already in use by another account';
const codeConflict = 'Employee code is already in use';

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).refine(
    (password) => Buffer.byteLength(password, 'utf8') <= 72,
    { message: 'Password must be at most 72 UTF-8 bytes' }
  ).optional(),
  role: z.nativeEnum(Role).optional(),
  employeeCode: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  designation: z.string().min(1).optional(),
  managerId: z.string().optional().nullable(),
  baseSalary: z.number().min(0).optional(),
  status: z.nativeEnum(EmploymentStatus).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== Role.MANAGER || !(await isCurrentManager(session))) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { id } = params;
    const currentYear = new Date().getFullYear();

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, createdAt: true } },
        department: { select: { id: true, name: true, description: true } },
        manager: { select: { id: true, firstName: true, lastName: true, designation: true, employeeCode: true } },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, designation: true, employeeCode: true, status: true },
        },
        leaveBalances: {
          where: { year: currentYear },
          include: { leaveType: true },
        },
        leaveRequests: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: { leaveType: true },
        },
        payslips: {
          take: 12,
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
        attendanceRecords: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Compute tenure
    const joinDate = new Date(employee.dateOfJoining);
    const now = new Date();
    const diffMonths = Math.max(
      0,
      (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
    );
    const tenureYears = Math.floor(diffMonths / 12);
    const tenureRemainingMonths = diffMonths % 12;
    const tenureString =
      tenureYears > 0
        ? `${tenureYears} yr${tenureYears > 1 ? 's' : ''} ${tenureRemainingMonths} mo${tenureRemainingMonths !== 1 ? 's' : ''}`
        : `${tenureRemainingMonths} month${tenureRemainingMonths !== 1 ? 's' : ''}`;

    // Compute attendance statistics
    const attendanceLogs = employee.attendanceRecords;
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;

    attendanceLogs.forEach((rec) => {
      if (rec.status === 'PRESENT') presentCount++;
      else if (rec.status === 'LATE') lateCount++;
      else if (rec.status === 'HALF_DAY') halfDayCount++;
      else if (rec.status === 'ABSENT') absentCount++;
    });

    const totalLogs = attendanceLogs.length;
    const punctualityRate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 100;
    const attendanceHealthRate =
      totalLogs > 0 ? Math.round(((presentCount + lateCount + halfDayCount) / totalLogs) * 100) : 100;

    return NextResponse.json({
      employee,
      stats: {
        tenureString,
        tenureMonths: diffMonths,
        attendance: {
          totalLogs,
          presentCount,
          lateCount,
          halfDayCount,
          absentCount,
          punctualityRate,
          attendanceHealthRate,
        },
      },
    });
  } catch (error) {
    console.error('Fetch employee error:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !(await isCurrentManager(session))) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { id } = params;
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify employee exists
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // If email is changing, check uniqueness
    if (data.email && data.email !== existing.user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        return NextResponse.json({ error: emailConflict }, { status: 409 });
      }
    }

    // If employeeCode is changing, check uniqueness
    if (data.employeeCode && data.employeeCode !== existing.employeeCode) {
      const codeTaken = await prisma.employee.findUnique({
        where: { employeeCode: data.employeeCode },
      });
      if (codeTaken) {
        return NextResponse.json({ error: codeConflict }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update User record (email, role, password)
      const userUpdate: any = {};
      if (data.email) userUpdate.email = data.email;
      if (data.role) userUpdate.role = data.role;
      if (data.password) userUpdate.passwordHash = await hashPassword(data.password);
      if (data.status === EmploymentStatus.TERMINATED) {
        userUpdate.isActive = false;
      } else if (data.status === EmploymentStatus.ACTIVE) {
        userUpdate.isActive = true;
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: userUpdate,
        });
      }

      // Update Employee record
      const employeeUpdate: any = {};
      if (data.firstName !== undefined) employeeUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) employeeUpdate.lastName = data.lastName;
      if (data.employeeCode !== undefined) employeeUpdate.employeeCode = data.employeeCode;
      if (data.phone !== undefined) employeeUpdate.phone = data.phone || null;
      if (data.departmentId !== undefined) employeeUpdate.departmentId = data.departmentId || null;
      if (data.designation !== undefined) employeeUpdate.designation = data.designation;
      if (data.managerId !== undefined) employeeUpdate.managerId = data.managerId || null;
      if (data.baseSalary !== undefined) employeeUpdate.baseSalary = data.baseSalary;
      if (data.status !== undefined) employeeUpdate.status = data.status;

      const employee = await tx.employee.update({
        where: { id },
        data: employeeUpdate,
        include: {
          user: { select: { email: true, role: true, isActive: true } },
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return employee;
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      if (target === 'users_email_key' || (Array.isArray(target) && target.includes('email'))) {
        return NextResponse.json({ error: emailConflict }, { status: 409 });
      }
      if (target === 'employees_employeeCode_key' || (Array.isArray(target) && target.includes('employeeCode'))) {
        return NextResponse.json({ error: codeConflict }, { status: 409 });
      }
    }
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !(await isCurrentManager(session))) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { id } = params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Safety check: Manager cannot delete their own account
    if (session.employeeId === employee.id || session.userId === employee.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own manager account' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unlink subordinates
      await tx.employee.updateMany({
        where: { managerId: employee.id },
        data: { managerId: null },
      });

      // 2. Delete all related records
      await tx.attendanceRecord.deleteMany({
        where: { employeeId: employee.id },
      });

      await tx.leaveRequest.deleteMany({
        where: { employeeId: employee.id },
      });

      await tx.leaveBalance.deleteMany({
        where: { employeeId: employee.id },
      });

      await tx.payslip.deleteMany({
        where: { employeeId: employee.id },
      });

      // 3. Delete employee record
      await tx.employee.delete({
        where: { id: employee.id },
      });

      // 4. Delete user account
      if (employee.userId) {
        await tx.user.delete({
          where: { id: employee.userId },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${employee.firstName} ${employee.lastName} was deleted successfully`,
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}

