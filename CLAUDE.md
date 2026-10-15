# CLAUDE.md — Mimo Pet Spa

## 1. Contexto del proyecto

**Qué es.** Landing page + flujo de reserva de citas para "Mimo Pet Spa", un spa de
mascotas. Es una app React (Vite + Tailwind) que hoy es 100% frontend: la home
(`src/App.jsx` + secciones en `src/components/`) presenta el spa y sus servicios, y
`src/components/booking/ReservarCita.jsx` implementa el flujo de reserva (servicio →
mascota → extras → fecha/hora → contacto → confirmación).

**Qué problema resuelve.** Hoy las reservas se coordinan por WhatsApp, chat por chat. Eso le
hace perder tiempo al dueño del spa, genera olvidos, no da visibilidad de un calendario
único y produce cruces de horario (doble booking) que afectan a clientes reales. El
objetivo del producto es que el cliente pueda reservar sin escribir por WhatsApp, y que el
dueño vea todas las reservas en un solo lugar sin cruces.

**Arquitectura general.**
- Frontend: React 18 + Vite + Tailwind CSS 3. Los tokens de diseño (colores, spacing,
  tipografía, radios) viven en `tailwind.config.js` como fuente única de verdad; las
  secciones de la home leen su copy desde `src/data/content.js`.
- Estado actual de persistencia: el flujo de reserva (`ReservarCita.jsx`) confirma la cita
  solo en memoria del navegador — se pierde al refrescar y no es compartida entre
  dispositivos ni sesiones.
- Dirección de producto (ver `PRD.md`): esta versión requiere agregar persistencia real
  compartida (backend + base de datos, tecnología sin decidir aún a propósito), validación
  de horarios ocupados, una vista `/admin` protegida por clave única para listar reservas, y
  un botón de reenvío por WhatsApp (`wa.me`) como respaldo del canal actual.

**Contexto de negocio.** Hay dos perfiles de usuario: el cliente que reserva desde su
celular sin necesidad de cuenta/login, y el dueño del spa, que es también quien hoy
administra todo por WhatsApp y necesita ver sus reservas próximas en un único lugar. No hay
staff adicional ni sistema de roles en esta versión.

## 2. Reglas duras

- **Leer `PRD.md` completo antes de planificar o generar código** en este proyecto. El PRD
  define alcance, no-alcance, casos borde y criterios de éxito vigentes; no asumas contexto
  de negocio o de producto sin haberlo leído primero.
- **Si una solicitud cae fuera del alcance definido en `PRD.md` (sección "No alcance" o
  fuera de "Alcance"), detente y consúltalo con el usuario antes de implementar nada.** No
  interpretes la solicitud de forma extensiva ni la implementes "total ya que estamos".
  Ejemplos de fuera de alcance hoy: sistema de cuentas/roles múltiples, recuperación de
  contraseña, notificaciones automáticas por email/SMS, pagos o señas online, gestión de
  múltiples groomers/staff, recordatorios automáticos.
- Las secciones marcadas `<!-- REVISAR: ... -->` en el PRD son decisiones técnicas
  explícitamente abiertas (p. ej. elección de backend/DB, mecanismo exacto de protección del
  admin). Ahí sí hay libertad de diseño técnico, siempre que se cumpla el requisito
  funcional que las rodea.

## 3. Comandos del entorno

```bash
npm install       # instalar dependencias
npm run dev       # levantar servidor de desarrollo (Vite)
npm run build     # build de producción a dist/
npm run preview   # previsualizar el build de producción
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
