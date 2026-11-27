import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EmploymentStatus, PayrollStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

const generatePayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};
    if (session.role === Role.EMPLOYEE) {
      if (!session.employeeId) {
        return NextResponse.json({ payslips: [] });
      }
      where.employeeId = session.employeeId;
    }

    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({ payslips });
  } catch (error) {
    console.error('Fetch payslips error:', error);
    return NextResponse.json({ error: 'Failed to fetch payslips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = generatePayrollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const { month, year } = parsed.data;

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { status: EmploymentStatus.ACTIVE },
    });

    if (employees.length === 0) {
      return NextResponse.json({ error: 'No active employees found to generate payroll' }, { status: 400 });
    }

    const createdPayslips = [];

    for (const emp of employees) {
      const baseSalary = Number(emp.baseSalary) / 12; // Monthly base
      const allowances = baseSalary * 0.15; // 15% standard benefits & allowances
      const deductions = baseSalary * 0.10; // 10% standard tax/statutory deduction
      const netSalary = baseSalary + allowances - deductions;

      const payslip = await prisma.payslip.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
        update: {
          basicSalary: baseSalary,
          allowances,
          deductions,
          netSalary,
          status: PayrollStatus.PAID,
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          basicSalary: baseSalary,
          allowances,
          deductions,
          netSalary,
          status: PayrollStatus.PAID,
        },
      });

      createdPayslips.push(payslip);
    }

    // Fire-and-forget: notify each employee their payslip is ready
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const monthLabel = monthNames[(month - 1)] ?? `Month ${month}`;
    const employeesWithUsers = await prisma.employee.findMany({
      where: { status: EmploymentStatus.ACTIVE },
      select: { userId: true },
    });
    Promise.allSettled(
      employeesWithUsers.map((emp) =>
        sendPushToUser(emp.userId, {
          title: '💰 Payslip Published',
          body: `Your ${monthLabel} ${year} payslip is ready. Tap to view.`,
          url: '/payroll',
          tag: `payslip-${month}-${year}`,
        })
      )
    ).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Successfully processed payroll for ${createdPayslips.length} employees`,
      count: createdPayslips.length,
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}

