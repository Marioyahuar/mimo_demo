import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminConfigured, createSessionToken, passwordMatches, sessionTtlSeconds } from '../../../../lib/admin-auth.js';

export async function POST(request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'SERVER_MISCONFIGURED' }, { status: 500 });
  }
  let body = null;
  try {
    body = await request.json();
  } catch {}
  const password = body?.password;
  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', fields: ['password'] }, { status: 422 });
  }
  if (!(await passwordMatches(password))) {
    return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionTtlSeconds(),
  });
  return res;
}
