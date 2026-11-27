import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { LeaveStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { sendPushToManagers } from '@/lib/push';
import {
  MONTHLY_LEAVE_LIMIT,
  ensureDefaultLeaveType,
  getMonthlyLeaveUsage,
  splitRangeByMonth,
  toUTCDateOnly,
} from '@/lib/leave-policy';

export const dynamic = 'force-dynamic';

const applyLeaveSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
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
        return NextResponse.json({ requests: [], monthlyBalance: null });
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
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const monthlyBalance = session.employeeId
      ? await getMonthlyLeaveUsage(prisma, session.employeeId, now.getFullYear(), now.getMonth())
      : null;

    return NextResponse.json({ requests, monthlyBalance });
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

    const { startDate, endDate, reason } = parsed.data;

    const start = toUTCDateOnly(startDate);
    const end = toUTCDateOnly(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
    }

    const daysCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    // Enforce max 2 leave days per calendar month for all staff
    const monthSlices = splitRangeByMonth(start, end);
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    for (const slice of monthSlices) {
      const usage = await getMonthlyLeaveUsage(prisma, session.employeeId, slice.year, slice.monthIndex0);
      if (usage.committedDays + slice.days > MONTHLY_LEAVE_LIMIT) {
        const monthLabel = monthFormatter.format(new Date(Date.UTC(slice.year, slice.monthIndex0, 1)));
        return NextResponse.json(
          {
            error: `Monthly leave limit is ${MONTHLY_LEAVE_LIMIT} days per month. You have ${usage.remainingDays} day(s) remaining for ${monthLabel}.`,
          },
          { status: 400 }
        );
      }
    }

    const defaultLeaveType = await ensureDefaultLeaveType(prisma);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: session.employeeId,
        leaveTypeId: defaultLeaveType.id,
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
      body: `${employee?.firstName ?? 'An employee'} ${employee?.lastName ?? ''} has submitted a leave request (${daysCount} day${daysCount > 1 ? 's' : ''}).`,
      url: '/leaves',
      tag: `leave-submitted-${leaveRequest.id}`,
    }).catch(console.error); // fire-and-forget, don't block the response

    return NextResponse.json({ success: true, leaveRequest }, { status: 201 });
  } catch (error) {
    console.error('Apply leave error:', error);
    return NextResponse.json({ error: 'Failed to submit leave request' }, { status: 500 });
  }
}

