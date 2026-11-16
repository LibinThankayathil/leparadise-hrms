import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('lp_hrms_token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/employees', '/departments', '/attendance', '/leaves', '/payroll'];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && token) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  // Prevent Employee role from accessing staff management pages
  if (token && (pathname.startsWith('/employees') || pathname.startsWith('/departments'))) {
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decodedJson);
        if (payload.role === 'EMPLOYEE') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/employees/:path*', '/departments/:path*', '/attendance/:path*', '/leaves/:path*', '/payroll/:path*', '/login'],
};

