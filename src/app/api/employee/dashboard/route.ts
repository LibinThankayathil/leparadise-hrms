import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AttendanceStatus, LeaveStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.employeeId) {
      return NextResponse.json(
        { error: 'Unauthorized: Employee profile required' },
        { status: 401 }
      );
    }

    const employeeId = session.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const nextAttendanceDayAt = new Date(today);
    nextAttendanceDayAt.setDate(today.getDate() + 1);

    // Start and end of current month
    const startOfMonth = new Date(currentYear, today.getMonth(), 1);
    const endOfMonth = new Date(currentYear, today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Start of the last 7 days for the weekly strip
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    // 1. Fetch Profile
    const profile = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        designation: true,
        phone: true,
        dateOfJoining: true,
        status: true,
        baseSalary: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true, designation: true } },
        user: { select: { email: true, role: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // 2. Today's Attendance
    const todayAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    // 3. This Week's Attendance (last 7 days)
    const thisWeekAttendance = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: sevenDaysAgo, lte: today },
      },
      orderBy: { date: 'asc' },
    });

    // 4. Monthly Attendance Stats
    const monthRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { status: true },
    });

    const monthAttendanceStats = {
      totalLogged: monthRecords.length,
      presentCount: monthRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      lateCount: monthRecords.filter((r) => r.status === AttendanceStatus.LATE).length,
      halfDayCount: monthRecords.filter((r) => r.status === AttendanceStatus.HALF_DAY).length,
      absentCount: monthRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length,
    };

    // Fill in missing annual balances without changing existing allocations or usage.
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });
    const leaveBalanceQuery = {
      where: { employeeId, year: currentYear },
      include: { leaveType: true },
      orderBy: { leaveType: { name: 'asc' } },
    } as const;
    let leaveBalances = await prisma.leaveBalance.findMany(leaveBalanceQuery);
    const existingTypeIds = new Set(leaveBalances.map((balance) => balance.leaveTypeId));
    const missingTypes = leaveTypes.filter((type) => !existingTypeIds.has(type.id));

    if (missingTypes.length > 0) {
      await prisma.leaveBalance.createMany({
        data: missingTypes.map((type) => ({
          employeeId,
          leaveTypeId: type.id,
          totalDays: type.defaultDays,
          usedDays: 0,
          year: currentYear,
        })),
        skipDuplicates: true,
      });
      leaveBalances = await prisma.leaveBalance.findMany(leaveBalanceQuery);
    }

    // 6. Recent Leave Requests (up to 5)
    const recentLeaves = await prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Latest Payslip
    const latestPayslip = await prisma.payslip.findFirst({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({
      profile,
      todayAttendance,
      nextAttendanceDayAt,
      thisWeekAttendance,
      monthAttendanceStats,
      leaveBalances,
      recentLeaves,
      latestPayslip,
      leaveTypes,
    });
  } catch (error) {
    console.error('Employee dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load employee self-service dashboard' },
      { status: 500 }
    );
  }
}

