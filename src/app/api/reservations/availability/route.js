import { prisma } from '../../../../lib/db.js';
import { dateToColumn, isValidDate } from '../../../../lib/reservations.js';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

// GET /api/reservations/availability?date=YYYY-MM-DD (ADR-0006)
export async function GET(request) {
  const date = new URL(request.url).searchParams.get('date');
  if (!date || !isValidDate(date)) {
    return Response.json(
      { error: 'VALIDATION_ERROR', fields: ['date'] },
      { status: 422, headers: noStore },
    );
  }
  try {
    const rows = await prisma.reservation.findMany({
      where: { date: dateToColumn(date) },
      select: { time: true },
      orderBy: { time: 'asc' },
    });
    return Response.json({ date, occupied: rows.map((r) => r.time) }, { headers: noStore });
  } catch (err) {
    console.error('GET /api/reservations/availability', err);
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500, headers: noStore });
  }
}
