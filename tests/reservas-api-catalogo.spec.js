// @ts-check
import { test, expect } from '@playwright/test';

// SP-03: el servidor es la autoridad del catálogo (servicio, precio, extras, tamaño) y del formato de contacto.

// Fecha futura al azar (30-700 días) para que el slot no choque entre ejecuciones (constraint única fecha+hora).
function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 670));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const SLOTS = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'];

const validBody = () => ({
  serviceTitle: 'Peluquería canina',
  servicePriceLabel: 'Desde $42',
  extras: ['Ozono & Manzanilla'],
  petName: `Frida-${Date.now()}`,
  petBreed: 'Caniche',
  petSize: 'Mediano',
  petNotes: '',
  date: randomFutureDate(),
  time: SLOTS[Math.floor(Math.random() * SLOTS.length)],
  contactName: 'Camila Peralta',
  contactPhone: '555 123 4567',
  contactEmail: `e2e-${Date.now()}@example.com`,
  idempotencyKey: crypto.randomUUID(),
});

test('el precio guardado sale del catálogo, no del cliente', async ({ request }) => {
  const res = await request.post('/api/reservations', { data: { ...validBody(), servicePriceLabel: 'Desde $1' } });
  expect(res.status()).toBe(201);
  expect((await res.json()).servicePriceLabel).toBe('Desde $42');
});

const invalid = [
  ['serviceTitle', 'Servicio VIP gratis'],
  ['extras', ['Perfume de regalo']],
  ['extras', ['Ozono & Manzanilla', 'Ozono & Manzanilla']],
  ['petSize', 'Gigante'],
  ['contactEmail', 'no-es-un-email'],
  ['contactPhone', 'llámame'],
  ['contactPhone', '123'],
];

for (const [field, value] of invalid) {
  test(`rechaza ${field}=${JSON.stringify(value)} fuera del catálogo o con formato inválido`, async ({ request }) => {
    const res = await request.post('/api/reservations', { data: { ...validBody(), [field]: value } });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toEqual([field]);
  });
}
