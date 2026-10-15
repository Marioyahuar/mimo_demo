## Context

ADR-0010 exige un módulo único para tiempo. `ReservarCita.jsx` ya calcula `today` con `Intl.DateTimeFormat('en-CA', {timeZone:'America/Lima'})` inline; hay que centralizarlo. El módulo debe ser JS puro (sin APIs de Next) para usarse en cliente y rutas API.

## Goals / Non-Goals

**Goals:** `src/lib/time.js` con las tres exportaciones; date picker lo consume; verificable con script de Node.
**Non-Goals:** endpoints, validación `DATE_IN_PAST` (ítem #4), validar `time` contra el catálogo (riesgo aceptado POC), tocar la base de datos.

## Decisions

- `BUSINESS_TIMEZONE` como constante en el módulo, no env var (ADR-0010 / TDD).
- `todayInBusinessTz(now = new Date())`: `Intl.DateTimeFormat('en-CA', {timeZone, year, month, day})`; parámetro opcional `now` solo para testear.
- `slotToInstant(date, time, timeZone = BUSINESS_TIMEZONE)` (3er parámetro opcional solo para probar DST): se toma el instante UTC ingenuo `Date.UTC(y,m,d,h,min)` y se calcula el offset de la zona en ese instante con `Intl.DateTimeFormat` (`formatToParts`), restándolo; se re-evalúa una segunda vez para estabilizar en cambios de DST. Valida formato con regex y rechaza fechas inexistentes (round-trip).
- Sin framework de tests en el repo: la verificación usa un script `node` ad hoc (módulo ESM, `"type":"module"`), sin añadir dependencias.

## Assumptions

- **`BUSINESS_TIMEZONE = 'America/Lima'` es el valor por defecto del ADR-0010 y NO está confirmado con el dueño del spa.** Cambiar la constante es un cambio de una línea.

## Risks / Trade-offs

- La corrección depende de la convención de no construir `Date` a mano fuera del módulo (ADR-0010).
- `time` mal formado lanza error; el llamador (#4) debe validar antes o capturar.
