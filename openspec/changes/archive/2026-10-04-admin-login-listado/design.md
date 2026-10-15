## Context

Next.js 16 (App Router): `middleware` se llama ahora **Proxy** (`src/proxy.js`); `cookies()` es async. Ya existen `src/lib/db.js` (Prisma+Neon) y el modelo `Reservation`. ADR-0008 fija: clave en env var, cookie firmada HttpOnly/Secure con expiración, verificación server-side en `/admin` y `/api/admin/*`.

## Goals / Non-Goals

**Goals:** login simple, protección real server-side, listado ordenado.
**Non-Goals:** cuentas/roles, recuperación de clave, throttling, paginación, filtros, logout, cancelación (POC, ver TECH-DESIGN "Riesgos aceptados").

## Decisions

- **Token = `<expMs>.<hex(HMAC-SHA256(secret, expMs))>`**, vía Web Crypto (`crypto.subtle`), válido en Proxy y en runtime Node. Sin dependencias (descartado JWT: más superficie para un único claim).
- **Comparación en tiempo constante** de la clave: se calcula HMAC de ambas con el secreto y se comparan los digests byte a byte; la firma de la cookie también se compara en tiempo constante.
- **Dos capas**: el Proxy es solo barrera optimista (redirect/401 temprano); la verificación autoritativa (`verifyAdminSession`) se repite en el route handler y en la página `/admin`. Un endpoint nuevo bajo `/api/admin/*` queda cubierto por el Proxy aunque olvide la verificación.
- **Sin configuración = cerrado**: si falta `ADMIN_PASSWORD` o `ADMIN_SESSION_SECRET`, el login responde 500 y ninguna sesión verifica (nunca se asume un default).
- **Duración de sesión**: `ADMIN_SESSION_TTL_HOURS`, default 168 (7 días) — supuesto, el PRD no lo fija.
- **`Secure`** solo cuando `NODE_ENV === 'production'` para poder probar en `http://localhost` con `next dev`.
- **Listado**: función `listReservations()` (`orderBy: [{date:'asc'},{time:'asc'}]`) usada por la página (Server Component, `force-dynamic`) y por la API. `date` se muestra como `YYYY-MM-DD` desde el `Date` de Prisma (`toISOString().slice(0,10)`); no se construyen instantes (ADR-0010 intacto, `src/lib/time.js` no se necesita). Se exponen solo campos necesarios; `idempotencyKey` no se devuelve.
- Respuestas de login: 200 `{ok:true}` + cookie; 401 `{error:"INVALID_PASSWORD"}`; 422 `VALIDATION_ERROR` si falta `password`. El login se hace con `fetch` desde un componente cliente y luego `router.replace('/admin')`.
- UI con tokens de `tailwind.config.js`, sin colores hardcodeados.

## Risks / Trade-offs

- Sin throttling ni revocación: aceptados (POC). Rotar `ADMIN_SESSION_SECRET` invalida todas las sesiones.
- Nuevo secreto a gestionar (consecuencia ya aceptada en ADR-0008).

## Supuestos

- TTL por defecto 7 días. `BUSINESS_TIMEZONE = 'America/Lima'` confirmado, no se usa aquí.
