# ADR 0006: Contrato de API — REST simple sobre API routes

## Estado

Aceptado

## Contexto

El frontend (cliente y admin) necesita comunicarse con las API routes de Next.js ([[0003]])
para crear reservas, consultar disponibilidad y listar reservas. El backend tiene solo un
puñado de operaciones (crear reserva, consultar horarios ocupados, login de admin, listar
reservas), por lo que había que elegir la forma del contrato entre frontend y servidor.

## Decisión

REST simple, JSON plano, sin capa de RPC tipado:

- `POST /api/reservations` — crea una reserva. `201` con la reserva creada, `409` si el slot
  ya está ocupado (`{ error: "SLOT_TAKEN" }`), `422` si la fecha/hora ya pasó
  (`{ error: "DATE_IN_PAST" }`) o hay campos inválidos (`{ error: "VALIDATION_ERROR", fields: [...] }`).
- `GET /api/reservations/availability?date=YYYY-MM-DD` — devuelve los horarios ya ocupados
  ese día, para deshabilitarlos en el paso de fecha/hora.
- `POST /api/admin/login` — recibe la clave, responde con cookie de sesión firmada (ver
  [[0008]]) o `401` si es incorrecta.
- `GET /api/admin/reservations` — lista todas las reservas ordenadas por fecha/hora
  ascendente; requiere la cookie de sesión de admin, `401` sin ella.

## Alternativas consideradas

- **tRPC (RPC tipado end-to-end)** — da inferencia de tipos automática entre cliente y
  servidor sin escribir contratos a mano. Descartado: para 3-4 operaciones, el setup de
  router/contexto/adapters de tRPC agrega una dependencia y una capa de complejidad cuya
  ganancia (tipado end-to-end) es marginal a este tamaño de proyecto.

## Consecuencias

- Contrato simple de leer, debuggear con curl/herramientas estándar, y consumir desde el
  frontend existente sin dependencias nuevas de cliente.
- Trade-off: sin inferencia de tipos automática entre frontend y backend — si el shape de un
  endpoint cambia, no hay un error de compilación que lo detecte en el frontend; hay que
  mantenerlos sincronizados manualmente (o, como mitigación liviana, tipar los payloads
  compartidos en un archivo de tipos común).
