# Technical Design Document: Sistema de reservas — Mimo Pet Spa

**Tipo de proyecto:** Greenfield — el código existente en el repo (`src/App.jsx`,
`src/components/*`, `ReservarCita.jsx`) es una demo de landing/UI 100% frontend, sin
backend; se conserva como base de UI pero el sistema de reservas persistente se construye
desde cero.

**Design.md disponible:** No — el modelo de datos y los flujos se derivaron del `PRD.md` y
del código existente de `ReservarCita.jsx` / `content.js`.

## Resumen

Se agrega persistencia real y compartida al flujo de reserva ya existente en la UI,
eliminando la coordinación manual por WhatsApp como único canal. El frontend se migra de
Vite a Next.js para poder incluir API routes en el mismo proyecto, desplegado íntegramente
en Vercel free tier, con PostgreSQL en Neon como base de datos. Se agrega validación
atómica de horarios (para garantizar 0 reservas dobles), una vista `/admin` protegida por
clave única, y un botón de reenvío por WhatsApp hacia el número del spa como respaldo del
canal actual — todo esto de acuerdo al alcance definido en `PRD.md`.

## Arquitectura de componentes

Un único proyecto Next.js (App Router) desplegado como un solo proyecto Vercel:

- **Frontend (App Router)** — home (`/`) y flujo de reserva (`/reservar`), reutilizando los
  componentes de UI existentes (`src/components/*`, tokens de `tailwind.config.js`,
  copy de `src/data/content.js`). Nuevo: pantalla de login de admin (`/admin/login`) y
  listado de admin (`/admin`).
- **API routes (backend)** — bajo `/api`:
  - `POST /api/reservations` — crea una reserva.
  - `GET /api/reservations/availability` — horarios ocupados de un día.
  - `POST /api/admin/login` — valida la clave y emite la cookie de sesión.
  - `GET /api/admin/reservations` — listado protegido para el dueño.
- **Base de datos** — PostgreSQL en Neon, accedida vía Prisma + adapter serverless de Neon,
  una única tabla `reservations`.

Todo el proyecto vive en un solo repo/deploy; no hay componentes ni repos adicionales (no
hay staff/roles múltiples, no hay servicio de pagos, no hay servicio de notificaciones
automáticas — todos fuera de alcance según el PRD).

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-persistencia-postgresql-neon.md) | Persistencia: PostgreSQL en Neon | Aceptado |
| [ADR-0002](adrs/0002-despliegue-vercel-free-tier.md) | Despliegue: Vercel free tier | Aceptado |
| [ADR-0003](adrs/0003-framework-nextjs-app-router.md) | Framework full-stack: Next.js (App Router) | Aceptado |
| [ADR-0004](adrs/0004-acceso-datos-prisma-neon-adapter.md) | Acceso a datos: Prisma + adapter de Neon | Aceptado |
| [ADR-0005](adrs/0005-modelo-datos-reservations-denormalizada.md) | Modelo de datos: tabla `reservations` denormalizada | Aceptado |
| [ADR-0006](adrs/0006-contrato-api-rest-simple.md) | Contrato de API: REST simple | Aceptado |
| [ADR-0007](adrs/0007-anti-doble-booking-unique-constraint.md) | Anti doble-booking: `UNIQUE` constraint en Postgres | Aceptado |
| [ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md) | Autenticación `/admin`: password + cookie firmada | Aceptado |
| [ADR-0009](adrs/0009-resiliencia-validacion-server-side.md) | Resiliencia: validación server-side sin retry automático | Aceptado |

## Modelo de datos

Una sola tabla `reservations` (ver [ADR-0005](adrs/0005-modelo-datos-reservations-denormalizada.md)
para el detalle completo de columnas):

- Datos de la reserva: `service_title`, `service_price_label`, `extras[]`, `date`, `time`.
- Datos de la mascota: `pet_name`, `pet_breed`, `pet_size`, `pet_notes`.
- Datos de contacto: `contact_name`, `contact_phone`, `contact_email`.
- Metadatos: `id`, `created_at`.
- Constraint `UNIQUE (date, time)` para garantizar no-doble-booking
  ([ADR-0007](adrs/0007-anti-doble-booking-unique-constraint.md)).

El catálogo de servicios/extras permanece como configuración estática en
`src/data/content.js` (no se modela en base de datos — no hay requisito de administrarlo
dinámicamente).

El número de WhatsApp del spa (destino del botón de reenvío) se configura como constante en
`content.js` o env var, no en base de datos.

## Criterios de aceptación por flujo

### Flujo de reserva (cliente)

- [ ] El cliente completa servicio → mascota → extras → fecha/hora → contacto → confirmación
      sin salir de la página ni necesitar WhatsApp (criterio de éxito del PRD).
- [ ] El date picker no permite elegir fechas anteriores a hoy (ya implementado en la UI
      actual, se conserva).
- [ ] Al confirmar, el servidor re-valida que la fecha+hora no haya pasado usando la hora del
      servidor (no la del navegador del cliente); si ya pasó, responde `DATE_IN_PAST` y el
      frontend muestra el error sin perder los demás datos ya ingresados.
- [ ] Al confirmar, si el slot (fecha+hora exacta) ya está ocupado, el servidor responde
      `409 SLOT_TAKEN` (vía el `UNIQUE` constraint) y el frontend vuelve al paso de
      fecha/hora mostrando el conflicto, conservando el resto de los datos ya cargados.
- [ ] Si dos reservas para el mismo slot llegan casi simultáneamente desde dispositivos
      distintos, solo una queda insertada en la base; la otra recibe `SLOT_TAKEN`.
- [ ] Cerrar la pestaña en cualquier paso antes de tocar "Confirmar reserva" no deja ningún
      registro en la base (la única escritura ocurre en la confirmación final).
- [ ] Tras confirmar, se muestra la pantalla de confirmación (ya existente) con los datos de
      la reserva creada.
- [ ] En la pantalla de confirmación aparece un botón que abre un deep link `wa.me` hacia el
      número del spa, con mensaje prellenado (servicio, mascota, fecha, hora, contacto).

### Flujo de administración (`/admin`)

- [ ] Acceder a `/admin` sin sesión válida no muestra ningún dato de clientes — redirige al
      formulario de clave.
- [ ] Ingresar la clave incorrecta no otorga acceso ni cookie de sesión (`401`).
- [ ] Ingresar la clave correcta setea la cookie de sesión firmada y da acceso al listado.
- [ ] `GET /api/admin/reservations` sin cookie válida responde `401` sin datos, incluso
      golpeando el endpoint directamente (no solo protegiendo la ruta de UI).
- [ ] El listado muestra todas las reservas ordenadas por fecha y hora ascendente, sin
      importar desde qué dispositivo/sesión se haya creado cada una.
- [ ] Al recargar la vista admin o volver a entrar desde otro dispositivo, las reservas
      creadas antes siguen presentes (no dependen de `localStorage` del dispositivo que
      reservó).

## Riesgos técnicos abiertos

- El cold start de Prisma en funciones serverless de Vercel no fue medido aún; si resulta
  muy alto en el free tier, la mitigación de fallback sería mover partes calientes del
  camino crítico (creación de reserva) a SQL crudo vía el mismo driver de Neon, conservando
  Prisma para el resto (ver alternativas descartadas en
  [ADR-0004](adrs/0004-acceso-datos-prisma-neon-adapter.md)).
- La duración exacta de la sesión de admin (expiración de la cookie) no está fijada por el
  PRD; se deja como parámetro configurable (env var), con un valor por defecto razonable a
  definir en implementación.
- Sin notificaciones automáticas (fuera de alcance), el dueño depende de entrar a `/admin` o
  de que el cliente use el botón de WhatsApp para enterarse de una reserva nueva — riesgo ya
  señalado en el PRD ("Riesgos"), mitigado parcialmente por el botón de reenvío hacia el
  WhatsApp del spa.
