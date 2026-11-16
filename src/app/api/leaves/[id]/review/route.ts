import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { LeaveStatus, Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewComment: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid review action' }, { status: 400 });
    }

    const { status, reviewComment } = parsed.data;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      return NextResponse.json({ error: 'This request has already been reviewed' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: status as LeaveStatus,
          reviewedById: session.userId,
          reviewedAt: new Date(),
          reviewComment: reviewComment || null,
        },
      });

      // If approved, update leave balance
      if (status === 'APPROVED') {
        const year = leaveRequest.startDate.getFullYear();
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year,
          },
          data: {
            usedDays: {
              increment: Math.round(Number(leaveRequest.daysCount)),
            },
          },
        });
      }

      return result;
    });

    return NextResponse.json({ success: true, leaveRequest: updated });
  } catch (error) {
    console.error('Review leave error:', error);
    return NextResponse.json({ error: 'Failed to review leave request' }, { status: 500 });
  }
}

