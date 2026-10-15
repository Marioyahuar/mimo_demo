import { prisma } from './db.js';

/** Todas las reservas, por fecha y luego hora ascendente. `date` sale como 'YYYY-MM-DD'. */
export async function listReservations() {
  const rows = await prisma.reservation.findMany({
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    omit: { idempotencyKey: true },
  });
  return rows.map((r) => ({
    ...r,
    date: r.date.toISOString().slice(0, 10),
    createdAt: r.createdAt.toISOString(),
  }));
}
