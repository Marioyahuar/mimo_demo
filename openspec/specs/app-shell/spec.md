# app-shell Specification

## Purpose

Defines the application's routing shell — which URLs exist, what each one renders, and
what is guaranteed to stay visually/behaviorally unchanged when the underlying build
tooling changes from a Vite SPA to a Next.js App Router project.

## Requirements

### Requirement: Home route serves the existing landing content
The system SHALL serve the existing landing page (the `Header`, `Hero`, `SensoryStrip`,
`Services`, `AddOns`, `WhyUs`, `Testimonials`, `CtaBanner`, `Faq`, and `Footer` sections, in
that order) at the root route `/`.

#### Scenario: Visiting the root URL
- **WHEN** a user navigates to `/`
- **THEN** the page renders the full landing page (header through footer) with the same
  content and visual styling as before the migration

### Requirement: Booking flow is served at a dedicated, directly-linkable route
The system SHALL serve the existing booking flow (currently `ReservarCita`) at `/reservar`
as a real route, reachable directly (typed URL, bookmark, page reload) rather than only via
a URL hash fragment read by client-side JavaScript after the landing page loads.

#### Scenario: Visiting /reservar directly
- **WHEN** a user navigates directly to `/reservar` (types the URL, follows a bookmark, or
  reloads the page while on it)
- **THEN** the booking flow renders starting at its first step, without first rendering the
  landing page

#### Scenario: Legacy hash URL no longer opens the booking flow
- **WHEN** a user navigates to `/#reservar` (the pre-migration URL for the booking flow)
- **THEN** the system does not automatically show the booking flow — hash-based routing is
  removed and no redirect to `/reservar` is provided; this is an intentional, accepted
  breaking change scoped to this migration

### Requirement: Existing UI and design tokens are preserved through the migration
The system SHALL preserve the pre-migration visual output and content: the same components
under `src/components/*` (including `src/components/booking/ReservarCita.jsx` and
`src/components/ui/*`), the same copy from `src/data/content.js`, and the same Tailwind
design tokens (colors, spacing, typography, radii defined in `tailwind.config.js`).

#### Scenario: Visual parity across the migration
- **WHEN** comparing the rendered `/` and `/reservar` pages before and after the migration
- **THEN** the component tree, applied styling classes, and visible text content are
  unchanged — only the routing and build mechanism differ, not the rendered UI
