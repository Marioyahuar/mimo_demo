// Módulo único de tiempo del negocio (ADR-0010).
// `date`/`time` son hora de pared del negocio. Nadie debe construir un Date a partir de
// ellos fuera de este archivo: usar slotToInstant() / todayInBusinessTz().

// Zona del negocio confirmada con el dueño del spa: America/Lima (ADR-0010).
export const BUSINESS_TIMEZONE = 'America/Lima';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formatterCache = new Map();
function partsFormatter(timeZone) {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

// Offset (ms) de `timeZone` respecto de UTC en el instante `ms`.
function zoneOffsetMs(ms, timeZone) {
  const p = {};
  for (const { type, value } of partsFormatter(timeZone).formatToParts(new Date(ms))) {
    p[type] = Number(value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** 'YYYY-MM-DD' del día actual en la zona del negocio. */
export function todayInBusinessTz(now = new Date(), timeZone = BUSINESS_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Instante UTC (Date) que corresponde a `date` ('YYYY-MM-DD') y `time` ('HH:mm', 24h)
 * como hora de pared en la zona del negocio. Lanza Error si el formato es inválido.
 * `timeZone` es opcional y solo existe para poder verificar zonas con DST.
 */
export function slotToInstant(date, time, timeZone = BUSINESS_TIMEZONE) {
  const d = DATE_RE.exec(date ?? '');
  const t = TIME_RE.exec(time ?? '');
  if (!d || !t) throw new Error(`Formato inválido de date/time: ${date} ${time}`);
  const [y, mo, da, h, mi] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  const naive = Date.UTC(y, mo - 1, da, h, mi);
  const check = new Date(naive);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== da) {
    throw new Error(`Fecha inexistente: ${date}`);
  }
  // Dos pasadas para estabilizar el offset alrededor de cambios de horario.
  let guess = naive - zoneOffsetMs(naive, timeZone);
  guess = naive - zoneOffsetMs(guess, timeZone);
  return new Date(guess);
}

/**
 * Etiqueta legible ('martes, 1 de diciembre') de `date` ('YYYY-MM-DD'). Es solo calendario,
 * sin zona: se formatea a mediodía UTC para que ningún offset cambie el día.
 */
export function formatDateLabel(date, locale = 'es-ES') {
  const d = DATE_RE.exec(date ?? '');
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), 12)));
}
