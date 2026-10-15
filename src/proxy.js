// Barrera optimista (ADR-0008). La verificación autoritativa se repite en cada handler/página.
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from './lib/admin-auth.js';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const ok = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
