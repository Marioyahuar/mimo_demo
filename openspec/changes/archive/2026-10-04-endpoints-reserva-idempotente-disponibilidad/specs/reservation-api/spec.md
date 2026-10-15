## ADDED Requirements

### Requirement: Creación de reserva con INSERT directo
`POST /api/reservations` SHALL recibir un body JSON con los campos de la reserva más `idempotencyKey` (uuid), intentar el `INSERT` directamente sin chequeo previo de disponibilidad, y responder `201` con la reserva creada (ADR-0006, ADR-0007).

#### Scenario: Reserva válida
- **WHEN** se envía un POST con todos los campos válidos, un slot futuro y una `idempotencyKey` nueva
- **THEN** responde `201` con la reserva (incluye `id`, `date` como `YYYY-MM-DD`) y la fila existe en la base

### Requirement: Idempotencia por idempotencyKey
Ante una violación de constraint única (`P2002`), el servidor SHALL buscar por `idempotency_key`: si existe responde `200` con la reserva almacenada; si no existe responde `409 { error: "SLOT_TAKEN" }`. No SHALL decidir por el nombre del índice (ADR-0011).

#### Scenario: Replay con la misma clave
- **WHEN** se repite un POST exitoso con la misma `idempotencyKey`
- **THEN** responde `200` con la reserva ya almacenada y no se crea una segunda fila

#### Scenario: Slot tomado por otra persona
- **WHEN** se envía un POST con una `idempotencyKey` distinta para un `(date, time)` ya reservado
- **THEN** responde `409 { error: "SLOT_TAKEN" }`

#### Scenario: Concurrencia sobre el mismo slot
- **WHEN** dos POST con claves distintas para el mismo slot llegan simultáneamente
- **THEN** exactamente uno responde `201` y el otro `409 SLOT_TAKEN`; la base contiene una sola fila

### Requirement: Rechazo de slots pasados en zona del negocio
El servidor SHALL responder `422 { error: "DATE_IN_PAST" }` cuando `slotToInstant(date, time) <= now()`, y SHALL aceptar cualquier slot futuro en hora del negocio aunque la fecha UTC difiera (ADR-0010). No SHALL construir `Date` desde `date`/`time` fuera de `src/lib/time.js` para comparar con el reloj.

#### Scenario: Slot pasado
- **WHEN** se reserva una fecha/hora anterior al instante actual
- **THEN** responde `422 DATE_IN_PAST` y no inserta nada

#### Scenario: Slot de hoy más tarde con UTC ya en el día siguiente
- **WHEN** en Lima son las 20:00 y se reserva hoy 21:00 (UTC ya es el día siguiente)
- **THEN** no se rechaza con `DATE_IN_PAST`

### Requirement: Validación de campos
El servidor SHALL responder `422 { error: "VALIDATION_ERROR", fields: [...] }` con los nombres de los campos faltantes o inválidos (requeridos no vacíos, `extras` arreglo de strings, `petNotes` opcional, `idempotencyKey` uuid, `date` `YYYY-MM-DD` existente, `time` `HH:mm`) y para un body que no sea JSON objeto.

#### Scenario: Campos faltantes
- **WHEN** se omite `petName` y `contactPhone`
- **THEN** responde `422 VALIDATION_ERROR` con `fields` conteniendo ambos nombres

### Requirement: Consulta de disponibilidad
`GET /api/reservations/availability?date=YYYY-MM-DD` SHALL responder `200 { date, occupied: [...] }` con los `time` ya reservados ese día, ordenados, y `422 VALIDATION_ERROR` si `date` falta o es inválida. La respuesta SHALL no cachearse.

#### Scenario: Día con reservas
- **WHEN** existe una reserva el 2026-12-01 a las 10:00 y se consulta esa fecha
- **THEN** responde `200` con `occupied` que incluye `"10:00"`

#### Scenario: Día sin reservas
- **WHEN** se consulta una fecha sin reservas
- **THEN** responde `200` con `occupied: []`

#### Scenario: Fecha inválida
- **WHEN** se consulta con `date=abc` o sin `date`
- **THEN** responde `422 VALIDATION_ERROR`
