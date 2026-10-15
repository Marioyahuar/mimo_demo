import { NextResponse } from 'next/server';
import { hasValidAdminSession } from '../../../../lib/admin-auth.js';
import { listReservations } from '../../../../lib/admin-reservations.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  return NextResponse.json({ reservations: await listReservations() });
}
