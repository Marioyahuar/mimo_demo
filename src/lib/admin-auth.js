// Sesión de admin (ADR-0008): cookie firmada con HMAC-SHA256 (Web Crypto, válido en Proxy y Node).
// Formato del valor: `<expiraEnMs>.<firmaHex>`.
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin_session';
const DEFAULT_TTL_HOURS = 168; // supuesto: el PRD no fija la duración

const enc = new TextEncoder();

export function sessionTtlSeconds() {
  const h = Number(process.env.ADMIN_SESSION_TTL_HOURS);
  return Math.round((Number.isFinite(h) && h > 0 ? h : DEFAULT_TTL_HOURS) * 3600);
}

async function hmacBytes(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** true si la configuración mínima del admin está presente. */
export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

/** Compara la clave en tiempo constante (se comparan HMACs de ambas). */
export async function passwordMatches(candidate) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const real = process.env.ADMIN_PASSWORD;
  if (!secret || !real || typeof candidate !== 'string') return false;
  const [a, b] = await Promise.all([hmacBytes(secret, `pw:${candidate}`), hmacBytes(secret, `pw:${real}`)]);
  return equalBytes(a, b);
}

export async function createSessionToken(now = Date.now()) {
  const exp = String(now + sessionTtlSeconds() * 1000);
  const sig = toHex(await hmacBytes(process.env.ADMIN_SESSION_SECRET, `session:${exp}`));
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token, now = Date.now()) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || typeof token !== 'string') return false;
  const m = /^(\d{1,16})\.([0-9a-f]{64})$/.exec(token);
  if (!m) return false;
  const expected = await hmacBytes(secret, `session:${m[1]}`);
  const given = Uint8Array.from(m[2].match(/../g), (h) => parseInt(h, 16));
  if (!equalBytes(expected, given)) return false;
  return Number(m[1]) > now;
}

/** Verificación autoritativa desde Server Components / route handlers. */
export async function hasValidAdminSession() {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}
