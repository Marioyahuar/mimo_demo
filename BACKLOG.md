# Backlog: Sistema de reservas — Mimo Pet Spa

| # | Item | Alcance | Depende de | Contexto extra requerido |
|---|---|---|---|---|
| 1 | Migración Vite → Next.js (App Router) | Migrar el shell de la app (rutas `/`, `/reservar`, `/admin` vacía) preservando `src/components/*` y los tokens de `tailwind.config.js` tal cual; sin lógica de negocio nueva ([ADR-0003](adrs/0003-framework-nextjs-app-router.md)). | — | — |
| 2 | Modelo de datos y conexión a Neon | Schema Prisma de la tabla `reservations` (incluyendo `idempotency_key`), migraciones, conexión vía `@prisma/adapter-neon`, y las constraints `UNIQUE (date, time)` y `UNIQUE (idempotency_key)` ([ADR-0001](adrs/0001-persistencia-postgresql-neon.md), [ADR-0004](adrs/0004-acceso-datos-prisma-neon-adapter.md), [ADR-0005](adrs/0005-modelo-datos-reservations-denormalizada.md), [ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)). | #1 | — |
| 3 | Módulo de tiempo compartido (`src/lib/time.js`) | `BUSINESS_TIMEZONE`, `todayInBusinessTz()` y `slotToInstant()`, única vía permitida para convertir `date`/`time` a instante o averiguar "hoy"; usado tanto por el frontend (date picker) como por las API routes ([ADR-0010](adrs/0010-zona-horaria-negocio-fija.md)). | #1 | Confirmar con el dueño del spa el valor real de `BUSINESS_TIMEZONE` antes de implementar (hoy `'America/Lima'` por defecto, sin confirmar — ver nota `<!-- REVISAR -->` en ADR-0010). |
| 4 | Endpoints de reserva: creación idempotente + disponibilidad | `POST /api/reservations` (INSERT directo, idempotente por `idempotencyKey`, respuestas `201`/`200`/`409 SLOT_TAKEN`/`422 DATE_IN_PAST`/`422 VALIDATION_ERROR`) y `GET /api/reservations/availability?date=` ([ADR-0006](adrs/0006-contrato-api-rest-simple.md), [ADR-0007](adrs/0007-anti-doble-booking-unique-constraint.md), [ADR-0009](adrs/0009-resiliencia-validacion-server-side.md), [ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)). | #2, #3 | — |
| 5 | Conectar flujo de reserva (UI) a la API + reenvío WhatsApp | `ReservarCita.jsx` genera `idempotencyKey` en `emptyState()` (se regenera solo en `resetFlow()`), deshabilita "Confirmar reserva" mientras hay un request en vuelo, consume `availability` para deshabilitar horarios ocupados, traduce cada código de error a mensaje visible sin perder los datos ya cargados; botón `wa.me` con mensaje prellenado en la pantalla de confirmación ([ADR-0011](adrs/0011-idempotencia-creacion-reserva.md), sección "Alcance" del PRD). | #4 | — |
| 6 | Vista de administración protegida (login + listado) | `POST /api/admin/login` (valida clave contra env var, emite cookie `HttpOnly`/`Secure` firmada), protección server-side de `/admin` (UI) y `/api/admin/*` (incluso golpeando el endpoint directo), `GET /api/admin/reservations` listando todas las reservas ordenadas por fecha/hora ascendente ([ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md)). | #2 | — |

**Nota de orden:** el ítem #6 (admin) sólo depende del modelo de datos (#2), no del flujo de reserva (#4/#5) — puede implementarse en paralelo a esos dos ítems si se prefiere, no hay dependencia real entre ambos caminos.

**Riesgos aceptados (POC) fuera de este backlog:** el `TECH-DESIGN.md` v2 registra una lista explícita de hallazgos de la revisión adversarial que el usuario decidió no atender en esta versión (rate limiting, cancelación de reservas, validación de `time` contra el catálogo, paginación del listado admin, throttling de login, etc. — ver sección "Riesgos aceptados (POC)" del TDD). No se transforman en ítems de backlog porque fueron decisiones explícitas de no-alcance, no omisiones.

## Cómo usar este backlog

Cada ítem es una spec independiente. Al implementarlo, arrancá un ciclo de Spec-Driven
Development (`sdd-new` o el flujo equivalente de tu harness) usando este ítem como el
"change" — no el proyecto completo. Si la columna "Contexto extra requerido" tiene algo,
compartilo como contexto al generar la spec de ese ítem.
