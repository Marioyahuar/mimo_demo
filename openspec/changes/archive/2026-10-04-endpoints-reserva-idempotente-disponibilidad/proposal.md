## Why

El flujo de reserva sigue siendo solo-memoria. Para que haya persistencia compartida y 0 reservas dobles (PRD) hacen falta los endpoints públicos que escriban y consulten la tabla `reservations` ya creada (#2), usando el módulo de tiempo (#3). Es el backlog #4 y desbloquea la conexión de la UI (#5).

## What Changes

- Nuevo `POST /api/reservations`: valida en el servidor, rechaza slots pasados (`DATE_IN_PAST`), hace `INSERT` directo y es idempotente por `idempotencyKey` (`201` creada, `200` replay, `409 SLOT_TAKEN`, `422 VALIDATION_ERROR`) (ADR-0006, 0007, 0009, 0011).
- Nuevo `GET /api/reservations/availability?date=YYYY-MM-DD`: devuelve los horarios ocupados del día.
- Helpers internos en `src/lib/` para validación y serialización de reservas.
- Fuera de alcance: UI (`ReservarCita.jsx`, #5), `/api/admin/*` (#6), rate limiting y validación del catálogo de slots (riesgos aceptados POC).

## Capabilities

### New Capabilities
- `reservation-api`: contrato HTTP de creación idempotente de reservas y consulta de disponibilidad.

### Modified Capabilities
<!-- ninguna: reservations-data y business-time se consumen sin cambiar sus requisitos -->

## Impact

- Código nuevo: `src/app/api/reservations/route.js`, `src/app/api/reservations/availability/route.js`, `src/lib/reservations.js`.
- Usa `src/lib/db.js` (Prisma) y `src/lib/time.js` (único origen de "hoy" y de instantes). Sin dependencias ni migraciones nuevas.
