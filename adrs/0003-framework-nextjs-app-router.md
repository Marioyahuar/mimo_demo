# ADR 0003: Framework full-stack — Next.js (App Router)

## Estado

Aceptado

## Contexto

Hoy el frontend es un SPA con Vite puro (`src/App.jsx` + componentes), sin backend. El PRD
exige agregar persistencia real compartida, validación de horarios, una vista `/admin`
protegida y reenvío por WhatsApp — todo esto requiere un backend con acceso a la base de
datos ([[0001]]), desplegable en Vercel free tier ([[0002]]). Había que decidir cómo se
sirve ese backend junto al frontend existente.

## Decisión

Migrar el frontend de Vite a **Next.js con App Router**, usando sus API routes para toda la
lógica de servidor (crear reserva, consultar disponibilidad, listar reservas en admin,
login de admin).

## Alternativas consideradas

- **Mantener Vite SPA + Vercel Serverless Functions (`/api`)** — requería la migración
  mínima (cero cambios al frontend existente), agregando solo una carpeta `/api` con
  funciones Node.js sueltas en el mismo repo. Viable y más simple de adoptar, pero el
  usuario prefirió la estructura full-stack más convencional de Next.js.
- **Backend separado (otro proyecto Vercel u otro servicio tipo Railway/Render) + Vite en
  Vercel** — descartado por agregar dos despliegues a coordinar sin beneficio claro para un
  producto operado por una sola persona, y porque Vercel ya soporta funciones serverless en
  el mismo repo.

## Consecuencias

- Estructura full-stack estándar del ecosistema Vercel (API routes, posible SSR/SSG a
  futuro), con un solo repo y un solo deploy.
- Trade-off: requiere migrar el frontend existente de Vite a Next.js (reescribir el punto de
  entrada, el routing de `/` vs `/reservar` vs `/admin`, y el build/config), un costo de
  migración que no existiría si se hubiera mantenido Vite + funciones sueltas. Los
  componentes de UI (`src/components/*`) y los tokens de Tailwind se conservan tal cual; lo
  que cambia es el shell de la app y el sistema de rutas.
