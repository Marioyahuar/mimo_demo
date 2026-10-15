## Why

El dueño del spa necesita ver en un solo lugar todas las reservas guardadas, pero esos datos
de clientes no pueden ser públicos. El PRD exige que nadie vea la vista admin sin conocer la
clave, y que la protección sea server-side ([ADR-0008](../../../adrs/0008-autenticacion-admin-cookie-firmada.md)).
Hoy `/admin` es un placeholder vacío (capability `app-shell`).

## What Changes

- `POST /api/admin/login`: valida la clave contra `ADMIN_PASSWORD` y emite una cookie
  `HttpOnly`, `Secure` (en producción), `SameSite=Lax`, firmada con HMAC (`ADMIN_SESSION_SECRET`) y con expiración.
- Módulo `src/lib/admin-auth.js`: firma/verificación de la cookie (Web Crypto, compatible con proxy y route handlers).
- `src/proxy.js` (Proxy de Next 16, antes "middleware"): barrera optimista para `/admin` (redirige a `/admin/login`) y `/api/admin/*` (401).
- Verificación autoritativa de la cookie dentro de `GET /api/admin/reservations` y de la página `/admin` (defensa en profundidad).
- `GET /api/admin/reservations`: todas las reservas ordenadas por fecha y hora ascendente.
- UI: `/admin/login` (formulario de clave) y `/admin` (listado). **BREAKING** respecto del placeholder: `/admin` deja de ser una página vacía.
- Documentar `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` y `ADMIN_SESSION_TTL_HOURS` en `.env.example`.

## Capabilities

### New Capabilities
- `admin-access`: login con clave única, cookie de sesión firmada, protección server-side de `/admin` y `/api/admin/*`, y listado de reservas.

### Modified Capabilities
- `app-shell`: el requisito "Admin route exists as an empty placeholder" queda reemplazado por el comportamiento definido en `admin-access`.

## Impact

- Código nuevo: `src/proxy.js`, `src/lib/admin-auth.js`, `src/app/api/admin/**`, `src/app/admin/**`.
- No toca `/api/reservations` ni `ReservarCita.jsx`. Sin dependencias nuevas.
- Fuera de alcance (riesgos aceptados POC): throttling del login, revocación de sesiones al rotar clave, filtro/paginación del listado.
