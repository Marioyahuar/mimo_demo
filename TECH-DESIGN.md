# Technical Design Document v2: Sistema de reservas — Mimo Pet Spa

**Versión:** 2 — reemplaza funcionalmente a [`TECH-DESIGN.md`](TECH-DESIGN.md) (v1), que se
conserva sin modificar para trazabilidad. Los ADRs 0001–0009 también se conservan tal cual;
esta versión los complementa con dos ADRs nuevos en vez de editarlos.

**Qué cambió respecto de v1.** Dos correcciones de corrección funcional surgidas de la
revisión adversarial del diseño v1:

| # | Problema en v1 | Corrección en v2 |
|---|---|---|
| 1 | Ninguna definición de zona horaria: la validación `DATE_IN_PAST` comparaba hora de pared contra `now()` en UTC, rechazando reservas válidas durante las últimas horas de cada día. El `min` del date picker también se calculaba en UTC. | [ADR-0010](adrs/0010-zona-horaria-negocio-fija.md): zona del negocio fija en una constante compartida, y conversión a instante vía helpers únicos, en servidor y cliente. |
| 2 | `POST /api/reservations` no era idempotente: si la respuesta se perdía tras un `INSERT` exitoso, el reintento que el propio diseño prescribía devolvía `409 SLOT_TAKEN` — es decir, le reportaba al cliente su propia reserva como conflicto de otro. | [ADR-0011](adrs/0011-idempotencia-creacion-reserva.md): clave de idempotencia por intento, replay idempotente en `200`, y desambiguación determinista de las dos constraints únicas. |

**Qué NO cambió, deliberadamente.** La revisión adversarial levantó otros hallazgos
(ausencia de rate limiting y de cancelación de reservas, `time` como texto sin validar,
supuesto de capacidad = 1, costo no dimensionado de la migración Vite→Next, throttling del
login de admin, listado de admin sin filtro de "próximas", entre otros). **Ninguno se
atiende en v2**, por decisión explícita del usuario: el proyecto es una POC y esas
correcciones se consideraron desproporcionadas para ese objetivo. Quedan registradas más
abajo, en "Riesgos aceptados", para que sean una decisión trazable y no un olvido.

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

Toda la lógica temporal (qué día es "hoy", si un slot ya pasó) se resuelve contra una zona
horaria fija del negocio, no contra la zona del servidor ni la del navegador del cliente
([ADR-0010](adrs/0010-zona-horaria-negocio-fija.md)). La creación de reserva es idempotente
por intento, de modo que reintentar una confirmación tras una falla de red no duplica la
reserva ni reporta un conflicto falso
([ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)).

## Arquitectura de componentes

Un único proyecto Next.js (App Router) desplegado como un solo proyecto Vercel:

- **Frontend (App Router)** — home (`/`) y flujo de reserva (`/reservar`), reutilizando los
  componentes de UI existentes (`src/components/*`, tokens de `tailwind.config.js`,
  copy de `src/data/content.js`). Nuevo: pantalla de login de admin (`/admin/login`) y
  listado de admin (`/admin`).
- **API routes (backend)** — bajo `/api`:
  - `POST /api/reservations` — crea una reserva (idempotente por `idempotencyKey`).
  - `GET /api/reservations/availability` — horarios ocupados de un día.
  - `POST /api/admin/login` — valida la clave y emite la cookie de sesión.
  - `GET /api/admin/reservations` — listado protegido para el dueño.
- **Módulo compartido de tiempo** (`src/lib/time.js`) — `BUSINESS_TIMEZONE`,
  `todayInBusinessTz()` y `slotToInstant(date, time)`. Importado tanto por el frontend como
  por las API routes; es la **única** vía permitida para convertir `date`/`time` en un
  instante o para averiguar qué día es "hoy"
  ([ADR-0010](adrs/0010-zona-horaria-negocio-fija.md)).
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
| [ADR-0005](adrs/0005-modelo-datos-reservations-denormalizada.md) | Modelo de datos: tabla `reservations` denormalizada | Aceptado — enmendado por [0010](adrs/0010-zona-horaria-negocio-fija.md) y [0011](adrs/0011-idempotencia-creacion-reserva.md) |
| [ADR-0006](adrs/0006-contrato-api-rest-simple.md) | Contrato de API: REST simple | Aceptado — enmendado por [0011](adrs/0011-idempotencia-creacion-reserva.md) |
| [ADR-0007](adrs/0007-anti-doble-booking-unique-constraint.md) | Anti doble-booking: `UNIQUE` constraint en Postgres | Aceptado — enmendado por [0011](adrs/0011-idempotencia-creacion-reserva.md) |
| [ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md) | Autenticación `/admin`: password + cookie firmada | Aceptado |
| [ADR-0009](adrs/0009-resiliencia-validacion-server-side.md) | Resiliencia: validación server-side sin retry automático | Aceptado — enmendado por [0010](adrs/0010-zona-horaria-negocio-fija.md) y [0011](adrs/0011-idempotencia-creacion-reserva.md) |
| [ADR-0010](adrs/0010-zona-horaria-negocio-fija.md) | Zona horaria: hora de pared del negocio con zona fija | Aceptado — nuevo en v2 |
| [ADR-0011](adrs/0011-idempotencia-creacion-reserva.md) | Idempotencia en creación de reserva | Aceptado — nuevo en v2 |

## Modelo de datos

Una sola tabla `reservations` (ver [ADR-0005](adrs/0005-modelo-datos-reservations-denormalizada.md)
para el detalle completo de columnas y el razonamiento de la denormalización):

- Datos de la reserva: `service_title`, `service_price_label`, `extras[]`, `date`, `time`.
- Datos de la mascota: `pet_name`, `pet_breed`, `pet_size`, `pet_notes`.
- Datos de contacto: `contact_name`, `contact_phone`, `contact_email`.
- Metadatos: `id`, `created_at`, **`idempotency_key`** (nuevo en v2).
- Constraint `UNIQUE (date, time)` para garantizar no-doble-booking
  ([ADR-0007](adrs/0007-anti-doble-booking-unique-constraint.md)).
- Constraint `UNIQUE (idempotency_key)` para hacer idempotente la creación
  ([ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)).

### Cambios de schema respecto de v1

| Columna | Tipo | Cambio |
|---|---|---|
| `idempotency_key` | `uuid NOT NULL UNIQUE` | **Nueva** — generada por el cliente con `crypto.randomUUID()`, una por intento de reserva ([ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)). |

`date` y `time` **no cambian de tipo**: siguen siendo `date` y `text` (`HH:mm`, 24h), y
siguen representando **hora de pared del negocio**, no un instante. La conversión a instante
ocurre únicamente al comparar contra el reloj, vía `slotToInstant()`
([ADR-0010](adrs/0010-zona-horaria-negocio-fija.md) explica por qué no se migró a
`timestamptz`).

El catálogo de servicios/extras permanece como configuración estática en
`src/data/content.js` (no se modela en base de datos — no hay requisito de administrarlo
dinámicamente).

El número de WhatsApp del spa (destino del botón de reenvío) se configura como constante en
`content.js` o env var, no en base de datos.

### Configuración

| Clave | Dónde | Notas |
|---|---|---|
| `BUSINESS_TIMEZONE` | constante en `src/lib/time.js` | Valor inicial `'America/Lima'`. **Confirmado con el dueño del spa (2026-10-04).** Si cambia, toda la validación de "ya pasó" queda corrida por el offset. No es env var a propósito: una env var ausente degradaría en silencio a un default. |
| `DATABASE_URL` | env var (Vercel + Neon) | |
| `ADMIN_PASSWORD` | env var | [ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md) |
| `ADMIN_SESSION_SECRET` | env var | Secreto de firma de la cookie, distinto de la clave de acceso ([ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md)) |
| Duración de la sesión de admin | env var | Sin valor fijado por el PRD; default a definir en implementación |

## Contrato de `POST /api/reservations` (actualizado en v2)

Ver [ADR-0006](adrs/0006-contrato-api-rest-simple.md) para el resto de los endpoints, que no
cambian.

**Request** — body JSON con los campos de la reserva más `idempotencyKey` (uuid, generado
por el cliente).

**Respuestas:**

| Código | Cuerpo | Cuándo |
|---|---|---|
| `201 Created` | la reserva creada | El `INSERT` se realizó en esta llamada. |
| `200 OK` | la reserva **almacenada** | Replay: ya existía una reserva con esa `idempotencyKey`. No es un error; el frontend muestra la confirmación igual que con `201`. |
| `409 Conflict` | `{ error: "SLOT_TAKEN" }` | Ese `(date, time)` ya lo tomó **otra** persona. |
| `422` | `{ error: "DATE_IN_PAST" }` | `slotToInstant(date, time) <= now()`, evaluado en la zona del negocio. |
| `422` | `{ error: "VALIDATION_ERROR", fields: [...] }` | Campos requeridos faltantes o inválidos. |

**Resolución del conflicto de constraint** (el punto delicado, ver
[ADR-0011](adrs/0011-idempotencia-creacion-reserva.md)): el servidor intenta el `INSERT`
directamente, sin chequeo previo. Ante `P2002` de Prisma:

1. `SELECT` por `idempotency_key`.
2. Si existe → `200` con esa fila (es la reserva del propio usuario).
3. Si no existe → `409 SLOT_TAKEN`.

No se decide por el nombre del índice violado: cuando ambas constraints chocan a la vez,
Postgres reporta sólo una, y no necesariamente la que corresponde.

## Criterios de aceptación por flujo

### Flujo de reserva (cliente)

- [ ] El cliente completa servicio → mascota → extras → fecha/hora → contacto → confirmación
      sin salir de la página ni necesitar WhatsApp (criterio de éxito del PRD).
- [ ] El `min` del date picker es `todayInBusinessTz()`, no la fecha UTC. Verificable: con el
      navegador en una zona distinta a la del negocio y cerca de medianoche, el primer día
      seleccionable sigue siendo el día actual **del spa**.
- [ ] Al confirmar, el servidor re-valida que el slot no haya pasado comparando
      `slotToInstant(date, time)` contra la hora del servidor; si ya pasó, responde
      `DATE_IN_PAST` y el frontend muestra el error sin perder los demás datos ya ingresados.
- [ ] **Un slot futuro en hora local del negocio nunca se rechaza con `DATE_IN_PAST`.**
      Verificable: con el reloj del servidor en un punto del día en que la fecha UTC ya
      avanzó respecto de la local, reservar un slot de hoy más tarde se acepta.
- [ ] Al confirmar, si el slot (fecha+hora exacta) ya está ocupado **por otra reserva**, el
      servidor responde `409 SLOT_TAKEN` y el frontend vuelve al paso de fecha/hora mostrando
      el conflicto, conservando el resto de los datos ya cargados.
- [ ] Si dos reservas para el mismo slot llegan casi simultáneamente desde dispositivos
      distintos, solo una queda insertada en la base; la otra recibe `SLOT_TAKEN`.
- [ ] **Reenviar el mismo `POST` con la misma `idempotencyKey` no crea una segunda reserva**:
      la segunda llamada responde `200` con la reserva ya almacenada.
- [ ] **Un reintento tras una respuesta perdida nunca reporta `SLOT_TAKEN` al dueño de la
      reserva.** Verificable: forzar la pérdida de la respuesta del primer `POST` (exitoso) y
      repetir la confirmación desde la UI → el cliente ve la pantalla de confirmación, no el
      conflicto.
- [ ] El botón "Confirmar reserva" queda deshabilitado mientras hay un `POST` en vuelo; un
      doble tap no produce dos inserciones ni un `409`.
- [ ] `resetFlow()` ("Reservar otra cita") genera una `idempotencyKey` nueva: reservar dos
      veces seguidas en la misma sesión crea dos reservas distintas, no un replay de la
      primera.
- [ ] Cerrar la pestaña en cualquier paso antes de tocar "Confirmar reserva" no deja ningún
      registro en la base (la única escritura ocurre en la confirmación final).
- [ ] Tras confirmar, se muestra la pantalla de confirmación (ya existente) con los datos de
      la reserva creada — tanto en el caso `201` como en el `200`.
- [ ] En la pantalla de confirmación aparece un botón que abre un deep link `wa.me` hacia el
      número del spa, con mensaje prellenado (servicio, mascota, fecha, hora, contacto).

### Flujo de administración (`/admin`)

Sin cambios respecto de v1.

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
- El valor de `BUSINESS_TIMEZONE` está puesto por defecto y **no fue confirmado**. Es la
  única pieza de [ADR-0010](adrs/0010-zona-horaria-negocio-fija.md) que queda pendiente.
- La corrección de [ADR-0010](adrs/0010-zona-horaria-negocio-fija.md) depende de una
  convención, no de un tipo: cualquier `Date` armado a mano a partir de `date` y `time`
  fuera de `src/lib/time.js` reintroduce el bug sin fallar en build ni en tests.

## Riesgos aceptados (POC)

Hallazgos de la revisión adversarial que **se decidió no atender en esta versión**. No son
omisiones: son decisiones tomadas por el usuario bajo el criterio de que el proyecto es una
POC y estas correcciones serían desproporcionadas para ese objetivo. Quedan acá para que
sean revisables si el proyecto pasa a uso real.

| Riesgo aceptado | Qué puede pasar |
|---|---|
| `POST /api/reservations` es público y sin rate limiting, y no existe endpoint de cancelación. Con `UNIQUE (date, time)`, cada escritura es irreversible desde el producto. | Un script trivial puede ocupar todos los slots de forma permanente; un no-show o una reserva equivocada bloquea ese horario para siempre, y liberarlo requiere entrar a la consola de Neon. |
| `time` es `text` sin `CHECK` ni validación de pertenencia al catálogo de slots. | Un `POST` fabricado puede insertar un horario arbitrario; una variación de formato (`"9:00"` vs `"09:00"`) crearía dos filas para el mismo slot y `UNIQUE (date, time)` no lo detectaría. |
| El supuesto "capacidad = 1 mascota por slot" nunca se validó, y el margen entre el espaciado de slots (90 min) y el servicio más largo (90 min) es cero. | Agregar un servicio de más de 90 min o achicar la grilla rompe el no-solapamiento en silencio. Si el spa puede atender dos mascotas a la vez, la constraint bloquea ingresos. |
| `POST /api/admin/login` no tiene throttling, y rotar `ADMIN_PASSWORD` no invalida las cookies ya emitidas. | La clave es adivinable por fuerza bruta; el procedimiento de reseteo manual que prevé el PRD no revoca sesiones activas. |
| El listado de admin trae todas las reservas históricas en orden ascendente, sin filtro ni paginación. | Con el tiempo, el dueño abre `/admin` y ve primero lo más viejo; encontrar las citas próximas exige scrollear el historial. |
| No hay estrategia de verificación ni observabilidad. | El criterio de concurrencia no se comprueba a mano; un `500` en la creación es una reserva perdida de la que nadie se entera. |
| No se dimensionó el costo de la migración Vite→Next, pese a que el PRD lo pedía explícitamente. | El ítem de esfuerzo más grande del proyecto no tiene estimación. |
| No hay decisión sobre cómo y cuándo corren las migraciones de Prisma en el pipeline de Vercel. | `prisma migrate deploy` en el build también corre en preview deploys, que pueden migrar la base de producción. |
