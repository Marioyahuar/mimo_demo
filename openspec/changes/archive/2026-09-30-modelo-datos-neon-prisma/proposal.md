# Proposal

## Why

El PRD exige persistencia real y compartida para las reservas (hoy solo viven en memoria del
navegador y se pierden al refrescar). Antes de conectar el flujo de reserva o la vista admin a
un backend, el proyecto necesita un modelo de datos definido y una conexión funcional a la base
de datos — sin esto, ningún endpoint de la API (backlog #4, #6) tiene dónde escribir ni leer.

## What Changes

- Se agrega Prisma ORM al proyecto (`prisma`, `@prisma/client`, `@prisma/adapter-neon`,
  `@neondatabase/serverless`) con su configuración para usar el driver serverless de Neon en vez
  de conexiones TCP tradicionales (ADR-0004).
- Se define `prisma/schema.prisma` con un único modelo `Reservation` mapeado a la tabla
  `reservations`, denormalizado (sin `clients`/`pets`/`services` separados), con las columnas
  descritas en ADR-0005: `id`, `service_title`, `service_price_label`, `extras` (array de texto),
  `pet_name`, `pet_breed`, `pet_size`, `pet_notes` (nullable), `date`, `time`, `contact_name`,
  `contact_phone`, `contact_email`, `created_at`.
- Se agrega la columna `idempotency_key` (uuid, `NOT NULL UNIQUE`) al modelo, anticipada por
  ADR-0011 para que el endpoint de creación (backlog #4) pueda apoyarse en ella sin necesitar
  otra migración de esquema.
- Se agregan las constraints `UNIQUE (date, time)` (ADR-0007) y `UNIQUE (idempotency_key)`
  (ADR-0011) a nivel de base de datos.
- Se genera y aplica la migración inicial de Prisma que crea la tabla con esas columnas y
  constraints en la base de datos Neon del proyecto.
- Se agrega un módulo de conexión (cliente Prisma instanciado con el adapter de Neon) reutilizable
  desde futuras API routes, con la variable de entorno de connection string documentada
  (`.env.example`).
- **No incluye** ningún API route, endpoint HTTP, ni lógica de negocio (creación de reserva,
  chequeo de disponibilidad, autenticación admin) — eso es backlog #4 y #6. Este cambio es
  puramente el esquema, la migración y la conexión.

## Capabilities

### New Capabilities
- `reservations-data`: modelo de datos de reservas (esquema Prisma de la tabla `reservations`,
  migraciones, constraints únicas) y la conexión a la base de datos Neon vía adapter serverless
  de Prisma.

### Modified Capabilities
(ninguna — `app-shell` no cambia sus requisitos; este change no toca rutas ni UI)

## Impact

- **Nuevo**: `prisma/schema.prisma`, migración inicial en `prisma/migrations/`, módulo de cliente
  Prisma (p. ej. `src/lib/db.js` o equivalente), `.env.example` con `DATABASE_URL`.
- **Dependencias nuevas**: `prisma`, `@prisma/client`, `@prisma/adapter-neon`,
  `@neondatabase/serverless` en `package.json`; script `postinstall`/`build` para `prisma generate`
  si aplica al pipeline de Vercel.
- **Infraestructura**: requiere una base de datos Neon Postgres real (o de desarrollo) contra la
  cual correr la migración inicial.
- **Sin impacto** en `src/app/*`, `src/components/*`, ni en el flujo de reserva actual — esos
  siguen sin persistencia real hasta backlog #4/#5.
