import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS_TIMEZONE,
  todayInBusinessTz,
  slotToInstant,
  formatDateLabel,
} from './time.js';

test('BUSINESS_TIMEZONE es America/Lima', () => {
  assert.equal(BUSINESS_TIMEZONE, 'America/Lima');
});

test('slotToInstant convierte hora de pared de Lima (UTC-5) a UTC', () => {
  assert.equal(slotToInstant('2026-12-01', '09:00').toISOString(), '2026-12-01T14:00:00.000Z');
  assert.equal(slotToInstant('2026-12-01', '00:00').toISOString(), '2026-12-01T05:00:00.000Z');
  assert.equal(slotToInstant('2026-12-01', '23:59').toISOString(), '2026-12-02T04:59:00.000Z');
});

test('slotToInstant devuelve un Date', () => {
  assert.ok(slotToInstant('2026-12-01', '10:30') instanceof Date);
});

test('slotToInstant acepta 29 de febrero en año bisiesto', () => {
  assert.equal(slotToInstant('2028-02-29', '10:00').toISOString(), '2028-02-29T15:00:00.000Z');
});

test('slotToInstant lanza error si la fecha no es YYYY-MM-DD', () => {
  assert.throws(() => slotToInstant('2026-1-01', '09:00'), /Formato inválido/);
  assert.throws(() => slotToInstant('01/12/2026', '09:00'), /Formato inválido/);
});

test('slotToInstant lanza error si la hora no es HH:mm válida', () => {
  assert.throws(() => slotToInstant('2026-12-01', '24:00'), /Formato inválido/);
  assert.throws(() => slotToInstant('2026-12-01', '9:00'), /Formato inválido/);
  assert.throws(() => slotToInstant('2026-12-01', '10:60'), /Formato inválido/);
});

test('slotToInstant lanza error si date o time son null/undefined', () => {
  assert.throws(() => slotToInstant(undefined, '09:00'), /Formato inválido/);
  assert.throws(() => slotToInstant('2026-12-01', null), /Formato inválido/);
});

test('slotToInstant rechaza fechas inexistentes', () => {
  assert.throws(() => slotToInstant('2026-02-30', '09:00'), /Fecha inexistente/);
  assert.throws(() => slotToInstant('2027-02-29', '09:00'), /Fecha inexistente/);
  assert.throws(() => slotToInstant('2026-13-01', '09:00'), /Fecha inexistente/);
});

test('slotToInstant respeta el offset DST de una zona explícita', () => {
  // America/New_York: EST (UTC-5) en enero, EDT (UTC-4) en julio.
  assert.equal(
    slotToInstant('2026-01-15', '12:00', 'America/New_York').toISOString(),
    '2026-01-15T17:00:00.000Z',
  );
  assert.equal(
    slotToInstant('2026-07-01', '12:00', 'America/New_York').toISOString(),
    '2026-07-01T16:00:00.000Z',
  );
});

test('slotToInstant en Lima no cambia de offset entre verano e invierno', () => {
  assert.equal(slotToInstant('2026-01-15', '08:00').toISOString(), '2026-01-15T13:00:00.000Z');
  assert.equal(slotToInstant('2026-07-15', '08:00').toISOString(), '2026-07-15T13:00:00.000Z');
});

test('todayInBusinessTz usa el día de Lima, no el día UTC', () => {
  // 03:00 UTC del 1 dic = 22:00 del 30 nov en Lima.
  assert.equal(todayInBusinessTz(new Date('2026-12-01T03:00:00Z')), '2026-11-30');
  // 05:00 UTC del 1 dic = 00:00 del 1 dic en Lima.
  assert.equal(todayInBusinessTz(new Date('2026-12-01T05:00:00Z')), '2026-12-01');
});

test('todayInBusinessTz acepta una zona horaria explícita', () => {
  // 20:00 UTC del 1 dic = 05:00 del 2 dic en Tokio.
  assert.equal(
    todayInBusinessTz(new Date('2026-12-01T20:00:00Z'), 'Asia/Tokyo'),
    '2026-12-02',
  );
});

test('todayInBusinessTz devuelve el formato YYYY-MM-DD', () => {
  assert.match(todayInBusinessTz(new Date('2026-03-05T12:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('formatDateLabel devuelve etiqueta en español por defecto', () => {
  assert.equal(formatDateLabel('2026-12-01'), 'martes, 1 de diciembre');
});

test('formatDateLabel no cambia el día por el offset de zona', () => {
  // Si se formateara en Lima, 2026-03-02 podría caer en el día anterior.
  assert.equal(formatDateLabel('2026-03-02'), 'lunes, 2 de marzo');
});

test('formatDateLabel acepta un locale distinto', () => {
  assert.equal(formatDateLabel('2026-12-01', 'en-US'), 'Tuesday, December 1');
});

test('formatDateLabel devuelve cadena vacía si la fecha es inválida', () => {
  assert.equal(formatDateLabel('2026/12/01'), '');
  assert.equal(formatDateLabel(undefined), '');
});
