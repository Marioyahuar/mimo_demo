# CLAUDE.md — Mimo Pet Spa

## 1. Contexto del proyecto

**Qué es.** Landing page + sistema de reservas de citas para "Mimo Pet Spa", un spa de
mascotas. El cliente reserva desde el celular sin cuenta; el dueño ve todas las reservas en
un panel `/admin` protegido por clave única. En producción en
https://mimo-demo-five.vercel.app.

**Qué problema resuelve.** Las reservas se coordinaban por WhatsApp, chat por chat: el dueño
perdía tiempo, olvidaba citas y cruzaba horarios (doble booking). El producto persiste cada
reserva en una base compartida, impide reservar un slot ocupado y le da al dueño una vista
única de la agenda. El WhatsApp queda como respaldo (botón `wa.me` en la confirmación).

**Usuarios.** Cliente que reserva (sin login) y dueño del spa (único administrador, sin
roles ni staff).

## 2. Mapa de documentación — leer antes de planificar

La documentación sigue el pipeline del proyecto, numerada en el orden en que se produjo.
Cada documento consume al anterior. Índice completo en [`docs/README.md`](docs/README.md).

| Paso | Documento | Úsalo para |
|---|---|---|
| 01 | `docs/01-producto/PRD.md` | Alcance, **no alcance**, casos borde, criterios de éxito |
| 02 | `docs/02-diseno/DESIGN.md` | Sistema visual (tokens, tipografía, formas, elevación) |
| 03 | `docs/03-arquitectura/TECH-DESIGN.md` + `adrs/` | Arquitectura, contrato de API, decisiones (ADR-0001…0011), riesgos aceptados |
| 04 | `docs/04-backlog/BACKLOG.md` | Ítems ordenados por dependencias; cada ítem = un change de OpenSpec |
| 05 | `openspec/specs/` y `openspec/changes/archive/` | Comportamiento vigente por capacidad y su historial |
| 06 | `docs/06-diagramas/` | Secuencia de reserva y flujo del admin (Mermaid) |
| 07 | `tests/` + `docs/07-testing/README.md` | Qué cubren los E2E y cómo correrlos |
| 08 | `docs/08-seguridad/SECURITY-REPORT.md` | Hallazgos SP-01…SP-09 y decisiones pendientes |
| 09 | `docs/09-deploy/DEPLOY-PLAN.md` | Pipeline CI/CD, entornos, migraciones, recovery |

Las skills del curso (`generar-prd-conversacional`, `generar-tech-design`, `generar-backlog`,
`security-pass`, `deploy-pass`) escriben por defecto en la raíz. **En este repo, guarda o
actualiza el documento en su carpeta de `docs/`**, nunca en la raíz.

## 3. Arquitectura (resumen; detalle en el TECH-DESIGN)

- **Next.js 16 (App Router) en Vercel**, un solo proyecto: UI y API routes juntas (ADR-0002, ADR-0003).
- **PostgreSQL en Neon vía Prisma 7** con `@prisma/adapter-neon` (ADR-0001, ADR-0004). Una
  sola tabla `reservations` desnormalizada (ADR-0005), `prisma/schema.prisma`.
- **Anti doble booking por constraint** `UNIQUE (date, time)` en la DB, no por chequeo previo (ADR-0007).
- **Creación idempotente**: `POST /api/reservations` exige `idempotencyKey` (`UNIQUE`);
  el reintento devuelve `200` con la misma reserva (ADR-0011).
- **Zona horaria fija del negocio** (`America/Lima`, ADR-0010).
- **Admin**: clave única contra `ADMIN_PASSWORD`, cookie `HttpOnly` firmada con HMAC (ADR-0008).

```
src/
  app/                       rutas: / , /reservar , /admin , /admin/login
  app/api/reservations/      POST (crear) y availability/ (GET slots ocupados)
  app/api/admin/             login/ (POST) y reservations/ (GET listado)
  components/                secciones de la home; booking/ReservarCita.jsx = wizard de reserva
  components/ui/             primitivas (Button, Container, Icon, Pill, SectionHeading)
  data/content.js            todo el copy y el catálogo de servicios/extras
  lib/time.js                única vía para "hoy" y fecha+hora → instante
  lib/reservations.js        validación server-side del body y serialización
  lib/admin-auth.js          firma y verificación de la sesión admin
  lib/db.js                  cliente Prisma (singleton)
  proxy.js                   barrera de /admin y /api/admin/* (se re-verifica en cada handler)
```

## 4. Reglas duras

- **Lee `docs/01-producto/PRD.md` completo antes de planificar o generar código.** Si una
  solicitud cae fuera de "Alcance" o dentro de "No alcance", **detente y consulta** antes de
  implementar. Hoy fuera de alcance: cuentas o roles múltiples, recuperación de contraseña,
  email/SMS, pagos o señas, múltiples groomers/staff y recordatorios automáticos.
- **Toda decisión de arquitectura nueva o cambiada lleva un ADR** en
  `docs/03-arquitectura/adrs/` (formato MADR, numeración correlativa). No edites un ADR
  aceptado: crea uno nuevo que lo reemplace.
- **Los cambios de comportamiento pasan por OpenSpec** (`/opsx:propose` → `/opsx:apply` →
  `/opsx:archive`), un change por ítem de backlog. No implementes sin spec.
- **Fechas y horas solo vía `src/lib/time.js`.** Nunca `new Date()` para "hoy" ni
  conversiones a mano: rompe la validación `DATE_IN_PAST` (ADR-0010).
- **El servidor es la fuente de verdad**: el precio, el servicio y los extras se validan
  contra `src/data/content.js` en `src/lib/reservations.js`, nunca se confía en el cliente.
- **No reemplaces la constraint `UNIQUE (date, time)`** por un chequeo previo en código: es
  lo que garantiza 0 reservas dobles bajo concurrencia.
- **Tokens de diseño solo desde `tailwind.config.js`** (derivados de `DESIGN.md`); copy solo
  desde `src/data/content.js`. Nada de colores ni textos hardcodeados en componentes.
- **Nunca toques la rama `production` de Neon** desde desarrollo ni desde tests. Los E2E
  escriben reservas reales: usan `.env.e2e` (rama de desarrollo).
- **Los riesgos aceptados** (sección final del TECH-DESIGN) y los hallazgos abiertos del
  SECURITY-REPORT son decisiones del dueño del producto: no los "arregles de paso".
- No leas `.env`, `.env.local`, `.env.e2e` ni `admin-credentials.local` (bloqueado en
  `.claude/settings.json`).

## 5. Comandos

```bash
npm install                       # instala y corre prisma generate
cp .env.example .env              # rama de desarrollo de Neon, nunca production
npx prisma migrate deploy         # aplica migraciones a la rama de .env
npm run dev                       # http://localhost:3000
npm run build                     # prisma generate && next build (lo mismo que corre CI)
npm run test:unit                 # tests unitarios (node:test) de src/lib
npm run test:e2e                  # Playwright; requiere .env.e2e con una rama Neon de desarrollo
```

Antes de dar una tarea por terminada: `npm run build` y los tests que toquen tu cambio.
`main` despliega a producción solo si pasan los jobs `quality` y `e2e` de
`.github/workflows/ci-cd.yml`.

## 6. Agentes y skills del proyecto

- `.claude/agents/spec-owner.md`: lleva un ítem del backlog por el ciclo OpenSpec completo.
- `.claude/agents/developer.md`: implementa una tarea ya definida.
- `.claude/agents/code-reviewer.md`: revisión de solo lectura contra PRD y convenciones.
- `.claude/skills/`: skills del curso (enlazadas desde `.agents/skills/`), OpenSpec, Neon y
  `agregar-servicio-spa` (alta de un servicio en home + wizard).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
