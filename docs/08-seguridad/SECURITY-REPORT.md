# Security Report — Mimo Pet Spa

Fecha: 2026-10-12 · Tipo: Security Pass (solo análisis, el proyecto no fue modificado)
Alcance excluido por pedido del usuario: `docs/archivado/` (hoy `docs/03-arquitectura/TECH-DESIGN-v1.md`).

## Executive Summary

**Qué es el sistema.** Next.js 16 (App Router) desplegado en Vercel, con Prisma 7 sobre Neon
Postgres. Tiene una landing estática, un flujo de reserva público y anónimo (`/reservar` →
`POST /api/reservations`, `GET /api/reservations/availability`) y un panel `/admin` protegido
por una clave única con cookie de sesión firmada con HMAC. Guarda PII de clientes (nombre,
teléfono, email y notas de la mascota). Según `README.md`, la migración ya está aplicada en la
rama `production` de Neon, así que el sistema está (o está listo para estar) en uso real.

**Actores considerados.** Cliente anónimo (legítimo o malicioso / script), dueño del spa
(admin), alguien que adivina o roba la clave de admin, y agentes de IA con acceso al repo y a
las herramientas de infraestructura (Neon MCP, Vercel CLI).

**Postura general.** Los controles centrales están bien resueltos: autorización del lado del
servidor en dos capas, comparación de la clave en tiempo constante, doble booking imposible por
constraint de la DB, idempotencia y nada de SQL crudo ni HTML sin escapar. Los riesgos reales
están en la **disponibilidad e integridad del flujo público**: es anónimo, no tiene límites
de tasa, de tamaño ni de catálogo, y no permite cancelar. Varios de estos riesgos ya están
**aceptados como "POC"** en `TECH-DESIGN.md`, pero el README muestra un despliegue a
producción, así que esa premisa merece revisarse (ver Governance).

| Severidad | Cantidad |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 6 |
| LOW | 2 |

**Capas revisadas:** producto (PRD), arquitectura (TECH-DESIGN, ADRs 0001–0011), specs
(OpenSpec `openspec/specs/*`), código (`src/`, `prisma/`, config), dependencias (`npm audit`),
tests (Playwright E2E), configuración del harness de agentes (`.claude/`, `CLAUDE.md`).
**Capas omitidas por falta de material:** no hay CI/CD en el repo (el despliegue es la
integración nativa de Vercel, cuya configuración no está versionada), ni tests unitarios o de API.

## Security Strengths

- **Autorización de admin en el servidor y en dos capas.** `src/proxy.js` hace de barrera
  optimista y además `src/app/admin/page.jsx` y `src/app/api/admin/reservations/route.js`
  verifican la sesión otra vez (`hasValidAdminSession`). Llamar directo a la API sin cookie
  devuelve `401`.
- **Manejo de la clave y el token.** `passwordMatches` compara HMACs en tiempo constante.
  El token valida su formato con una regex estricta, la firma y la expiración. La cookie es
  `httpOnly`, `secure` en producción y `sameSite=lax`. Si faltan `ADMIN_PASSWORD` o
  `ADMIN_SESSION_SECRET`, falla cerrado (`SERVER_MISCONFIGURED`).
- **Doble booking imposible a nivel DB.** `@@unique([date, time])` más la desambiguación de
  `P2002` por `idempotencyKey` (ADR-0007/0011). La regex `^([01]\d|2[0-3]):([0-5]\d)$` ya
  bloquea la variante `"9:00"` vs `"09:00"` que se menciona como riesgo en TECH-DESIGN.
- **Sin superficie de inyección.** Todo el acceso a datos pasa por Prisma tipado. No hay
  `$queryRaw`, `$executeRaw`, `eval` ni `dangerouslySetInnerHTML` en `src/`, y React escapa
  todo el contenido que el admin ve.
- **Mínima exposición en endpoints públicos.** `availability` solo devuelve horas ocupadas,
  sin PII. Las respuestas usan `Cache-Control: no-store`. El listado de admin omite
  `idempotencyKey`.
- **Validación server-side de slots pasados** en la zona horaria del negocio (ADR-0010).
- **Higiene de secretos en git.** `.env*`, `*.local`, `.neon` y `.vercel` están ignorados. No
  aparecen connection strings ni claves en el historial de git (se revisó `git log -p`
  completo). El índice `.codegraph/` no contiene patrones de secretos.
- **Aislamiento de tests contra producción.** `playwright.config.js` exige `.env.e2e`
  (rama de desarrollo) y usa `reuseExistingServer: false` para no reutilizar un server que
  apunte a producción. Las migraciones no corren en el build (README §Despliegue).

## Findings

### SP-01 — Un anónimo puede agotar permanentemente la agenda y el almacenamiento

- **Severity:** HIGH
- **Confidence:** HIGH
- **Category:** Business-logic abuse / Resource exhaustion / Missing rate limiting
- **Affected artifact:** Código, Diseño (TECH-DESIGN "Riesgos aceptados"), Spec `reservation-api`
- **Location:** `src/app/api/reservations/route.js:15-50`, `src/lib/reservations.js:72-76`, `prisma/schema.prisma`
- **Description:** `POST /api/reservations` es anónimo y no tiene rate limiting, CAPTCHA ni
  límite por contacto. `time` acepta **cualquier** `HH:mm` (1440 valores por día) y no
  valida contra el catálogo `booking.slots` (`src/data/content.js:306`). `date` acepta
  cualquier fecha futura sin horizonte máximo (p. ej. `9999-12-31`). Tampoco existe
  cancelación desde el producto: cada fila es permanente.
- **Evidence:** `parseReservationBody` solo hace `isValidSlot('2000-01-01', body.time)` (formato).
  No hay comparación con `booking.slots` en el servidor. TECH-DESIGN.md:244-245 lo reconoce.
- **Attack scenario:** Un script recorre los 6 slots reales de los próximos 90 días (540
  requests, segundos de trabajo) con datos falsos. Desde ese momento ningún cliente real
  puede reservar, y el dueño ve cientos de citas falsas mezcladas con las reales. Con horas
  arbitrarias y fechas sin tope, el mismo script puede insertar filas sin límite hasta llenar
  la cuota de almacenamiento de Neon. Ahí **todas** las reservas fallan con `500`.
- **Potential impact:** Pérdida total de la función central del producto, que vuelve a
  WhatsApp. Las citas reales quedan enterradas en ruido. Recuperarse exige SQL manual en la
  consola de Neon.
- **Justificación de la severidad:** El ataque no requiere habilidad, es permanente y anula
  ambos criterios de éxito del PRD. El sistema está desplegado a producción según el README.
- **Existing mitigation:** Ninguna técnica. Está documentado como riesgo aceptado "POC".
- **Recommended remediation:** (1) Validar en el servidor que `time ∈ booking.slots` y que
  `date ≤ hoy + N días`, con un `CHECK` opcional en la DB. Esto solo es código y cierra la
  parte ilimitada. (2) Rate limiting por IP en `POST /api/reservations`, por ejemplo con el
  Firewall/WAF de Vercel o un contador en Postgres. (3) Decidir con producto si hace falta
  cancelación desde `/admin`.
- **Suggested verification:** Test de API: `time: "03:17"` → `422`; `date` a 2 años → `422`;
  N+1 POST desde la misma IP en una ventana → `429`.
- **Required change type:** DESIGN / ADR CHANGE (revisa un riesgo aceptado; la parte (1) es un CODE FIX acotado)

### SP-02 — Sin límites de tamaño en los campos ni en `extras`

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Unsafe input handling / Resource exhaustion
- **Affected artifact:** Código, Spec `reservation-api`
- **Location:** `src/lib/reservations.js:41-58`, `src/lib/admin-reservations.js:4-14`, `src/app/admin/page.jsx`
- **Description:** Los campos de texto (`petNotes`, `contactName`, `serviceTitle`, etc.) y el
  arreglo `extras` no tienen longitud máxima, ni en el código ni en la DB (`TEXT`,
  `TEXT[]`). El panel admin carga **todas** las filas sin paginación (riesgo aceptado aparte
  por UX).
- **Evidence:** `parseReservationBody` solo verifica `typeof === 'string'` y que no esté vacío.
  `extras` se acepta si "todos son strings". No hay `maxLength` en el form ni en la API.
- **Attack scenario:** Un atacante envía pocas reservas con `petNotes` de ~4 MB (el límite de
  body de Vercel) y `extras` con miles de entradas. Cada visita a `/admin` serializa y
  renderiza megabytes: el panel se vuelve lento o directamente no carga, y el dueño pierde
  visibilidad. También acelera el agotamiento de almacenamiento de SP-01.
- **Potential impact:** Denegación de servicio del panel admin y costo de almacenamiento y egress.
- **Existing mitigation:** Límite de body de la plataforma (Vercel, aprox. 4.5 MB). No es una
  medida del proyecto.
- **Recommended remediation:** Límites por campo en `parseReservationBody` (p. ej. nombres
  ≤ 80, notas ≤ 500, email ≤ 254) y `extras.length ≤ catálogo`. Reflejarlos con `maxLength`
  en el form.
- **Suggested verification:** Test de API con `petNotes` de 10 000 caracteres → `422 fields:['petNotes']`.
- **Required change type:** CODE FIX

### SP-03 — Servicio, precio y extras los decide el cliente, no el servidor

> **Estado: CORREGIDO (2026-10-12).** `parseReservationBody` valida servicio, extras y tamaño
> contra `booking` de `content.js`, deriva el precio del catálogo e ignora el del body, y valida
> el formato de email y teléfono. Verificado con `tests/reservas-api-catalogo.spec.js` (falla
> con el código anterior y pasa con el fix). La spec `reservation-api` se actualizó.

- **Severity:** MEDIUM
- **Confidence:** MEDIUM
- **Category:** Business-logic abuse / Data integrity
- **Affected artifact:** Código, Diseño (ADR-0005 denormalización)
- **Location:** `src/lib/reservations.js:7-16`, `src/components/booking/ReservarCita.jsx:160-163`
- **Description:** El servidor guarda `serviceTitle`, `servicePriceLabel`, `extras` y
  `petSize` tal como vienen en el body. No los contrasta con el catálogo estático
  (`booking.services`, extras). Lo mismo pasa con `contactEmail` y `contactPhone`, que no
  tienen validación de formato.
- **Evidence:** `REQUIRED_STRINGS` solo valida que sean strings no vacíos. El precio se manda
  desde el cliente (`servicePriceLabel: service.price`).
- **Attack scenario:** Un cliente edita el request y reserva "Baño completo" con
  `servicePriceLabel: "Desde $1"`, o inventa un servicio o un extra que no existe. El dueño
  ve en `/admin` un precio o servicio que el spa nunca ofreció, como si fuera lo que el
  cliente aceptó al reservar.
- **Potential impact:** Disputas de precio, servicios que no existen en la agenda y reservas
  con contacto falso que no se pueden rastrear (no-shows).
- **Justificación de la confianza (MEDIUM):** El impacto depende de si el dueño trata la
  etiqueta de precio como compromiso. El PRD no lo dice.
- **Existing mitigation:** Ninguna.
- **Recommended remediation:** Resolver en el servidor el servicio y los extras por
  título/ID contra `src/data/content.js` y tomar el precio de ahí, ignorando el que manda
  el cliente. Usar un enum para `petSize` y validar mínimamente el email y el teléfono.
- **Suggested verification:** Test de API: `servicePriceLabel` alterado → la fila guarda el
  precio del catálogo; `serviceTitle` inexistente → `422`.
- **Required change type:** CODE FIX

### SP-04 — Login de admin sin throttling y sesión de 7 días sin cierre ni revocación documentada

- **Severity:** MEDIUM
- **Confidence:** MEDIUM
- **Category:** Authentication / Session management
- **Affected artifact:** Código, ADR-0008, TECH-DESIGN "Riesgos aceptados"
- **Location:** `src/app/api/admin/login/route.js`, `src/lib/admin-auth.js:6,45-60`
- **Description:** `POST /api/admin/login` permite intentos ilimitados contra la clave
  única, que da acceso a la PII de **todos** los clientes. La sesión dura 168 h por defecto
  y no hay endpoint ni botón de logout. Rotar `ADMIN_PASSWORD` no invalida las cookies ya
  emitidas. Rotar `ADMIN_SESSION_SECRET` sí lo hace, pero ese procedimiento no está
  documentado.
- **Evidence:** No hay contador ni retardo en el handler de login. No hay ruta de logout en
  `src/app/`. TECH-DESIGN.md:247 lo acepta como riesgo.
- **Attack scenario:** Un atacante hace fuerza bruta con un diccionario contra el login. Si
  la clave es débil o reutilizada, entra. Otro caso: el dueño abre `/admin` en un
  dispositivo prestado o compartido y la sesión queda viva 7 días sin poder cerrarla.
- **Potential impact:** Exposición de nombre, teléfono y email de todos los clientes.
- **Justificación de la confianza (MEDIUM):** La explotabilidad depende de la fortaleza real
  de `ADMIN_PASSWORD`, que no se inspeccionó (a propósito no se leyeron `.env*` ni
  `admin-credentials.local`).
- **Existing mitigation:** Comparación en tiempo constante, cookie `httpOnly` y verificación
  en el servidor.
- **Recommended remediation:** Throttling del login (por IP, con backoff), una ruta de logout
  que borre la cookie y documentar en el README que "revocar todas las sesiones = rotar
  `ADMIN_SESSION_SECRET`". Exigir una clave larga y aleatoria (ya existe la recomendación
  `openssl rand` para el secreto, pero no para la clave).
- **Suggested verification:** Test: 20 logins fallidos seguidos → `429`; logout → la cookie
  queda vencida y `/api/admin/reservations` responde `401`.
- **Required change type:** DESIGN / ADR CHANGE (revisa un riesgo aceptado)

### SP-05 — Dependencias de producción con advisories HIGH (Next.js 16.3.6)

- **Severity:** MEDIUM
- **Confidence:** MEDIUM
- **Category:** Dependency / supply-chain risk
- **Affected artifact:** `package.json`, `package-lock.json`
- **Location:** `next@16.3.6` (directo), `sharp@0.35.4`, `source-map-js@1.2.1`, y la cadena
  `prisma` → `@prisma/config` → `deepmerge-ts`/`mysql2`
- **Description:** `npm audit --omit=dev` reporta 7 advisories HIGH. Para `next` incluyen
  cache poisoning de páginas SSG/ISR (GHSA-mcj8-r9mp-w47p, GHSA-4jqv-mc3x-m676), SSRF en
  Image Optimization (GHSA-cjq9-62q9-8jv4) y fuga de información del servidor dev
  (GHSA-39w2-rjm5-chcv). El rango afectado es `16.0.0–16.3.7` y ya existe `16.3.8`.
- **Evidence:** Salida de `npm audit` y `npm ls next` → `16.3.6`.
- **Attack scenario:** La landing (`/`) es SSG. Un cache poisoning podría servir contenido
  sustituido a otros visitantes. Algunos advisories aplican solo a self-hosting, y en Vercel
  el impacto es menor. La app no usa `next/image` y `remotePatterns` está vacío, lo que
  reduce el SSRF.
- **Potential impact:** Variable según el advisory. El arreglo es de bajo costo (patch).
- **Justificación de la confianza (MEDIUM):** No se verificó qué advisories aplican al runtime
  de Vercel. La cadena de `prisma` es tooling de CLI/build: `mysql2` no se usa con Postgres
  y la corrección sugerida por npm es un downgrade mayor que **no** conviene aplicar a ciegas.
- **Existing mitigation:** Hosting en Vercel, que mitiga parcialmente los casos self-hosted.
- **Recommended remediation:** Subir `next` a `≥16.3.8` y `npm audit fix` sin `--force` para
  `sharp`/`source-map-js`. Seguir los advisories de `prisma` hasta un fix en 7.x/8.x en vez de
  bajar a 6.x.
- **Suggested verification:** `npm audit --omit=dev` sin HIGH en `next`, `sharp` ni `source-map-js`, y `npm run build` OK.
- **Required change type:** CODE FIX

### SP-06 — Las rutas de admin no tienen tests automatizados

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Missing security tests
- **Affected artifact:** Tests, Spec `admin-access`
- **Location:** `tests/` (solo `reservar-cita.spec.js` y `reservar-cita-errores.spec.js`)
- **Description:** La spec `admin-access` define escenarios explícitos (`401` sin cookie al
  llamar directo, `401` con clave incorrecta y sin `Set-Cookie`), pero ningún test los
  ejecuta. Tampoco hay tests de API para la validación de entrada (SP-01..03).
- **Evidence:** `grep` en `tests/` no encuentra `admin` ni requests directos a `/api/admin/*`.
  ADR-0008 (Consecuencias) advierte: "un endpoint nuevo que olvide la verificación quedaría
  expuesto sin protección".
- **Attack scenario:** Un refactor futuro (p. ej. un endpoint nuevo `/api/admin/export`, o un
  cambio en el `matcher` del proxy) deja datos expuestos y nada lo detecta antes del deploy.
- **Potential impact:** Regresión silenciosa que expone la PII de todos los clientes.
- **Justificación de la severidad:** Es el único control que protege la PII, y su propio ADR
  identifica ese modo de falla.
- **Existing mitigation:** Doble verificación en proxy y handler (no hay regresión hoy).
- **Recommended remediation:** Agregar un spec Playwright con `request` que cubra:
  `GET /api/admin/reservations` sin cookie → `401` sin datos; con cookie forjada o vencida
  → `401`; `GET /admin` sin cookie → redirect a `/admin/login`; login con clave incorrecta
  → `401` sin `Set-Cookie`; login correcto → `200` con cookie `HttpOnly`.
- **Suggested verification:** Romper a propósito la verificación en el handler y confirmar que el test falla.
- **Required change type:** TEST FIX

### SP-07 — Credenciales de producción al alcance de agentes con herramientas de escritura

- **Severity:** MEDIUM
- **Confidence:** MEDIUM
- **Category:** Process / Harness — secrets handling, least privilege
- **Affected artifact:** Configuración del harness (`.claude/settings.json`, `.claude/agents/spec-owner.md`, Neon MCP), archivos locales
- **Location:** `.claude/settings.json` (cambio sin commitear), `.claude/agents/spec-owner.md:4,29`, `.env.local`, `admin-credentials.local`
- **Description:** El directorio de trabajo contiene credenciales de producción en texto
  plano: según `.env.example` y `playwright.config.js`, `.env.local` apunta a producción, y
  además está `admin-credentials.local`. Los agentes que trabajan acá tienen el MCP de Neon
  en "Write mode" con herramientas destructivas expuestas en la sesión principal. El
  sub-agente `spec-owner` tiene `run_sql`, `run_sql_transaction` y
  `complete_database_migration`, y la restricción de "nunca escribir en la rama de
  producción" es **solo una instrucción en el prompt**, sin ninguna regla técnica que la
  haga cumplir. Además `settings.json` pasa a permitir sin confirmación `vercel env add:*`,
  que puede escribir variables del entorno Production.
- **Evidence:** spec-owner.md:29 ("Nunca ejecutes DDL ni escrituras sobre la rama de
  producción" es texto). El diff de `.claude/settings.json` agrega `Bash(vercel env add:*)` a
  `allow`. Los archivos tienen permisos `600`/`644` y están ignorados por git, lo que es una
  mitigación parcial.
- **Attack scenario:** Un agente se equivoca, o recibe una instrucción inyectada desde
  contenido no confiable, y ejecuta `run_sql` contra la rama `production`, o
  `vercel env add ADMIN_PASSWORD production` con un valor conocido. El resultado: reservas
  de clientes borradas, que el PRD dice que "no se pierden nunca", o una toma del panel admin.
- **Potential impact:** Pérdida o alteración de datos de producción, o acceso a la PII.
- **Existing mitigation:** Instrucciones en el prompt, permisos de archivo, `.gitignore`, y
  `spec-owner` no tiene herramientas de borrado de ramas o proyectos.
- **Recommended remediation:** Usar un rol de Neon de solo lectura o un MCP limitado al
  proyecto o rama de desarrollo para los agentes. Activar la protección de rama de Neon en
  `production`. Quitar `vercel env add:*` del allowlist, o limitarlo a
  `preview`/`development`. Guardar las credenciales de admin en un gestor de contraseñas en
  vez de un archivo en el repo.
- **Suggested verification:** Intentar `run_sql` de escritura sobre `production` con las
  credenciales del agente → rechazado.
- **Required change type:** PROCESS / HARNESS CHANGE

### SP-08 — PII de clientes sin aviso de privacidad ni política de retención y borrado

- **Severity:** LOW
- **Confidence:** MEDIUM
- **Category:** Privacy / Missing security requirement
- **Affected artifact:** PRD, Código (flujo de reserva)
- **Location:** `PRD.md` (no lo menciona), `src/components/booking/ReservarCita.jsx` (paso de contacto), `src/lib/admin-reservations.js`
- **Description:** Se guardan nombre, teléfono, email y notas de clientes sin plazo. El form
  no muestra aviso de tratamiento de datos y no hay mecanismo para borrar ni anonimizar
  (SP-01 cubre la falta de cancelación, pero no el borrado de PII). El negocio opera en Perú
  (`BUSINESS_TIMEZONE = 'America/Lima'`), donde rige la Ley 29733 de Protección de Datos
  Personales.
- **Evidence:** `grep` de "privacidad/datos personales" en `src/` sin resultados. El PRD no
  tiene requisitos de privacidad. `listReservations` devuelve todo el histórico.
- **Attack scenario:** No es un ataque, es una exposición acumulativa: cuanto más tiempo pasa,
  mayor es el impacto de cualquier compromiso del admin (SP-04) o de la DB. También existe
  riesgo de incumplimiento regulatorio.
- **Potential impact:** Mayor volumen expuesto ante una filtración y riesgo legal o reputacional.
- **Justificación de la confianza (MEDIUM):** La aplicabilidad legal exacta la debe confirmar
  el dueño o un asesor.
- **Existing mitigation:** El acceso al histórico requiere la clave de admin.
- **Recommended remediation:** Decisión de producto: texto breve de aviso de privacidad en el
  paso de contacto, plazo de retención (p. ej. anonimizar contacto N meses después de la
  cita) y una vía manual de borrado a pedido.
- **Suggested verification:** Requisito y criterio de aceptación agregados al PRD/spec.
- **Required change type:** PRODUCT / REQUIREMENT CHANGE

### SP-09 — Sin cabeceras de seguridad (CSP, frame-ancestors, Referrer-Policy)

- **Severity:** LOW
- **Confidence:** HIGH
- **Category:** Misconfiguration / Defense in depth
- **Affected artifact:** Configuración
- **Location:** `next.config.js` (vacío), `src/proxy.js`
- **Description:** No se definen `Content-Security-Policy`, `frame-ancestors`/`X-Frame-Options`,
  `Referrer-Policy` ni `Permissions-Policy`. Hoy no hay ningún vector de XSS conocido
  (React escapa todo y no hay HTML crudo), así que esto es solo defensa en profundidad para
  el panel que muestra contenido controlado por anónimos (`petNotes`, etc.).
- **Evidence:** `next.config.js` = `{}`. No hay `headers()`.
- **Attack scenario:** Si en el futuro se introduce un XSS (p. ej. renderizar `petNotes` como
  markdown o HTML), no habría CSP para contenerlo. `/admin` también podría embeberse en
  iframes de terceros.
- **Potential impact:** Bajo hoy. Amplifica regresiones futuras.
- **Existing mitigation:** Escapado de React y HSTS por defecto de Vercel.
- **Recommended remediation:** `headers()` en `next.config.js` con una CSP básica
  (`default-src 'self'`, fuentes de Google permitidas), `frame-ancestors 'none'`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- **Suggested verification:** `curl -I` de `/` y `/admin/login` muestra las cabeceras.
- **Required change type:** CODE FIX

## Priority

1. **SP-01** (HIGH): la parte de código sale casi gratis: validar `time ∈ slots` y
   `date ≤ horizonte`. Rate limiting y cancelación requieren decisión (ver Governance).
2. **SP-05**: subir `next` a 16.3.8. Es un patch de bajo riesgo.
3. **SP-02 y SP-03**: endurecer `parseReservationBody` con límites de tamaño y catálogo en
   el servidor. Es el mismo archivo y sirve como un único cambio.
4. **SP-06**: tests de admin y de API, antes de tocar auth o agregar endpoints admin.
5. **SP-07**: limitar los privilegios de los agentes sobre producción.
6. **SP-04**: throttling, logout y runbook de revocación (decisión).
7. **SP-08 y SP-09**: privacidad (decisión de producto) y cabeceras.

## Governance / Decision Required

Estas decisiones son del humano. Este pass no las resolvió:

- **Revisar la premisa "POC" de los Riesgos aceptados de `TECH-DESIGN.md`.** El README
  documenta un despliegue a producción con la migración aplicada en `production`. Si ya hay
  clientes reales, los riesgos aceptados de las líneas 244–247 (SP-01 y SP-04) deberían
  reevaluarse, porque el argumento de "desproporcionado para una POC" deja de aplicar.
  → **SP-01, SP-04: DESIGN / ADR CHANGE.** Decidir si se agregan rate limiting (y con qué
  mecanismo, por ejemplo WAF de Vercel o un contador en la DB), cancelación desde `/admin`,
  throttling del login y logout, o si se re-acepta el riesgo de forma explícita sabiendo
  que el sistema está en producción.
- **SP-08: PRODUCT / REQUIREMENT CHANGE.** Aviso de privacidad, plazo de retención y borrado
  de PII. Requiere una decisión del dueño, y posiblemente asesoría legal sobre la Ley 29733.
  Hoy está fuera del PRD y no se debe implementar sin ampliar el alcance (CLAUDE.md §2).
- **SP-01 (cancelación de reservas):** agregar cancelación o borrado desde el admin no está
  en "Alcance" del PRD. Requiere aprobación de alcance antes de implementarse.
- **SP-07: PROCESS / HARNESS CHANGE.** Decidir el nivel de acceso de los agentes de IA a
  producción (Neon y Vercel). Esto incluye si se mantiene el allow de `vercel env add:*` que
  hoy está sin commitear en `.claude/settings.json`.
