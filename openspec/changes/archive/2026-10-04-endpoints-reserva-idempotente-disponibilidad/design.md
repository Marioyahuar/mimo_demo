## Context

Tabla `reservations` con `UNIQUE(date,time)` y `UNIQUE(idempotency_key)` ya existe (#2); `time.js` ya existe (#3, `BUSINESS_TIMEZONE='America/Lima'` confirmado por el dueño). Next.js 16 App Router: route handlers `route.js` con `Request`/`Response.json` (verificado en `node_modules/next/dist/docs/.../route.md`).

## Goals / Non-Goals

**Goals:** contrato de ADR-0006/0011 exacto; anti doble-booking por la constraint; replay idempotente determinista.
**Non-Goals:** UI, admin, rate limiting, CHECK de `time`, validación contra catálogo de slots (riesgos aceptados POC).

## Decisions

- **Body plano camelCase** que refleja las columnas: `serviceTitle, servicePriceLabel, extras[], petName, petBreed, petSize, petNotes?, date, time, contactName, contactPhone, contactEmail, idempotencyKey`. La respuesta usa los mismos nombres, con `date` como `YYYY-MM-DD` (supuesto: el contrato del TDD no fija nombres de campos; #5 debe mapear el estado de la UI a este shape).
- **Orden de validación:** JSON válido y campos (`VALIDATION_ERROR` con `fields`) -> `DATE_IN_PAST` (`slotToInstant(date,time) <= new Date()`) -> `INSERT`. Formato de `date`/`time` se valida con `slotToInstant` (lanza si inválido) y se reporta como VALIDATION_ERROR sobre `date`/`time`. `idempotencyKey` debe ser UUID.
- **Idempotencia (ADR-0011):** `INSERT` directo sin chequeo previo; ante `P2002` se hace `findUnique({idempotencyKey})`: existe -> `200` con la fila almacenada; no existe -> `409 SLOT_TAKEN`. No se decide por el nombre del índice.
- **Disponibilidad:** `GET ?date=` valida formato con `slotToInstant(date,'00:00')`; responde `{ date, occupied: ["HH:mm", ...] }` ordenado. Fecha ausente/inválida -> `422 VALIDATION_ERROR`. Respuestas con `Cache-Control: no-store` y `dynamic = 'force-dynamic'`.
- **Fecha en DB:** `date` es `@db.Date`; se pasa a Prisma como `new Date(`${date}T00:00:00.000Z`)` (no es una conversión de hora de pared a instante, solo la representación de columna `date` en UTC) y se serializa con `toISOString().slice(0,10)`. "Hoy" y comparación con el reloj salen solo de `time.js`.
- Errores no esperados -> `500 { error: "INTERNAL_ERROR" }` sin filtrar detalles.

## Risks / Trade-offs

- Replay devuelve la fila almacenada, ignorando un payload distinto (aceptado, ADR-0011).
- `time` sin catálogo: `"9:00"` se rechaza por formato `HH:mm`, pero cualquier `HH:mm` pasa (riesgo aceptado POC).
