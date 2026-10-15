## Context

La API (#4) y `time.js` (#3) están archivadas. `ReservarCita.jsx` es un componente cliente con un `useState` de objeto. Ver ADR-0010, ADR-0011, ADR-0009.

## Goals / Non-Goals

**Goals:** conectar el flujo a la API, errores claros, disponibilidad, WhatsApp.
**Non-Goals:** rate limiting, cancelación, retry automático, cambios en admin/Prisma, notificaciones (PRD No alcance / Riesgos aceptados POC).

## Decisions

- `idempotencyKey` vive en el estado (`emptyState()`); `resetFlow()` llama a `emptyState()` de nuevo, lo que la regenera. Mismo valor entre reintentos.
- Estado adicional separado del "dato de reserva": `submitting`, `error`, `occupied`. `submitting` además se protege con un `useRef` para bloquear doble toque antes del re-render.
- Disponibilidad: `useEffect` sobre `date` con `AbortController`; ante fallo se ignora (fail-open, el servidor es la autoridad, ADR-0007).
- Mapeo de errores en una función pura `errorMessage(status, code, fields)`, copy en `src/data/content.js` (`booking.errors`).
- La confirmación usa la reserva devuelta por la API (`201`/`200`) para el resumen y el mensaje de WhatsApp (en un replay refleja lo almacenado, ADR-0011).
- Helper `formatDateLabel(date)` en `time.js` (formatea con Intl en UTC sobre mediodía UTC) para eliminar `construir Date a mano` del componente.
- WhatsApp: `NEXT_PUBLIC_WHATSAPP_NUMBER` (solo dígitos, con código de país). El PRD/repo no define el número real; no se inventa. Ausente => se oculta el botón.

## Supuestos

- `BUSINESS_TIMEZONE = 'America/Lima'` confirmado por el usuario.
- Los slots del catálogo `booking.slots` se siguen usando; los pasados de hoy no se deshabilitan en cliente (el servidor responde `DATE_IN_PAST`).

## Risks / Trade-offs

- Sin número de WhatsApp configurado el respaldo no aparece: pendiente de dato del negocio.
- Disponibilidad puede quedar desactualizada; el 409 lo cubre.
