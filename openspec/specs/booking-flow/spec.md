# booking-flow Specification

## Purpose
Comportamiento del flujo de reserva en el cliente frente a la API: envío idempotente, disponibilidad, errores y reenvío por WhatsApp (backlog #5).

## Requirements

### Requirement: Envío de la reserva a la API
Al confirmar, el flujo SHALL enviar `POST /api/reservations` con body plano camelCase (`serviceTitle`, `servicePriceLabel`, `extras`, `petName`, `petBreed`, `petSize`, `petNotes`, `date`, `time`, `contactName`, `contactPhone`, `contactEmail`, `idempotencyKey`) y mostrar la confirmación solo ante `201` o `200` (ADR-0006, ADR-0011).

#### Scenario: Confirmación exitosa
- **WHEN** el usuario completa el flujo y toca "Confirmar reserva" y la API responde `201`
- **THEN** se muestra la pantalla de confirmación con los datos de la reserva

#### Scenario: Replay idempotente
- **WHEN** la API responde `200` por una `idempotencyKey` repetida
- **THEN** se muestra la confirmación igual que con `201`

### Requirement: Clave de idempotencia por intento
La `idempotencyKey` SHALL generarse con `crypto.randomUUID()` en `emptyState()`, conservarse entre reintentos del mismo intento y regenerarse únicamente en `resetFlow()`.

#### Scenario: Reintento tras error de red
- **WHEN** un POST falla por red y el usuario vuelve a tocar "Confirmar reserva"
- **THEN** el segundo POST usa la misma `idempotencyKey`

#### Scenario: Reservar otra cita
- **WHEN** el usuario toca "Reservar otra cita"
- **THEN** el nuevo estado tiene una `idempotencyKey` distinta

### Requirement: Botón deshabilitado en vuelo
"Confirmar reserva" SHALL estar deshabilitado mientras haya un request en vuelo y rehabilitarse al recibir respuesta o error; un doble toque no SHALL emitir dos requests.

#### Scenario: Doble toque
- **WHEN** el usuario toca dos veces seguidas el botón
- **THEN** solo se emite un POST

### Requirement: Disponibilidad de horarios
Al elegir una fecha, el flujo SHALL consultar `GET /api/reservations/availability?date=` y deshabilitar los horarios en `occupied`; si el horario seleccionado queda ocupado se SHALL deseleccionar. El `min` del selector de fecha SHALL ser `todayInBusinessTz()`.

#### Scenario: Horario ocupado
- **WHEN** la disponibilidad de la fecha incluye "10:00"
- **THEN** el botón "10:00" aparece deshabilitado

#### Scenario: Falla la consulta de disponibilidad
- **WHEN** la consulta falla
- **THEN** se muestran todos los horarios habilitados y el servidor sigue validando al confirmar

### Requirement: Traducción de errores sin perder datos
Cada error SHALL mostrarse como mensaje visible conservando todo el estado cargado: `409 SLOT_TAKEN` y `422 DATE_IN_PAST` vuelven al paso fecha/hora y, en SLOT_TAKEN, se refresca la disponibilidad; `422 VALIDATION_ERROR` indica los campos; `500` y fallas de red piden reintentar sin cambiar la clave.

#### Scenario: Slot tomado
- **WHEN** la API responde `409 SLOT_TAKEN`
- **THEN** el flujo vuelve al paso de fecha/hora con un mensaje de que el horario ya fue tomado y los demás datos intactos

#### Scenario: Fecha pasada
- **WHEN** la API responde `422 DATE_IN_PAST`
- **THEN** vuelve al paso de fecha/hora con mensaje, sin perder datos

#### Scenario: Error interno
- **WHEN** la API responde `500` o hay falla de red
- **THEN** se muestra un mensaje de reintento y el botón se rehabilita

### Requirement: Reenvío por WhatsApp
La pantalla de confirmación SHALL mostrar un enlace `https://wa.me/<número>?text=<mensaje codificado>` con servicio, mascota, fecha, hora y contacto, usando `NEXT_PUBLIC_WHATSAPP_NUMBER`. Si la variable no está definida, el botón SHALL no mostrarse.

#### Scenario: Número configurado
- **WHEN** hay número configurado y la reserva está confirmada
- **THEN** el botón abre `wa.me` con el mensaje prellenado

#### Scenario: Sin número configurado
- **WHEN** la variable no está definida
- **THEN** no se muestra el botón y no se rompe la pantalla

### Requirement: Fechas solo vía módulo de tiempo
El flujo SHALL obtener "hoy" y las etiquetas de fecha únicamente desde `src/lib/time.js` (ADR-0010).

#### Scenario: Etiqueta de fecha
- **WHEN** se muestra la fecha elegida
- **THEN** se formatea mediante un helper de `src/lib/time.js` sin `new Date(date...)` en el componente
