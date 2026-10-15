# Proposal

## Why

Los endpoints de reserva (#4) y el date picker necesitan una única definición de "hoy" y de "este slot ya pasó" en la zona horaria del negocio. Hoy el frontend calcula la fecha con una zona hardcodeada dentro de `ReservarCita.jsx`, y el servidor corre en UTC. Sin un módulo compartido, la validación `DATE_IN_PAST` rechaza o acepta mal reservas (ADR-0010).

## What Changes

- Nuevo módulo `src/lib/time.js` con `BUSINESS_TIMEZONE` (`'America/Lima'`), `todayInBusinessTz()` y `slotToInstant(date, time)`.
- `ReservarCita.jsx` usa `todayInBusinessTz()` para el `min` del date picker, reemplazando el cálculo inline.
- Sin cambios en base de datos ni en endpoints.

## Capabilities

### New Capabilities
- `business-time`: conversión de hora de pared del negocio a instante y cálculo del día actual del negocio, compartido por cliente y servidor.

### Modified Capabilities

## Impact

- Nuevo: `src/lib/time.js`. Modificado: `src/components/booking/ReservarCita.jsx` (una línea + import).
- Sin dependencias nuevas (usa `Intl.DateTimeFormat`).
- ADR-0010. Supuesto: `BUSINESS_TIMEZONE` no confirmado con el dueño.
