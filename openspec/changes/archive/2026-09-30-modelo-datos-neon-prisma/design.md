# Design

## Context

Ver proposal.md - Why. El proyecto hoy es Next.js App Router (backlog #1, ya cerrado) sin ningún
API route, esquema de datos ni conexión a base de datos. Este change agrega esa capa de datos, y
solo esa capa: nada aquí expone HTTP todavía (eso es backlog #4/#6).

Restricciones fijadas por ADRs previos, no abiertas a rediscutir en este change:
- Postgres en Neon como única base de datos (ADR-0001).
- Prisma ORM + `@prisma/adapter-neon` (driver serverless), no TCP tradicional (ADR-0004).
- Tabla única `reservations` denormalizada (ADR-0005).
- `UNIQUE (date, time)` para evitar doble booking (ADR-0007).
- `idempotency_key uuid NOT NULL UNIQUE` (ADR-0011).

## Goals / Non-Goals

**Goals:**
- Esquema Prisma y migración inicial que produzcan la tabla `reservations` completa (incluyendo
  `idempotency_key`) en cualquier base de datos Neon nueva.
- Módulo de conexión reutilizable, seguro para invocaciones serverless (sin agotar el límite de
  conexiones de Neon).
- Variable de entorno documentada (`.env.example`) para que cualquiera pueda apuntar el proyecto
  a su propia base de datos Neon (dev/staging/prod).

**Non-Goals:**
- Ningún API route ni lógica de negocio (creación de reserva, disponibilidad, auth admin) — eso
  es backlog #4/#5/#6.
- Ningún seed de datos de ejemplo — la tabla arranca vacía.
- No se decide aquí `BUSINESS_TIMEZONE` ni el módulo `src/lib/time.js` (backlog #3, independiente).

## Decisions

**Prisma con Neon serverless driver adapter.**
Se agrega `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }` en
`prisma/schema.prisma`, y el cliente se instancia con `@prisma/adapter-neon` +
`@neondatabase/serverless` en vez de la conexión TCP por defecto, siguiendo ADR-0004. Al momento
de implementar, verificar en la documentación instalada de Prisma si la versión estable actual
todavía requiere el preview feature `driverAdapters` en el `schema.prisma` o si ya es
comportamiento estable — pinnear la versión de `prisma`/`@prisma/client` que se instale a ese
comportamiento verificado, no asumir por versiones previas.

**Nombres de columna snake_case, campos de modelo camelCase.**
El modelo Prisma `Reservation` usa nombres de campo camelCase idiomáticos (`serviceTitle`,
`petName`, `contactPhone`, `createdAt`, `idempotencyKey`, etc.) mapeados 1:1 a las columnas
snake_case que exige ADR-0005 vía `@map("nombre_columna")`, y `@@map("reservations")` para el
nombre de tabla. Esto mantiene el nombre de columna físico estable (lo que importa para SQL
directo o herramientas externas) sin forzar snake_case en el código de aplicación.

**`id` con default a nivel de base de datos.**
`id` es `uuid` con `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`, generado por
Postgres al insertar, no por Prisma en el cliente. Si la versión de Postgres de Neon no expone
`gen_random_uuid()` en el schema `public` por defecto, la migración inicial debe habilitar la
extensión correspondiente (`pgcrypto` o equivalente) antes de crear la tabla — verificar contra la
instancia real de Neon del proyecto al aplicar la migración.

**`idempotency_key` sin default.**
A diferencia de `id`, `idempotency_key` no tiene default en base de datos: ADR-0011 fija que el
valor lo genera el cliente (`crypto.randomUUID()` en `ReservarCita.jsx`, backlog #5) y viaja en el
body del `POST`. Aquí solo se define la columna y su constraint única; no hay lógica de generación
en esta capa.

**`extras` como arreglo nativo de Postgres.**
`extras String[]` en Prisma, mapeado a `text[]` en Postgres — evita una tabla de unión para una
lista de snapshots de texto que no se consulta relacionalmente (consistente con ADR-0005).

**Módulo de conexión único y cacheado.**
Un solo archivo (`src/lib/db.js`) exporta una instancia de `PrismaClient` construida con el
adapter de Neon, cacheada en `globalThis` para evitar crear un cliente nuevo en cada hot-reload de
desarrollo o invocación cálida en producción — patrón estándar recomendado por Prisma para
entornos serverless/Next.js. Todas las futuras API routes (backlog #4, #6) importan este módulo en
vez de instanciar su propio cliente.

## Risks / Trade-offs

- [Riesgo] La versión exacta de Prisma/adapter puede requerir configuración distinta a la
  documentada aquí (preview flags, formato de `DATABASE_URL`) → Mitigación: verificar contra la
  documentación de la versión realmente instalada antes de escribir el schema final, y contra una
  base de datos Neon real antes de considerar la migración lista.
- [Riesgo] Ejecutar la migración inicial contra la base de datos de producción por error →
  Mitigación: usar una rama (branch) de desarrollo de Neon o una base de datos separada para
  `prisma migrate dev`, y reservar `prisma migrate deploy` contra la URL de producción solo para
  el pipeline de deploy.
- [Trade-off] `gen_random_uuid()` requiere que la extensión correspondiente esté disponible en la
  base de datos → aceptado porque Neon (Postgres administrado moderno) la soporta; se documenta
  como paso explícito de la migración en vez de asumirlo implícito.

## Migration Plan

1. Instalar dependencias (`prisma`, `@prisma/client`, `@prisma/adapter-neon`,
   `@neondatabase/serverless`) y correr `npx prisma init` o crear `prisma/schema.prisma` a mano.
2. Definir el modelo `Reservation` con todas las columnas, ambas constraints únicas, y el
   datasource apuntando a `DATABASE_URL`.
3. Configurar `DATABASE_URL` en `.env` (no commiteado) contra una base de datos Neon de
   desarrollo, y documentar la variable en `.env.example`.
4. Generar la migración inicial (`prisma migrate dev --name init_reservations`) contra esa base
   de datos de desarrollo, revisando el SQL generado antes de aplicarlo.
5. Crear el módulo `src/lib/db.js` con el cliente Prisma + adapter de Neon, cacheado en
   `globalThis`.
6. Verificar manualmente: insertar una reserva de prueba, intentar un segundo insert con el mismo
   `date`/`time` (debe fallar por constraint), intentar un segundo insert con el mismo
   `idempotency_key` (debe fallar por constraint), luego borrar los datos de prueba.
7. Documentar en el README o en `.env.example` el paso de `prisma generate` como parte del build
   (necesario en el pipeline de Vercel para que el cliente tipado exista en el bundle).

No aplica rollback más allá de `prisma migrate reset` en desarrollo — no hay datos de producción
todavía en esta etapa del proyecto.

## Decisiones resueltas al implementar

- Versión pinneada: `prisma`/`@prisma/client`/`@prisma/adapter-neon` 7.10.0 (última estable; el
  tag `latest` de npm apunta a un RC 8.x, no usado). En Prisma 7 el adapter es estable (sin
  `driverAdapters`), el `datasource` del schema no lleva `url` (vive en `prisma.config.ts`) y
  `PrismaClient` exige `adapter`.
- `prisma.config.ts` usa `DATABASE_URL_UNPOOLED` (conexión directa) para migrar; la app usa
  `DATABASE_URL` (pooled) vía adapter. Se carga `.env` con `process.loadEnvFile` (Node 22).
- `gen_random_uuid()` es nativo en Postgres 18 (Neon): la migración no necesita `pgcrypto`.
- Generador `prisma-client-js` (cliente en node_modules, sin TypeScript en el repo); `prisma
  generate` corre en `postinstall` y en `build`.
- Verificación: `scripts/verify-db.mjs` (insert/lectura, ambas constraints, limpieza) contra la
  rama Neon `dev/modelo-datos-neon-prisma`. `.env` se agregó a `.gitignore`.

## Open Questions

- Versión exacta de `prisma`/`@prisma/client` a pinnear y si el adapter de Neon todavía requiere
  el preview feature `driverAdapters` — se resuelve al implementar, consultando la documentación
  de la versión instalada; no cambia el esquema, las constraints ni el enfoque de este design.
