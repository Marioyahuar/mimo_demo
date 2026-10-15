# Design

## Context

Today the app is a Vite SPA: `index.html` loads `src/main.jsx`, which mounts `src/App.jsx`.
`App.jsx` does its own hand-rolled routing — a `useHashRoute()` hook watches
`window.location.hash` and swaps between the landing sections and `ReservarCita` when the
hash is `#reservar`. There is no `/admin` route at all yet. Styling comes from Tailwind CSS
3, configured in `tailwind.config.js` (`content: ['./index.html', './src/**/*.{js,jsx}']`)
and `postcss.config.js`.

[ADR-0003](../../../adrs/0003-framework-nextjs-app-router.md) already decided *that* the
project moves to Next.js App Router (to host API routes for later backlog items) — that
decision is out of scope to revisit here. This design covers only how to execute the shell
migration itself: project layout, route structure, and what has to change vs. what must stay
identical, per `proposal.md` and `specs/app-shell/spec.md`.

## Goals / Non-Goals

**Goals:**
- Stand up a working Next.js App Router project that serves `/`, `/reservar`, and an empty
  `/admin`, with the existing UI rendering identically to today.
- Keep the diff to routing/build plumbing: `src/components/*`, `src/data/content.js`, and
  Tailwind's design tokens move unchanged.
- Leave the project buildable and runnable with the standard Next.js scripts (`next dev`,
  `next build`, `next start`), replacing the current Vite scripts.

**Non-Goals:**
- No API routes, database access, or environment variables (`DATABASE_URL`,
  `ADMIN_PASSWORD`, etc.) — those belong to backlog items #2–#6.
- No redirect or compatibility shim for the old `/#reservar` URL (see
  `specs/app-shell/spec.md`, "Legacy hash URL no longer opens the booking flow").
- No React version upgrade beyond what's needed to run Next.js — this migration changes the
  build/routing layer, not the UI framework version.
- No changes to `src/components/*` internals, `src/data/content.js` copy, or
  `tailwind.config.js` token values.

## Decisions

**Directory layout: `src/app/` (not a root-level `app/`).**
Next.js App Router supports routing from either `app/` at the repo root or `src/app/`. Using
`src/app/` keeps every existing import path under `src/components/*` and `src/data/*`
untouched — only the entry point moves, not the code it imports. Routes:
- `src/app/layout.jsx` — root layout; carries what `index.html`'s `<head>` has today (page
  title, Google Fonts `<link>` tags for Playfair Display / Plus Jakarta Sans / Material
  Symbols, viewport meta — Next.js handles charset/viewport automatically via its metadata
  API) and imports `src/index.css` (Tailwind entry) once, globally.
- `src/app/page.jsx` — renders the existing landing composition (`Header` through `Footer`)
  that `App.jsx` renders today for the non-`#reservar` case.
- `src/app/reservar/page.jsx` — renders `ReservarCita`.
- `src/app/admin/page.jsx` — new, intentionally empty per `specs/app-shell/spec.md`
  ("Admin route exists as an empty placeholder"); a minimal placeholder element only, no
  logic.

`src/App.jsx` and `src/main.jsx` are removed: their two responsibilities (mounting the React
tree, choosing landing-vs-booking) are now handled by Next.js's root layout and file-based
routing respectively, so nothing replaces them 1:1.

**Client/Server component boundary: mark only `ReservarCita` as a Client Component.**
App Router components are Server Components by default. A grep of `src/components/**/*.jsx`
for hooks/handlers shows only `ReservarCita.jsx` (`useState`/`useEffect`-driven wizard state)
needs interactivity; `Button.jsx` merely forwards an `onClick` prop it receives and needs no
directive of its own — it becomes part of the client bundle automatically wherever it's
rendered under a Client Component (i.e., inside `ReservarCita`), while still working as a
plain server-rendered element on the static landing page. So: add `"use client"` to the top
of `src/components/booking/ReservarCita.jsx` only. This keeps the landing page's component
tree server-rendered (smaller client JS, no directive sprawl) while the booking wizard keeps
working exactly as before.

**Build tooling swap.**
- Remove: `vite`, `@vitejs/plugin-react`, `vite.config.js`, `index.html`.
- Add: `next` (and its transitive peer deps) as a dependency.
- `package.json` scripts become the Next.js equivalents:
  `dev: "next dev"`, `build: "next build"`, `start: "next start"` (`next start` replaces
  `vite preview` as the production-mode local runner; Next.js has no separate "preview"
  script).
- Keep `react` / `react-dom` pinned at their current `18.3.x` range — Next.js's stable
  releases support React 18, and this change is scoped to routing/build tooling, not a React
  major-version bump (see Non-Goals).

**Tailwind/PostCSS config stays on the same major version, only the glob changes.**
`tailwind.config.js`'s `content` array drops `./index.html` (deleted) and points at
`./src/**/*.{js,jsx}`, which already covers `src/app/**` since it's a glob under `src/`. No
token values change. `postcss.config.js` keeps the same `tailwindcss`/`autoprefixer` plugin
pair Next.js's built-in PostCSS support expects — no changes anticipated, but this gets
verified against `next build` output during implementation (see Risks).

**Fonts/head tags move to the root layout as plain `<link>` tags, not `next/font`.**
`next/font` would change *how* fonts are loaded (self-hosted, no external request) — a
behavior change beyond "preserve the shell as-is". Keeping the same Google Fonts `<link>`
tags in `layout.jsx` that `index.html` has today satisfies "existing UI is preserved
unchanged" exactly, and adopting `next/font` can be a deliberate follow-up if desired later.

## Risks / Trade-offs

- **Tailwind/PostCSS config format may need adjustment for Next.js's build pipeline** →
  Mitigation: this is a known, well-documented integration path (Next.js has supported
  Tailwind 3 via standard `postcss.config.js` for years); verify with a real `next build`
  during implementation before considering the migration done, not just `next dev`.
- **Removing hash-based routing breaks any existing external links to `/#reservar`** →
  Accepted, per `proposal.md` — this is a deliberate, scoped breaking change; no mitigation
  is in scope here (a redirect could be added later if it turns out to matter).
- **Static asset paths (if any beyond fonts/CSS) may resolve differently under Next.js's
  `public/` convention vs. Vite's root-relative serving** → Mitigation: the current project
  has no `public/` directory or image assets referenced by path (confirmed by inspection);
  if any appear during implementation, move them into `public/` and update references.
- **`/admin` as a bare empty route could be mistaken for "admin is done"** → Mitigation: the
  spec explicitly calls out that it renders only placeholder content with no logic, and
  `proposal.md` states real `/admin` content is backlog item #6, not part of this change.

## Migration Plan

1. Add Next.js as a dependency; remove `vite` and `@vitejs/plugin-react`.
2. Create `src/app/layout.jsx` carrying the `<head>` content from `index.html` (title, font
   links) and importing `src/index.css`.
3. Create `src/app/page.jsx` (landing composition), `src/app/reservar/page.jsx` (renders
   `ReservarCita`), and `src/app/admin/page.jsx` (empty placeholder).
4. Add `"use client"` to `src/components/booking/ReservarCita.jsx`.
5. Delete `index.html`, `src/main.jsx`, `src/App.jsx`, `vite.config.js`.
6. Update `tailwind.config.js`'s `content` array to drop `./index.html`.
7. Update `package.json` scripts to `next dev` / `next build` / `next start`; add
   `next.config.js` (minimal/default config).
8. Run `next build` and `next dev` locally; visually compare `/`, `/reservar`, and `/admin`
   against the pre-migration app to confirm parity (per `specs/app-shell/spec.md`'s "Visual
   parity across the migration" scenario).

No database, environment variables, or deployed environments are touched by this change, so
there is no data migration and no rollback beyond reverting the commit/branch.
