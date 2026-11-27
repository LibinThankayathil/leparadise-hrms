import { LeaveStatus, Prisma, PrismaClient } from '@prisma/client';

export const MONTHLY_LEAVE_LIMIT = 2;

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Ensures the single canonical "Leave" LeaveType exists and returns it.
 */
export async function ensureDefaultLeaveType(db: DbClient) {
  return db.leaveType.upsert({
    where: { code: 'LEAVE' },
    update: { name: 'Leave', defaultDays: MONTHLY_LEAVE_LIMIT },
    create: { name: 'Leave', code: 'LEAVE', defaultDays: MONTHLY_LEAVE_LIMIT },
  });
}

/**
 * Parses a YYYY-MM-DD (or ISO) string into a UTC midnight Date for calendar-safe math.
 */
export function toUTCDateOnly(input: Date | string): Date {
  if (typeof input === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (match) {
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Counts how many calendar days [startUTC, endUTC] (inclusive) fall inside (year, monthIndex0).
 */
export function countDaysInMonth(startUTC: Date, endUTC: Date, year: number, monthIndex0: number): number {
  const monthStart = new Date(Date.UTC(year, monthIndex0, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex0 + 1, 0));

  const overlapStart = startUTC > monthStart ? startUTC : monthStart;
  const overlapEnd = endUTC < monthEnd ? endUTC : monthEnd;

  if (overlapEnd < overlapStart) return 0;
  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
}

/**
 * Returns every (year, monthIndex0) pair touched by [startUTC, endUTC] along with the day count in each.
 */
export function splitRangeByMonth(startUTC: Date, endUTC: Date): Array<{ year: number; monthIndex0: number; days: number }> {
  const result: Array<{ year: number; monthIndex0: number; days: number }> = [];
  let y = startUTC.getUTCFullYear();
  let m = startUTC.getUTCMonth();
  const endY = endUTC.getUTCFullYear();
  const endM = endUTC.getUTCMonth();

  while (y < endY || (y === endY && m <= endM)) {
    const days = countDaysInMonth(startUTC, endUTC, y, m);
    if (days > 0) {
      result.push({ year: y, monthIndex0: m, days });
    }
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return result;
}

/**
 * Computes an employee's approved and pending leave days for a given calendar month.
 */
export async function getMonthlyLeaveUsage(
  db: DbClient,
  employeeId: string,
  year: number,
  monthIndex0: number
) {
  const monthStart = new Date(Date.UTC(year, monthIndex0, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex0 + 1, 0));

  const requests = await db.leaveRequest.findMany({
    where: {
      employeeId,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    select: {
      startDate: true,
      endDate: true,
      status: true,
    },
  });

  let usedDays = 0;
  let pendingDays = 0;

  for (const req of requests) {
    const days = countDaysInMonth(
      toUTCDateOnly(req.startDate),
      toUTCDateOnly(req.endDate),
      year,
      monthIndex0
    );
    if (req.status === LeaveStatus.APPROVED) {
      usedDays += days;
    } else {
      pendingDays += days;
    }
  }

  const committedDays = usedDays + pendingDays;
  return {
    limit: MONTHLY_LEAVE_LIMIT,
    usedDays,
    pendingDays,
    committedDays,
    remainingDays: Math.max(0, MONTHLY_LEAVE_LIMIT - committedDays),
    month: monthIndex0 + 1,
    year,
  };
}

