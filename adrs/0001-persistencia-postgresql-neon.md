# ADR 0001: Persistencia — PostgreSQL en Neon

## Estado

Aceptado

## Contexto

El PRD exige persistencia real y compartida para las reservas (sección "Alcance"), dejando
explícitamente abierta la elección de tecnología concreta (`<!-- REVISAR -->`). Para este
diseño técnico, el usuario fijó como restricción mandatoria del proyecto que la base de
datos debe ser **PostgreSQL en el servicio Neon**, en conjunto con el requisito de que todo
el proyecto se despliegue en Vercel free tier ([[0002]]). Esta no es una decisión abierta a
evaluar con alternativas equivalentes: es un input dado por el usuario para este diseño.

## Decisión

Usar PostgreSQL gestionado por Neon como única base de datos de persistencia del proyecto.

## Alternativas consideradas

- **SQLite embebido / archivo local** — no es compatible con funciones serverless en Vercel
  (filesystem efímero, no compartido entre invocaciones ni dispositivos); no cumpliría el
  criterio de éxito de reservas visibles desde cualquier dispositivo.
- **MongoDB Atlas (NoSQL gestionado)** — técnicamente viable para un modelo tan simple como
  el de este proyecto, pero descartado porque la elección de Postgres/Neon fue fijada
  explícitamente por el usuario como restricción del proyecto, no una decisión a evaluar.
- **Supabase (Postgres gestionado con BaaS)** — también hubiera sido razonable (Postgres,
  con free tier), pero igualmente descartado por el mandato explícito de usar Neon en
  particular.

## Consecuencias

- Free tier de Neon compatible con el free tier de Vercel; el driver serverless de Neon
  (HTTP/WebSockets) evita agotar el límite de conexiones TCP concurrentes típico de
  funciones serverless efímeras.
- Trade-off: el proyecto queda atado a Neon como proveedor. Migrar a otro Postgres
  gestionado en el futuro solo requeriría cambiar la connection string (por ser Postgres
  estándar), pero features específicas de Neon (branching, driver HTTP) no portarían igual.
