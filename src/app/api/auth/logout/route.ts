import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  await clearSessionCookie();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('lp_hrms_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    expires: new Date(0),
  });
  return response;
}

export async function GET(request: Request) {
  await clearSessionCookie();
  const response = NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  response.cookies.set('lp_hrms_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    expires: new Date(0),
  });
  return response;
}

