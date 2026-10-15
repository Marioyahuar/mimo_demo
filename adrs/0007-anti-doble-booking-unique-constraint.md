# ADR 0007: Prevención de doble booking — UNIQUE constraint en Postgres

## Estado

Aceptado

## Contexto

El PRD define como caso borde explícito: "Dos clientes, desde dispositivos distintos,
intentan reservar el mismo slot casi al mismo tiempo → solo una de las dos reservas debe
quedar confirmada; la otra debe detectar el conflicto y pedir elegir otro horario." Y como
criterio de éxito: "0 reservas dobles en el mismo slot". Esto exige una garantía atómica, no
solo una validación previa en la aplicación (que sería vulnerable a una condición de carrera
entre el chequeo y la escritura).

## Decisión

Definir una restricción `UNIQUE (date, time)` en la tabla `reservations` ([[0005]]). La API
route de creación (`POST /api/reservations`, [[0006]]) intenta el `INSERT` directamente; si
Postgres rechaza por violación de esa constraint, la ruta atrapa ese error específico
(vía Prisma, [[0004]]) y responde `409 Conflict` con `{ error: "SLOT_TAKEN" }`, sin necesidad
de un chequeo previo separado.

## Alternativas consideradas

- **Chequeo previo en la app + transacción con bloqueo pesimista (`SELECT ... FOR UPDATE`)**
  — también da la garantía correcta, pero requiere manejo explícito de transacciones y locks
  en cada función serverless (cada invocación abre su propia conexión/transacción) para
  lograr exactamente lo mismo que un `UNIQUE` constraint garantiza por sí solo con menos
  código y menor superficie de error.

## Consecuencias

- La atomicidad la garantiza la base de datos, no el código de la aplicación — correcta por
  construcción incluso con dos requests concurrentes desde funciones serverless distintas
  (que no comparten memoria ni estado entre sí).
- Trade-off: el mensaje de error que ve el usuario depende de traducir correctamente el
  código de error de Postgres/Prisma (violación de constraint única) a la respuesta HTTP
  `409` — si en el futuro se agregan otras constraints únicas a la tabla, hay que
  distinguirlas explícitamente para no confundir un conflicto de horario con otro tipo de
  violación.
