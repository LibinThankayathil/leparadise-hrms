import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    console.log('Testing connection to Supabase PostgreSQL database...');
    const result = await prisma.$queryRaw`SELECT 1 as connected, NOW() as server_time, version();`;
    console.log('Database connected successfully:', result);
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

