# Tasks

## 1. Dependencias y configuración base

- [x] 1.1 Agregar `prisma`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`
  a `package.json` y verificar que `npm install` termina sin errores.
- [x] 1.2 Verificar en la documentación de la versión instalada de Prisma si el driver adapter de
  Neon requiere el preview feature `driverAdapters` en `schema.prisma`, y anotar la respuesta en
  un comentario del propio `schema.prisma` para que quede trazable.
- [x] 1.3 Crear `prisma/schema.prisma` con el `datasource db` (`provider = "postgresql"`,
  `url = env("DATABASE_URL")`) y el `generator client`, y verificar que `npx prisma validate` pasa
  sin errores.
- [x] 1.4 Crear `.env.example` documentando `DATABASE_URL` (formato de connection string de Neon)
  y verificar que `.env` real (no commiteado) está en `.gitignore`.

## 2. Modelo de datos

- [x] 2.1 Definir el modelo `Reservation` en `schema.prisma` con los campos camelCase
  (`serviceTitle`, `servicePriceLabel`, `extras`, `petName`, `petBreed`, `petSize`, `petNotes`,
  `date`, `time`, `contactName`, `contactPhone`, `contactEmail`, `createdAt`, `idempotencyKey`)
  mapeados vía `@map` a las columnas snake_case de ADR-0005, con `@@map("reservations")`, y
  verificar que `npx prisma validate` sigue pasando.
- [x] 2.2 Definir `id` como `uuid @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` y
  `petNotes` como nullable; verificar en el `schema.prisma` generado que ambos quedan reflejados
  correctamente (`String?` para `petNotes`).
- [x] 2.3 Agregar la constraint `@@unique([date, time])` y la constraint `@unique` en
  `idempotencyKey`, y verificar que `npx prisma validate` no reporta errores.

## 3. Migración inicial contra Neon

- [x] 3.1 Configurar `DATABASE_URL` en `.env` apuntando a una base de datos Neon de desarrollo
  (rama/branch separada de producción) y verificar la conexión con `npx prisma db pull --print`
  o un comando equivalente de solo lectura.
- [x] 3.2 Generar la migración inicial con `npx prisma migrate dev --name init_reservations`,
  revisar el SQL generado en `prisma/migrations/`, y si `gen_random_uuid()` no está disponible en
  el schema `public` de esa base, agregar la extensión necesaria (p. ej. `pgcrypto`) a la
  migración antes de aplicarla.
- [x] 3.3 Verificar que la migración se aplicó: la tabla `reservations` existe con todas sus
  columnas y ambas constraints únicas (comprobar con `\d reservations` en `psql` o el equivalente
  en el SQL editor de Neon).

## 4. Conexión reutilizable

- [x] 4.1 Crear `src/lib/db.js` exportando un cliente Prisma instanciado con el adapter de Neon
  (`@prisma/adapter-neon`), cacheado en `globalThis` para evitar múltiples instancias en
  hot-reload/invocaciones cálidas.
- [x] 4.2 Escribir un script o test manual que importe `src/lib/db.js`, inserte una reserva de
  prueba completa (todos los campos) y la lea de vuelta por `id`, y verificar que los valores
  devueltos coinciden exactamente con los insertados (incluye `extras` como arreglo y `petNotes`
  en null cuando se omite).

## 5. Verificación de las constraints

- [x] 5.1 Con el script/test manual del paso 4.2, intentar un segundo insert con el mismo
  `date`/`time` que el primero (distinto `idempotencyKey`) y verificar que la base de datos lo
  rechaza por violación de `UNIQUE (date, time)`.
- [x] 5.2 Intentar un segundo insert con el mismo `idempotencyKey` que el primero (distinto
  `date`/`time`) y verificar que la base de datos lo rechaza por violación de `UNIQUE
  (idempotency_key)`.
- [x] 5.3 Eliminar las filas de prueba creadas en los pasos 4.2, 5.1 y 5.2, y verificar que la
  tabla `reservations` en la base de datos de desarrollo queda vacía otra vez.

## 6. Build y documentación

- [x] 6.1 Agregar `prisma generate` al pipeline de build (script `postinstall` o `build` en
  `package.json`, según corresponda) y verificar que `npm run build` genera el cliente de Prisma
  sin intervención manual.
- [x] 6.2 Documentar en `.env.example` (o un README breve junto a `prisma/`) los pasos para que
  otra persona configure su propia base de datos Neon de desarrollo y corra las migraciones.
