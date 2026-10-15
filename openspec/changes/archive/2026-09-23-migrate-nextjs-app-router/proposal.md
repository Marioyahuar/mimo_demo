# Proposal

## Why

The product direction in `PRD.md` requires adding a real backend (persistence, availability
validation, protected admin view) behind the existing frontend. [ADR-0003](../../../adrs/0003-framework-nextjs-app-router.md)
resolved *how* that backend is served: migrating the frontend from a Vite SPA to Next.js
(App Router), so API routes can live in the same project/deploy. This change delivers only
that migration — the app "shell" and its routing — with no business logic, persistence, or
API routes yet, so later backlog items (#2–#6) can build on a stable Next.js foundation
instead of bundling the framework migration with functional changes.

## What Changes

- Replace the Vite + `index.html` + `main.jsx` entry point with a Next.js App Router project
  (`app/layout.jsx`, `app/page.jsx`, etc.).
- Introduce real, file-based routes for the three destinations the product needs:
  - `/` — existing home/landing content (`Header`, `Hero`, `SensoryStrip`, `Services`,
    `AddOns`, `WhyUs`, `Testimonials`, `CtaBanner`, `Faq`, `Footer`), unchanged.
  - `/reservar` — existing booking flow (`ReservarCita.jsx`), unchanged.
  - `/admin` — new empty placeholder route (no content/logic yet; reserved for backlog
    item #6).
- Remove the current hash-based client-side routing (`useHashRoute` / `#reservar` in
  `src/App.jsx`) now that real routes exist. **BREAKING**: the booking flow's URL changes
  from `/#reservar` to `/reservar`. No redirect is introduced for the old hash URL — out of
  scope for this shell-only migration (see `PRD.md` "No alcance" and ADR-0003, which only
  mandates the routing shell, not URL back-compat).
- Move the `<head>` content currently in `index.html` (title, fonts, meta viewport) into the
  Next.js root layout.
- Preserve `src/components/*` (including `src/components/booking/ReservarCita.jsx` and
  `src/components/ui/*`), `src/data/content.js`, and `tailwind.config.js` design tokens
  exactly as they are today — only their import paths and the build tooling around them
  change, not their content or behavior.
- Update `package.json` scripts (`dev`, `build`, `start`/`preview`) and dependencies to
  Next.js; remove Vite-specific dependencies and config (`vite.config.js`,
  `@vitejs/plugin-react`).
- Update Tailwind's `content` globs to scan the new `app/` directory instead of
  `index.html`.

Explicitly not part of this change (scoped to later backlog items per `BACKLOG.md`): any
API routes, database access, admin authentication/content, availability validation, or
WhatsApp resend button. `/admin` is created here only as an empty route so the shell
migration produces the three routes the product needs; its real content is backlog item #6.

## Capabilities

### New Capabilities
- `app-shell`: The Next.js App Router routing shell — which routes exist (`/`, `/reservar`,
  `/admin`), what each renders (or, for `/admin`, that it is intentionally empty), and that
  existing UI/content is preserved unchanged through the migration.

### Modified Capabilities
None — there is no pre-existing OpenSpec capability for the current Vite routing (the
project has no specs yet); this is the first capability defined for the app's structure.

## Impact

- **Removed**: `index.html`, `src/main.jsx`, `vite.config.js`, Vite/`@vitejs/plugin-react`
  dependencies.
- **Added**: Next.js dependency, `next.config.js`, `app/layout.jsx`, `app/page.jsx`,
  `app/reservar/page.jsx`, `app/admin/page.jsx`.
- **Changed**: `package.json` (scripts + dependencies), `tailwind.config.js` (`content`
  globs), `postcss.config.js` (if Next.js's expected format differs), `src/App.jsx` (removed
  or repurposed now that routing is file-based).
- **Unchanged**: `src/components/**`, `src/data/content.js`, Tailwind design tokens (colors,
  spacing, typography, radii in `tailwind.config.js`'s `theme.extend`), all existing visual
  behavior of the home page and booking flow.
- **No backend/API impact**: this change introduces no server-side logic; Next.js is adopted
  here purely for its App Router/file-based routing, ahead of API routes landing in later
  backlog items.
