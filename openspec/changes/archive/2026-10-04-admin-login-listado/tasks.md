## 1. Autenticación

- [x] 1.1 Crear `src/lib/admin-auth.js` (firma/verificación HMAC con Web Crypto, comparación en tiempo constante, TTL por env, `isAdminRequest`/`verifyAdminSession`)
- [x] 1.2 Crear `src/proxy.js` con matcher `/admin/:path*` y `/api/admin/:path*` (excluye login) que redirige/401 sin cookie válida

## 2. API

- [x] 2.1 Crear `src/app/api/admin/login/route.js` (POST: 422/401/500/200 + cookie)
- [x] 2.2 Crear `src/lib/admin-reservations.js` con `listReservations()` ordenado por fecha y hora ascendente
- [x] 2.3 Crear `src/app/api/admin/reservations/route.js` (GET, verifica cookie, 401 si no)

## 3. UI

- [x] 3.1 Crear `src/app/admin/login/page.jsx` + formulario cliente
- [x] 3.2 Implementar `src/app/admin/page.jsx` (verifica sesión, redirect, tabla de reservas con tokens Tailwind)

## 4. Configuración y verificación

- [x] 4.1 Documentar `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_SESSION_TTL_HOURS` en `.env.example`
- [x] 4.2 Rama Neon `dev/admin-login-listado`; insertar reservas de prueba desordenadas
- [x] 4.3 `npm run build` y pruebas con `curl` (401, login, cookie manipulada, orden, redirect de `/admin`)
