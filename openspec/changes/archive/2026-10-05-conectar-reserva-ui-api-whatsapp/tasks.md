## 1. Base

- [x] 1.1 Actualizar el comentario de zona horaria en `src/lib/time.js` (confirmada) y agregar `formatDateLabel(date)`
- [x] 1.2 Agregar `booking.errors` y copy de WhatsApp en `src/data/content.js`
- [x] 1.3 Documentar `NEXT_PUBLIC_WHATSAPP_NUMBER` en `.env.example`

## 2. Flujo de reserva

- [x] 2.1 `idempotencyKey` en `emptyState()`; estados `submitting`, `error`, `occupied`, `reservation`
- [x] 2.2 Consumo de availability y deshabilitado de horarios ocupados
- [x] 2.3 `confirmBooking` async: POST, doble toque bloqueado, mapeo de respuestas
- [x] 2.4 Mensajes de error visibles sin perder datos; volver al paso 3 en SLOT_TAKEN/DATE_IN_PAST
- [x] 2.5 Botón `wa.me` con mensaje prellenado en la confirmación

## 3. Verificación

- [x] 3.1 `npm run build`
- [x] 3.2 Humo del servidor en dev: `/reservar` 200 y POST vacío -> 422 VALIDATION_ERROR; flujo con DB (201/200/409) NO ejecutado: sin credenciales de la rama Neon propia (ver reporte)
- [x] 3.3 `formatDateLabel` verificado con node; la UI interactiva en navegador NO se probó (sin navegador headless)
