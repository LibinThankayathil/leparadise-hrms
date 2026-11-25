import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AttendanceStatus, LeaveStatus, Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const employeeIdParam = searchParams.get('employeeId');

    const where: any = {};

    // Non-manager (regular employee) can only see their own attendance
    let targetEmployeeId: string | null = null;
    if (session.role === Role.EMPLOYEE) {
      if (!session.employeeId) {
        return NextResponse.json({ records: [], todayRecord: null, approvedLeaves: [] });
      }
      where.employeeId = session.employeeId;
      targetEmployeeId = session.employeeId;
    } else if (employeeIdParam) {
      where.employeeId = employeeIdParam;
      targetEmployeeId = employeeIdParam;
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
      const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (dateStr) {
      const targetDate = new Date(dateStr);
      where.date = targetDate;
    }

    const records = await prisma.attendanceRecord.findMany({
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
      },
      orderBy: { date: 'asc' },
      ...(month && year ? {} : { take: 100 }),
    });

    // Check today's record for logged-in user
    let todayRecord = null;
    if (session.employeeId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      todayRecord = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: session.employeeId,
          date: today,
        },
      });
    }

    // Approved leaves for the target employee (if checking employee attendance)
    let approvedLeaves: any[] = [];
    if (targetEmployeeId) {
      approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: targetEmployeeId,
          status: LeaveStatus.APPROVED,
        },
        include: {
          leaveType: { select: { name: true, code: true } },
        },
      });
    }

    return NextResponse.json({ records, todayRecord, approvedLeaves });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) {
      return NextResponse.json({ error: 'Employee profile not associated with account' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action; // 'CLOCK_IN' | 'CLOCK_OUT'

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    if (action === 'CLOCK_IN') {
      const existing = await prisma.attendanceRecord.findFirst({
        where: { employeeId: session.employeeId, date: today },
      });

      if (existing && existing.clockIn) {
        return NextResponse.json({ error: 'Already clocked in for today' }, { status: 400 });
      }

      // Check if late (e.g. after 9:30 AM)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && minutes > 30);

      const record = await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: session.employeeId,
            date: today,
          },
        },
        update: {
          clockIn: now,
          status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        },
        create: {
          employeeId: session.employeeId,
          date: today,
          clockIn: now,
          status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        },
      });

      return NextResponse.json({ success: true, record });
    }

    if (action === 'CLOCK_OUT') {
      const record = await prisma.attendanceRecord.findFirst({
        where: { employeeId: session.employeeId, date: today },
      });

      if (!record || !record.clockIn) {
        return NextResponse.json({ error: 'You must clock in before clocking out' }, { status: 400 });
      }

      const updated = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { clockOut: now },
      });

      return NextResponse.json({ success: true, record: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Attendance action error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}

