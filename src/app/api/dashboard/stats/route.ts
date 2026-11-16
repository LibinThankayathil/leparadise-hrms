import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EmploymentStatus, LeaveStatus, Role } from '@prisma/client';

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
      // Employee-specific dashboard stats
      const [
        totalEmployees,
        totalDepartments,
        myAttendanceToday,
        myPendingLeavesCount,
        myRecentLeaves,
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
      ]);

      return NextResponse.json({
        totalEmployees,
        totalDepartments,
        todayAttendanceCount: myAttendanceToday?.clockIn ? 1 : 0,
        pendingLeavesCount: myPendingLeavesCount,
        recentLeaves: myRecentLeaves,
        userRole: session.role,
        isClockedIn: !!myAttendanceToday?.clockIn,
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
