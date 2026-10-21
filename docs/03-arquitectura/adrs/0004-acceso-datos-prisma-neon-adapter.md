# ADR 0004: Acceso a datos — Prisma ORM + adapter de Neon

## Estado

Aceptado

## Contexto

Las API routes de Next.js ([[0003]]) corren como funciones serverless en Vercel ([[0002]]),
con cold starts frecuentes y sin conexiones TCP persistentes entre invocaciones. Había que
elegir cómo esas funciones acceden a Neon Postgres ([[0001]]) de forma compatible con ese
modelo de ejecución.

## Decisión

Usar **Prisma ORM** con su adapter oficial para el driver serverless de Neon
(`@prisma/adapter-neon` + `@neondatabase/serverless`), en vez de conexiones TCP tradicionales
o un pool propio.

## Alternativas consideradas

- **Drizzle ORM + `@neondatabase/serverless`** — más liviano en cold start y sin paso de
  generación de código, pero con un DX menos pulido (schema y queries más explícitas, sin
  autocompletado tan maduro). Descartado porque el usuario priorizó el DX de Prisma.
- **SQL crudo con `@neondatabase/serverless`** — mínimo overhead y máxima simplicidad, pero
  sin tipado automático ni migraciones asistidas (requiere mantener schema y migraciones a
  mano). Descartado por el mismo motivo.

## Consecuencias

- DX pulido: schema declarativo (`schema.prisma`), migraciones versionadas
  (`prisma migrate`), cliente tipado automáticamente a partir del schema.
- Trade-off: el cliente de Prisma es más pesado que Drizzle o SQL crudo, lo que puede
  aumentar el tiempo de cold start en funciones serverless; además agrega un paso de build
  (`prisma generate`) que debe ejecutarse en el pipeline de deploy de Vercel. Se mitiga
  usando el adapter de Neon (motor de queries vía driver serverless en vez de engine binario
  tradicional), pero sigue siendo más pesado que las alternativas descartadas.
