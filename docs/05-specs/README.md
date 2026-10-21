# 05 — Spec + Tasks (Spec-Driven Development con OpenSpec)

Las specs **no viven en esta carpeta**: el CLI de OpenSpec exige que estén en
[`openspec/`](../../openspec/), en la raíz del repo. Esta página es el puente entre el backlog y
esas specs.

## Cómo se trabaja

Cada ítem de [`BACKLOG.md`](../04-backlog/BACKLOG.md) se convierte en **un** change de OpenSpec:

1. `/opsx:propose` → `proposal.md`, `design.md`, `specs/` (delta) y `tasks.md`.
2. `/opsx:apply` → implementa las tareas y las marca en `tasks.md`.
3. Verificación (build, tests) y code review (`.claude/agents/code-reviewer.md`).
4. `/opsx:archive` → mueve el change a `openspec/changes/archive/` y sincroniza la spec vigente
   en `openspec/specs/`.

El agente `.claude/agents/spec-owner.md` lleva un ítem por este ciclo completo.

## Backlog → change → spec vigente

| Ítem | Change archivado | Spec vigente |
|---|---|---|
| #1 Migración a Next.js | [`2026-09-23-migrate-nextjs-app-router`](../../openspec/changes/archive/2026-09-23-migrate-nextjs-app-router/) | [`app-shell`](../../openspec/specs/app-shell/spec.md) |
| #2 Modelo de datos | [`2026-09-30-modelo-datos-neon-prisma`](../../openspec/changes/archive/2026-09-30-modelo-datos-neon-prisma/) | [`reservations-data`](../../openspec/specs/reservations-data/spec.md) |
| #3 Módulo de tiempo | [`2026-09-30-modulo-tiempo-negocio`](../../openspec/changes/archive/2026-09-30-modulo-tiempo-negocio/) | [`business-time`](../../openspec/specs/business-time/spec.md) |
| #4 Endpoints de reserva | [`2026-10-04-endpoints-reserva-idempotente-disponibilidad`](../../openspec/changes/archive/2026-10-04-endpoints-reserva-idempotente-disponibilidad/) | [`reservation-api`](../../openspec/specs/reservation-api/spec.md) |
| #5 UI ↔ API + WhatsApp | [`2026-10-05-conectar-reserva-ui-api-whatsapp`](../../openspec/changes/archive/2026-10-05-conectar-reserva-ui-api-whatsapp/) | [`booking-flow`](../../openspec/specs/booking-flow/spec.md) |
| #6 Admin | [`2026-10-04-admin-login-listado`](../../openspec/changes/archive/2026-10-04-admin-login-listado/) | [`admin-access`](../../openspec/specs/admin-access/spec.md) |
