## Why

El flujo `ReservarCita.jsx` confirma solo en memoria del navegador. La API de reservas (#4) ya existe; falta conectarla para que la reserva sea persistente, no haya dobles reservas y el cliente tenga el respaldo de WhatsApp (PRD "Alcance", ADR-0011).

## What Changes

- `ReservarCita.jsx` envía `POST /api/reservations` al confirmar, mapeando su estado al body plano camelCase.
- `idempotencyKey` (`crypto.randomUUID()`) se genera en `emptyState()` y solo se regenera en `resetFlow()` (ADR-0011).
- "Confirmar reserva" queda deshabilitado mientras hay un request en vuelo.
- Se consume `GET /api/reservations/availability` al elegir fecha para deshabilitar horarios ocupados.
- Cada respuesta de error (409, 422 x2, 500, red) se traduce a un mensaje visible sin perder los datos cargados; `SLOT_TAKEN` y `DATE_IN_PAST` devuelven al paso fecha/hora.
- Pantalla de confirmación con botón `wa.me` y mensaje prellenado; el número viene de `NEXT_PUBLIC_WHATSAPP_NUMBER` (documentada en `.env.example`), sin inventar un valor.
- `src/lib/time.js`: se actualiza el comentario sobre la zona horaria (confirmada: America/Lima) y se agrega un helper de etiqueta de fecha para no construir `Date` fuera de ese módulo.

## Capabilities

### New Capabilities
- `booking-flow`: comportamiento del flujo de reserva en el cliente frente a la API (envío, idempotencia, disponibilidad, errores, WhatsApp).

### Modified Capabilities
<!-- Ninguna: el contrato de reservation-api no cambia. -->

## Impact

- Código: `src/components/booking/ReservarCita.jsx`, `src/lib/time.js`, `src/data/content.js` (copy de errores y WhatsApp), `.env.example`.
- Sin cambios en `/api/admin` ni en el schema de Prisma.
- Pendiente externo: valor real de `NEXT_PUBLIC_WHATSAPP_NUMBER`.
