import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { TokenPayload } from '@/lib/auth';

export async function isCurrentManager(session: TokenPayload | null): Promise<boolean> {
  if (!session || session.role !== Role.MANAGER) return false;

  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, isActive: true },
  });

  return account?.isActive === true && account.role === Role.MANAGER;
}
