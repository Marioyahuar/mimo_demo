# Deploy Plan — Mimo Pet Spa

Fecha: 2026-10-14
Estado: GENERADO y verificado en local; EXECUTE en curso (ver registro al final)

Objetivo de esta pasada: endurecer el CI/CD existente (Vercel) agregando gates reales, en
particular que corran los tests de Playwright antes de cualquier release a producción.

## Resumen del proyecto

- Next.js 16 (App Router) + Prisma 7 + Neon Postgres, un solo repo / un solo proyecto Vercel
  (Hobby, ADR-0002). Node 22, npm (`package-lock.json`).
- **No hay CI/CD en el repo** (`.github/` no existe; `SECURITY-REPORT.md` lo confirma). El
  repo `Marioyahuar/mimo_demo` es **público**, sin branch protection en `main`, y GitHub no
  registra ningún *deployment* → todo indica que Vercel se opera por CLI (`.vercel/project.json`
  → proyecto `mimo-demo`), no por integración Git. **A confirmar** (ver Decisiones abiertas).
- Tests: 3 specs Playwright en `tests/` (`reservar-cita`, `reservar-cita-errores`,
  `reservas-api-catalogo`). **Escriben reservas reales**, por eso `playwright.config.js` exige
  `.env.e2e` con la branch Neon `dev/e2e-reservar-cita` y nunca toca producción. No existe un
  script `npm test` / `test:e2e` en `package.json`.
- Hoy el "gate" es la disciplina manual: nada impide desplegar con tests rotos.
- Producción: rama `production` de Neon; migración `20261001030713_init_reservations` ya aplicada.

## Sistema de deployment propuesto

### Build
`npm ci` → `prisma generate` (ya en `postinstall`) → `next build`. Determinista por lockfile.
En CI se agrega el script `test:e2e` y los E2E corren contra `next build && next start` (no
`next dev`), para probar lo mismo que se despliega. `webServer.command` pasa a depender de
`process.env.CI`; en local no cambia.

### Artifact
El build de Vercel, trazable al commit SHA de `main` que pasó los gates. Se construye **una
vez en CI** (`vercel build`) y se publica ese mismo resultado con `vercel deploy --prebuilt`,
de modo que lo probado es lo desplegado.

### Config & Secrets
| Dato | Tipo | Dónde vive |
|---|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` de la branch **dev/e2e** | secret | GitHub Actions → Environment `e2e` |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secret / id | GitHub Actions → Environment `production` (con revisor requerido) |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `DATABASE_URL` prod, `NEXT_PUBLIC_WHATSAPP_NUMBER` | secret / config | **Se quedan solo en Vercel** (Production); CI nunca las ve |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | config pública | Vercel |

Regla: la URL de la DB de producción no entra a GitHub. Los E2E solo reciben la branch de
desarrollo. Los valores reales de `.env.e2e` **no se copian en este plan ni se leen en logs**.

### Infraestructura
Sin cambios: Vercel Hobby + Neon (ADR-0001/0002). GitHub Actions (gratis en repos públicos)
como orquestador. No se introduce infraestructura nueva.

### Entornos
- **E2E/CI**: branch Neon `dev/e2e-reservar-cita`, app levantada dentro del runner.
- **Producción**: Vercel Production + branch Neon `production`.
- No se crea staging (POC de un solo dueño; Preview de Vercel queda fuera de esta pasada).
  Cambia solo config/secrets entre entornos, no código.

### Estrategia de release
**Release directo, manual-aprobado**, desde `main` solo si todos los gates pasan. Sin canary ni
blue/green: tráfico bajo, un solo dueño, y Vercel permite rollback instantáneo (ver Recovery).

### Data & Migrations
`prisma migrate deploy` contra producción **no se automatiza en esta versión**: sigue siendo un
paso manual con autorización explícita (README). El pipeline solo verifica que el esquema esté
alineado (`prisma validate` + `prisma migrate diff` contra la branch e2e, informativo). Nota: un
rollback de código **no** revierte datos ni migraciones; migraciones deben ser compatibles hacia
atrás (expand → contract) para poder volver a la versión anterior de la app.

### Deploy gates
Workflow `.github/workflows/ci-cd.yml`:

1. `quality` — `npm ci`, `prisma validate`, `next build` (en `pull_request` y `push` a `main`).
2. `e2e` — instala Chromium, corre Playwright con la branch Neon dev. `concurrency` con grupo
   único para que **dos corridas no compartan la misma DB a la vez**. Sube `playwright-report`
   y traces como artefacto solo si falla.
3. `audit` — `npm audit --omit=dev --audit-level=high` (informativo al inicio).
4. `deploy` — solo en `push` a `main`, `needs: [quality, e2e]`, Environment `production`
   (aprobación manual del dueño). Ejecuta `vercel pull` → `vercel build --prod` → `vercel deploy
   --prebuilt --prod`.
5. `smoke` — tras el deploy, chequeos **de solo lectura** contra la URL de producción.

**Que sea un gate real, no solo un check:** si Vercel tuviera la integración Git activa, un push
a `main` desplegaría aunque Playwright falle. Por eso el diseño exige:
- Confirmar que el proyecto no esté conectado a Git; si lo está, desconectarlo o agregar en
  `vercel.json` `{"git": {"deploymentEnabled": false}}`, de modo que **el único camino a
  producción sea el job `deploy`** de CI.
- Branch protection en `main` (PR + checks `quality` y `e2e` obligatorios), para que el check
  también bloquee el merge.

**Seguridad por ser repo público:** workflows con trigger `pull_request` (nunca
`pull_request_target`); los secrets no se exponen a forks, así que los E2E de PRs externos no
corren (se corren tras el merge o por `workflow_dispatch` del dueño). `permissions:
contents: read` por defecto; acciones fijadas por SHA; `.github/` protegido con CODEOWNERS.

### Verify & Observe
Smoke post-deploy (solo lectura, no crea reservas en producción): `GET /` → 200,
`GET /reservar` → 200, `GET /api/reservations/availability?date=<futura>` → 200 con JSON
válido, `GET /admin` sin cookie → no expone datos (redirige/401). Un smoke rojo marca el release
como **fallido** y avisa en el resumen del job. Observación posterior: logs de Vercel y métricas
de Neon, revisión manual (sin herramienta de monitoreo nueva en esta pasada).

### Recovery
- **Código**: `vercel rollback` / "Promote" del deployment anterior (instantáneo). Lo ejecuta el
  dueño, nunca el pipeline automáticamente.
- **Datos**: restauración con Neon (restore de branch/snapshot a un punto en el tiempo) — acción
  destructiva, siempre con autorización explícita.
- **Secrets comprometidos**: rotar `ADMIN_*` y el token de Vercel; invalida sesiones de admin.
- Incidente: documentarlo en el registro de este archivo.

## Decisiones tomadas (reemplazan a las abiertas)

1. Vercel `mimo-demo` tiene Git conectado; `vercel.json` (`git.deploymentEnabled=false`) desactiva
   el deploy por Git. El único camino a producción es el job `deploy` del CI.
2. **Deploy Hook en vez de `VERCEL_TOKEN`**: crear tokens da 403 con la sesión del CLI. El job
   `deploy` hace `POST` al hook (`ci-gate`, ref `main`) y Vercel construye con sus propias
   variables de Production. Ya no hay `vercel build`/`--prebuilt` ni `VERCEL_ORG_ID/PROJECT_ID`.
3. Deploy **automático** cuando pasan `quality` y `e2e` en `main` (sin revisor requerido).
4. Migraciones de Prisma fuera del pipeline (manuales).
5. Sin branch protection en `main`.
6. PRs de forks no corren E2E (sin secrets).
7. Demo educativa: se ignoran `SECURITY-REPORT.md` y vulnerabilidades de dependencias.

## Fuera de alcance de esta pasada
Ambiente staging/Preview, rate limiting y otros hallazgos de `SECURITY-REPORT.md`, tests
unitarios, monitoreo/alertas, notificaciones. Se pueden planificar en una pasada siguiente.

## Autorizaciones

Concedidas por el dueño (solo estas): crear environments `e2e`/`production`; secrets
`E2E_DATABASE_URL(_UNPOOLED)` y variable `PRODUCTION_URL`; crear el Deploy Hook y guardarlo como
secret `VERCEL_DEPLOY_HOOK_URL` (environment `production`); generar `ADMIN_PASSWORD` y añadirlo a
Vercel Production; commit + push a `main`. Cualquier otra acción (branch protection, rollback,
migraciones, cambios en Neon) requiere nueva autorización.

## Registro de ejecución y verificación

- 2026-10-20 — GENERATE hecho: workflow `ci-cd.yml`, script `test:e2e`, `vercel.json`,
  `.env.example`; 13 tests Playwright pasan en local y con `CI=1`. Deploy Hook probado antes.
- 2026-10-20 — Creados environments `e2e` y `production`; secrets `E2E_DATABASE_URL` y
  `E2E_DATABASE_URL_UNPOOLED` (env `e2e`, desde `.env.e2e` con `util.parseEnv`); variable
  `PRODUCTION_URL=https://mimo-demo-five.vercel.app`.
- 2026-10-20 — Deploy Hook `ci-gate` (ref `main`) creado; URL guardada solo como secret
  `VERCEL_DEPLOY_HOOK_URL` en `production` (no impresa ni escrita en archivos).
- 2026-10-20 — `ADMIN_PASSWORD` aleatorio añadido a Vercel Production; copia local en
  `.env.admin-production` (ignorado por git).

- 2026-10-20 — Commit `c235a87` empujado a `main`: run 39350516934 verde (quality, e2e, deploy por
  hook, smoke). El paso de `npm audit` falla pero es informativo (`continue-on-error`).
- 2026-10-20 — Verificación en https://mimo-demo-five.vercel.app: `/` 200, `/reservar` 200,
  `/admin` sin sesión 307, API admin sin sesión 401, login con clave errónea 401, login con la
  clave nueva 200, `/admin` y `/api/admin/reservations` con sesión 200, disponibilidad 200 (lee la
  DB de producción). No se creó una reserva real en producción; el flujo de reserva completo lo
  cubren los 13 E2E sobre la branch Neon de desarrollo.
- Recovery disponible: `vercel rollback` (lo ejecuta el dueño); para revocar el hook:
  `vercel deploy-hooks remove ci-gate --yes` y rotar el secret.
