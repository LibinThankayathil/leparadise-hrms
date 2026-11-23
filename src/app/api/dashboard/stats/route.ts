import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AttendanceStatus, EmploymentStatus, LeaveStatus, Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isEmployee = session.role === Role.EMPLOYEE;

    if (isEmployee) {
      // Start and end of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      // Employee-specific dashboard stats
      const [
        totalEmployees,
        totalDepartments,
        myAttendanceToday,
        myPendingLeavesCount,
        myRecentLeaves,
        monthRecords,
      ] = await Promise.all([
        prisma.employee.count({ where: { status: EmploymentStatus.ACTIVE } }),
        prisma.department.count(),
        session.employeeId
          ? prisma.attendanceRecord.findFirst({
              where: { employeeId: session.employeeId, date: today },
            })
          : null,
        session.employeeId
          ? prisma.leaveRequest.count({
              where: { employeeId: session.employeeId, status: LeaveStatus.PENDING },
            })
          : 0,
        session.employeeId
          ? prisma.leaveRequest.findMany({
              where: { employeeId: session.employeeId },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                employee: { select: { firstName: true, lastName: true, employeeCode: true } },
                leaveType: true,
              },
            })
          : [],
        session.employeeId
          ? prisma.attendanceRecord.findMany({
              where: {
                employeeId: session.employeeId,
                date: { gte: startOfMonth, lte: endOfMonth },
              },
              select: { status: true },
            })
          : [],
      ]);

      const presentCount = monthRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
      const lateCount = monthRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
      const totalLogged = presentCount + lateCount;
      const onTimeRate = totalLogged > 0 ? Math.round((presentCount / totalLogged) * 100) : 100;

      return NextResponse.json({
        totalEmployees,
        totalDepartments,
        todayAttendanceCount: myAttendanceToday?.clockIn ? 1 : 0,
        pendingLeavesCount: myPendingLeavesCount,
        recentLeaves: myRecentLeaves,
        userRole: session.role,
        isClockedIn: !!myAttendanceToday?.clockIn,
        monthStats: {
          totalLogged,
          presentCount,
          lateCount,
          onTimeRate,
        },
      });
    }

    // Manager resort-wide stats
    const [
      totalEmployees,
      totalDepartments,
      todayAttendanceCount,
      pendingLeavesCount,
      recentLeaves,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: EmploymentStatus.ACTIVE } }),
      prisma.department.count(),
      prisma.attendanceRecord.count({ where: { date: today } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
      prisma.leaveRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeCode: true } },
          leaveType: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalEmployees,
      totalDepartments,
      todayAttendanceCount,
      pendingLeavesCount,
      recentLeaves,
      userRole: session.role,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
