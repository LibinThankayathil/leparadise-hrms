import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { LeaveStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { sendPushToManagers } from '@/lib/push';

export const dynamic = 'force-dynamic';

const applyLeaveSchema = z.object({
  leaveTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: any = {};
    if (session.role === Role.EMPLOYEE) {
      if (!session.employeeId) {
        return NextResponse.json({ requests: [], balances: [], leaveTypes: [] });
      }
      where.employeeId = session.employeeId;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const leaveTypes = await prisma.leaveType.findMany();

    let balances: any[] = [];
    if (session.employeeId) {
      balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId: session.employeeId,
          year: new Date().getFullYear(),
        },
        include: { leaveType: true },
      });
    }

    return NextResponse.json({ requests, balances, leaveTypes });
  } catch (error) {
    console.error('Fetch leaves error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) {
      return NextResponse.json({ error: 'Employee record required to request leave' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = applyLeaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid leave application data' }, { status: 400 });
    }

    const { leaveTypeId, startDate, endDate, reason } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
    }

    // Calculate days count
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const currentYear = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: session.employeeId,
          leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (balance && (balance.usedDays + daysCount > balance.totalDays)) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Remaining: ${balance.totalDays - balance.usedDays} days` },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: session.employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        daysCount,
        reason,
        status: LeaveStatus.PENDING,
      },
      include: {
        leaveType: true,
      },
    });

    // Notify all managers that a new leave request has been submitted
    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { firstName: true, lastName: true },
    });
    sendPushToManagers({
      title: '📋 New Leave Request',
      body: `${employee?.firstName ?? 'An employee'} ${employee?.lastName ?? ''} has submitted a ${leaveRequest.leaveType.name} request.`,
      url: '/leaves',
      tag: `leave-submitted-${leaveRequest.id}`,
    }).catch(console.error); // fire-and-forget, don't block the response

    return NextResponse.json({ success: true, leaveRequest }, { status: 201 });
  } catch (error) {
    console.error('Apply leave error:', error);
    return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 });
  }
}

