# ADR 0002: Despliegue — Vercel free tier

## Estado

Aceptado

## Contexto

El usuario fijó como restricción mandatoria del proyecto que todo el sistema (frontend +
backend) debe poder desplegarse en el plan gratuito de Vercel. Esta restricción condiciona
directamente la decisión de arquitectura de componentes ([[0003]]): implica evitar procesos
de larga duración (servidores persistentes), preferir funciones serverless de corta
duración, y respetar los límites del free tier (duración máxima de ejecución por función,
límite de invocaciones/mes, sin cron jobs pagos, sin servidores dedicados).

## Decisión

Desplegar el proyecto completo (frontend Next.js + API routes, ver [[0003]]) como un único
proyecto en Vercel, en el plan gratuito (Hobby).

## Alternativas consideradas

- **Netlify / Render / Railway** para frontend o backend — viables en abstracto, pero
  descartadas porque el usuario fijó Vercel explícitamente como restricción del proyecto.
- **VPS propio** (instancia con Node corriendo indefinidamente) — descartado por el mismo
  motivo, y además por requerir mantenimiento operativo que no aporta valor a un proyecto de
  esta escala (dueño de spa sin equipo técnico).

## Consecuencias

- Cero costo de hosting, despliegue continuo simple desde git, un solo lugar para gestionar
  frontend y backend.
- Trade-off: los límites del free tier (duración máxima de ejecución por función serverless,
  límite de invocaciones y ancho de banda mensual) condicionan el diseño — toda operación
  debe completarse dentro de esos límites, y no hay procesos en segundo plano de larga
  duración disponibles (relevante si en el futuro se quisiera agregar algo como
  recordatorios automáticos, hoy fuera de alcance).
