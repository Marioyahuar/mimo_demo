# Tasks

## 1. Dependency and build tooling setup

- [x] 1.1 Add `next` as a dependency in `package.json`; remove `vite` and
      `@vitejs/plugin-react`. Verify: `npm install` succeeds and `next` appears in
      `node_modules/.bin`.
- [x] 1.2 Add a minimal `next.config.js` at the project root. Verify: the file exists and
      `next build` (once routes exist, per group 2) picks it up without a config error.
- [x] 1.3 Update `package.json` scripts to `dev: "next dev"`, `build: "next build"`,
      `start: "next start"`, removing the Vite `preview` script. Verify: `npm run dev` boots
      the Next.js dev server (no Vite in the output).

## 2. App Router shell

- [x] 2.1 Create `src/app/layout.jsx` as the root layout: page `<title>`, the Google Fonts
      `<link>` tags for Playfair Display / Plus Jakarta Sans / Material Symbols ported as-is
      from `index.html`, and an import of `src/index.css`. Verify: `next dev` serves a page
      where those fonts load (checked in the browser network tab) with no missing-stylesheet
      console error.
- [x] 2.2 Create `src/app/page.jsx` rendering the existing landing composition (`Header`,
      `Hero`, `SensoryStrip`, `Services`, `AddOns`, `WhyUs`, `Testimonials`, `CtaBanner`,
      `Faq`, `Footer`, in that order, with the same wrapper markup `App.jsx` uses today).
      Verify: visiting `/` under `next dev` renders the same page as the pre-migration app
      (spec `app-shell`: "Visiting the root URL").
- [x] 2.3 Add a `"use client"` directive to the top of
      `src/components/booking/ReservarCita.jsx` (it uses `useState`/`useEffect` and needs to
      opt out of Server Components). Verify: no "hooks only work in Client Components" build
      or runtime error once the route in 2.4 renders it.
- [x] 2.4 Create `src/app/reservar/page.jsx` rendering `ReservarCita`. Verify: navigating
      directly to `/reservar` (not via `/` first) under `next dev` renders the booking
      wizard's first step (spec `app-shell`: "Visiting /reservar directly").
- [x] 2.5 Create `src/app/admin/page.jsx` as an intentionally empty placeholder (a single
      element, no data fetching, no logic). Verify: visiting `/admin` under `next dev`
      returns the page with only placeholder content — no reservation data, login form, or
      protection logic (spec `app-shell`: "Visiting /admin before admin functionality is
      implemented").

## 3. Remove legacy Vite entry points

- [x] 3.1 Delete `index.html`, `src/main.jsx`, `src/App.jsx`, and `vite.config.js`. Verify:
      `git status` shows the four files removed, and `next dev` / `next build` run without
      referencing them.
- [x] 3.2 Grep the repo for lingering references to the deleted files (`main.jsx`,
      `App.jsx`, `vite.config`) outside of `openspec/`, `adrs/`, and git history. Verify: no
      matches found in source or config files.

## 4. Tailwind/PostCSS alignment

- [x] 4.1 Update `tailwind.config.js`'s `content` array to drop `./index.html` (keep
      `./src/**/*.{js,jsx}`, which already covers `src/app/**`). Verify: run `next build`
      and confirm the generated CSS includes a token class used only inside `src/app/**`
      (e.g. grep the build output CSS for `bg-background`).
- [x] 4.2 Confirm `postcss.config.js`'s existing `tailwindcss`/`autoprefixer` plugin pair
      works unchanged under Next.js's build pipeline, adjusting only if `next build` reports
      a PostCSS config error. Verify: `next build` completes with no PostCSS-related error.

## 5. Migration verification

- [x] 5.1 Run `next build` end-to-end and confirm all three routes (`/`, `/reservar`,
      `/admin`) appear in the build's route output. Verify: build output/route listing shows
      all three paths.
- [x] 5.2 Manually compare the rendered `/` and `/reservar` pages (DOM structure, styling
      classes, visible copy) against the pre-migration Vite app for parity, and confirm
      `/#reservar` no longer opens the booking flow. Verify: matches spec `app-shell`'s
      "Visual parity across the migration" and "Legacy hash URL no longer opens the booking
      flow" scenarios.
