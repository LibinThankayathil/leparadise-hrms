import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createDeptSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role === Role.EMPLOYEE) {
      return NextResponse.json({ error: 'Forbidden: Staff cannot access department management' }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createDeptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}

