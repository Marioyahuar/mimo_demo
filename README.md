# Mimo Pet Spa — Landing + reservas

Next.js (App Router) + Tailwind CSS 3 + Prisma sobre Neon (Postgres). Landing, flujo de
reserva en `/reservar` y panel `/admin` protegido por clave única. Alcance en `PRD.md`,
arquitectura en `TECH-DESIGN.md` y `adrs/`, specs en `openspec/specs/`.

## Desarrollo

```bash
cp .env.example .env     # completar con una rama de desarrollo de Neon, nunca production
npm install              # corre prisma generate
npx prisma migrate deploy
npm run dev
npm run build            # prisma generate && next build
```

Los tokens de diseño viven en `tailwind.config.js`; el copy de la home en `src/data/content.js`.
Toda fecha/hora pasa por `src/lib/time.js` (`BUSINESS_TIMEZONE = 'America/Lima'`).

## Despliegue (Vercel, ADR-0002)

1. Importar el repo en Vercel (framework Next.js; build por defecto `npm run build`).
2. Variables de entorno (Production):
   - `DATABASE_URL`: connection string pooled de la rama `production` de Neon.
   - `DATABASE_URL_UNPOOLED`: conexión directa, solo la usa el CLI de Prisma.
   - `ADMIN_PASSWORD`: clave única del dueño.
   - `ADMIN_SESSION_SECRET`: distinta de la clave. `openssl rand -hex 32`.
   - `ADMIN_SESSION_TTL_HOURS`: opcional (default 168).
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`: solo dígitos con código de país. Se incrusta en build.
3. Las migraciones NO corren en el build (evita que un preview migre producción). Aplicarlas a mano
   antes de desplegar un cambio de schema, apuntando a la rama correcta:
   `DATABASE_URL_UNPOOLED=<url> npx prisma migrate deploy`.
   Estado actual: `20261001030713_init_reservations` ya aplicada en `production`.
4. Para previews, definir `DATABASE_URL` de una rama de desarrollo, no la de producción.
