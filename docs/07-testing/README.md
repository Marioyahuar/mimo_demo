# 07 — Testing

Los tests viven en el código, no en esta carpeta: E2E en [`tests/`](../../tests/) y unitarios
junto al módulo que prueban (`src/lib/*.test.js`).

## Qué se cubre y por qué

Cada test E2E prueba un criterio de éxito o un caso borde del
[PRD](../01-producto/PRD.md), no un detalle de implementación.

| Test | Archivo | Origen en el PRD / diseño |
|---|---|---|
| El cliente reserva una cita de punta a punta | `tests/reservar-cita.spec.js` | Criterio de éxito: completar el flujo sin WhatsApp |
| Cada paso exige sus datos antes de avanzar | `tests/reservar-cita-errores.spec.js` | Caso borde: no quedan reservas a medias |
| Si otro cliente toma el horario, se avisa y se vuelve a elegir | `tests/reservar-cita-errores.spec.js` | Caso borde: dos clientes, mismo slot (ADR-0007) |
| Tras un error 500, el reintento confirma con la misma clave | `tests/reservar-cita-errores.spec.js` | ADR-0011 (idempotencia) |
| Un doble clic en confirmar envía una sola reserva | `tests/reservar-cita-errores.spec.js` | ADR-0011 |
| El precio guardado sale del catálogo, no del cliente | `tests/reservas-api-catalogo.spec.js` | SECURITY-REPORT SP-03 |
| Rechaza campos fuera del catálogo o con formato inválido | `tests/reservas-api-catalogo.spec.js` | SECURITY-REPORT SP-03 |
| Zona horaria y conversión de slots | `src/lib/time.test.js` (unitario) | ADR-0010 |

## Cómo correrlos

```bash
npm run test:unit    # node:test, sin base de datos
npm run test:e2e     # Playwright; levanta `npm run dev` solo
```

Los E2E **escriben reservas reales**. Por eso `playwright.config.js` exige un `.env.e2e` con la
`DATABASE_URL` de una rama de desarrollo de Neon, y falla si no existe: nunca corren contra
producción. En CI la rama llega por los secrets del environment `e2e` de GitHub, y el deploy a
producción solo se dispara si los E2E pasan (ver [`09-deploy`](../09-deploy/DEPLOY-PLAN.md)).

Si un test falla, `playwright-report/` tiene el trace y el screenshot (`npx playwright show-report`).
