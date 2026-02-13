import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  // Public routes - allow without token
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  // Protected routes - require token
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/students') || 
      pathname.startsWith('/performance') || 
      pathname.startsWith('/import')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/students/:path*', 
    '/performance/:path*',
    '/import/:path*',
    '/login', 
    '/register'
  ]
};