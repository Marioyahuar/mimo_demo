## 1. Entorno

- [x] 1.1 Crear rama Neon `dev/endpoints-reserva-idempotente-disponibilidad`, aplicar migraciones Prisma allí y apuntar `.env.local` (local, no commiteado) a esa rama

## 2. Implementación

- [x] 2.1 `src/lib/reservations.js`: validación del payload, serialización de reserva y helpers de fecha de columna
- [x] 2.2 `src/app/api/reservations/route.js`: POST con orden validación -> DATE_IN_PAST -> INSERT -> desambiguación P2002
- [x] 2.3 `src/app/api/reservations/availability/route.js`: GET de horarios ocupados

## 3. Verificación

- [x] 3.1 `npm run build` en verde
- [x] 3.2 curl contra `npm run dev` + rama dev: 201, replay 200, 409, 422 DATE_IN_PAST, 422 VALIDATION_ERROR, availability
- [x] 3.3 Prueba de concurrencia (dos POST simultáneos mismo slot) y verificación SQL en la rama dev
