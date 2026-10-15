# ADR 0009: Resiliencia — validación server-side con errores estructurados, sin retry automático

## Estado

Aceptado

## Contexto

El PRD define casos borde de robustez: (a) el cliente deja la pestaña abierta mucho tiempo y
confirma una fecha/hora que ya pasó — debe validarse contra la hora actual al momento de
confirmar, no solo al cargar el formulario; (b) el cliente cierra la pestaña antes de
confirmar — no debe quedar ninguna reserva a medias guardada. No hay requisito de operar
offline ni de garantizar entrega ante caídas de red prolongadas (no está en el PRD).

## Decisión

- Toda validación que importa para la integridad del dato se re-verifica en el servidor al
  momento de confirmar (`POST /api/reservations`): fecha/hora no pasada (comparada contra la
  hora del servidor), campos de contacto/mascota requeridos, y disponibilidad del slot (vía
  el `UNIQUE` constraint, [[0007]]).
- Los errores se devuelven como JSON estructurado con código (`SLOT_TAKEN`, `DATE_IN_PAST`,
  `VALIDATION_ERROR`), y el frontend traduce cada código a un mensaje visible, dejando al
  usuario reintentar manualmente (ej. elegir otro horario).
- No hay retry automático ni cola de reintentos ante fallas de red — si el `POST` falla por
  red, el usuario ve un error y puede volver a tocar "Confirmar reserva".
- La reserva solo se inserta en la base cuando se confirma explícitamente (no hay guardado
  incremental por paso del formulario), lo cual ya satisface por construcción que cerrar la
  pestaña antes de confirmar no deja ningún registro parcial.

## Alternativas consideradas

- **Retry automático / cola en el cliente ante fallas de red** — daría más robustez ante
  conectividad móvil inestable, pero el PRD no lo pide, y de implementarse sin cuidado
  (idempotencia) podría generar reservas duplicadas — una cola mal hecha reintentando un
  `POST` no idempotente es peor que no tener cola. Descartado por ser desproporcionado al
  riesgo real del proyecto.

## Consecuencias

- Manejo de errores simple y predecible, con la base de datos como fuente única de verdad
  para la validación de disponibilidad — no hay estado de validación duplicado entre cliente
  y servidor que pueda desincronizarse.
- Trade-off: en una red inestable, el usuario debe reintentar manualmente la confirmación;
  no hay garantía de entrega automática. Aceptable dado que el PRD no exige soporte offline
  ni de conectividad degradada.
