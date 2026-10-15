import { prisma } from '../../../lib/db.js';
import { slotToInstant } from '../../../lib/time.js';
import {
  dateToColumn,
  parseReservationBody,
  serializeReservation,
} from '../../../lib/reservations.js';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };
const json = (body, status) => Response.json(body, { status, headers: noStore });

// POST /api/reservations (ADR-0006, 0007, 0009, 0011)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'VALIDATION_ERROR', fields: ['body'] }, 422);
  }

  const parsed = parseReservationBody(body);
  if (!parsed.data) return json({ error: 'VALIDATION_ERROR', fields: parsed.fields }, 422);
  const d = parsed.data;

  // Se re-valida contra el reloj del servidor en la zona del negocio (ADR-0010).
  if (slotToInstant(d.date, d.time) <= new Date()) {
    return json({ error: 'DATE_IN_PAST' }, 422);
  }

  try {
    const row = await prisma.reservation.create({ data: { ...d, date: dateToColumn(d.date) } });
    return json(serializeReservation(row), 201);
  } catch (err) {
    if (err?.code !== 'P2002') {
      console.error('POST /api/reservations', err);
      return json({ error: 'INTERNAL_ERROR' }, 500);
    }
    // Dos constraints únicas (ADR-0011): se desambigua por la clave, no por el nombre del índice.
    try {
      const existing = await prisma.reservation.findUnique({
        where: { idempotencyKey: d.idempotencyKey },
      });
      if (existing) return json(serializeReservation(existing), 200);
      return json({ error: 'SLOT_TAKEN' }, 409);
    } catch (err2) {
      console.error('POST /api/reservations (replay lookup)', err2);
      return json({ error: 'INTERNAL_ERROR' }, 500);
    }
  }
}
