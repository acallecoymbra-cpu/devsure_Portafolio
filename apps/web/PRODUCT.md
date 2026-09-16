# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DevSure serves two roughly equal audiences on the same public site:

- **Business decision-makers evaluating a dev partner** — founders, CTOs, and PMs comparing DevSure against other agencies/freelancers for a project (custom web/backend/mobile/cloud/data work).
- **Recruiters/employers evaluating technical skills** — using the technology catalog and case studies more like a CV/portfolio when assessing DevSure's team for hiring or contract opportunities.

Design and copy decisions should read coherently to both without splitting into two separate sites.

## Product Purpose

DevSure is the corporate site and technology catalog for a real software development company/studio (real team, not a fictional placeholder). The MVP's purpose is to convert visits into commercial conversations (leads) and to demonstrate technical capability through services, technologies, projects, and case studies.

## Positioning

A software development studio whose catalog of technologies, services, and past-project results is administrable (backed by a real admin/CMS and database) rather than a static marketing page — content can be corrected/expanded from `/admin` without a redeploy. Visual language draws on dark, technical, developer-tool aesthetics (see `PLAN-DEVSure.md`) but explicitly must not copy any reference site's brand, exact composition, or course-platform business model.

## Operating Context

- Monorepo: `pnpm` workspaces + Turborepo. `apps/web` (this app) is Next.js App Router; it consumes a separate NestJS API (`apps/api`) rather than duplicating business logic in Server Actions.
- Public navigation planned in `PLAN-DEVSure.md`: `/`, `/servicios`, `/tecnologias`, `/proyectos` (case studies), `/proyectos/[slug]`, `/nosotros`, `/contacto`, `/privacidad`, `/terminos`, `/admin`.
- Currently implemented routes: `/` (home), `/tecnologias`, `/casos-de-exito` + `/casos-de-exito/[slug]`, `/cultura` (team culture page, added beyond the original plan), `/admin` (auth + protected areas).
- Admin area manages content (technologies, projects/case studies, team, testimonials, leads) so non-technical staff can publish without a deploy.
- Contact/lead capture, `/servicios`, `/proyectos` (as distinct from casos-de-exito), and `/nosotros` are planned but not yet confirmed as built — verify against current code before assuming they exist.

## Capabilities and Constraints

- No payments, subscriptions, LMS, video streaming, course progress tracking, real-time chat, in-house CRM, or microservices for the MVP — explicit non-goals per `PLAN-DEVSure.md`.
- Technology catalog must come from the database/admin, never hardcoded — content must stay correctable without a redeploy.
- Do not invent technologies or skills not backed by the real catalog/CV data.
- SQLite is the MVP persistence engine (`synchronize: false`, migrations required); code should avoid SQLite-only constructs that would block a future PostgreSQL migration.
- No public admin registration; first admin is created via a controlled seed/CLI.
- Accessibility target: WCAG AA, keyboard navigation, visible focus states, labeled forms, `prefers-reduced-motion` support, verified contrast.
- Responsive from 360px, with additional checkpoints at 768, 1024, and 1440px.
- Performance/SEO targets: Lighthouse Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95; per-page metadata, canonical URLs, Open Graph, sitemap, JSON-LD (`Organization`, `Service`, `Article/CreativeWork` where relevant).
- gsap and three.js are already dependencies — the site is expected to carry ambitious motion/3D work (e.g. a "cultura spine 3D" concept referenced in `PLAN-CULTURA-SPINE-3D.md`), not just static marketing pages.

## Brand Commitments

- Confirmed name: **DevSure**.
- Must not copy the brand, exact text, assets, or page composition of the reference sites used for inspiration during build (notably a DevTalles-style course platform referenced in `ADAPTACION-TESLO-A-DEVSURE.md`) — visual/structural inspiration only, never reproduction.

## Evidence on Hand

Some real content already exists in the repo and should be treated as ground truth, not replaced with invented substitutes without confirming with the user first:

- `apps/web/public/case-studies/akkikb.jpg` — a real case-study asset.
- `apps/web/public/culture/` — real culture-page imagery (`culture-heading.png`, `collaboration.png`, `growth.png`, `quality.png`, plus a `spine-frames-atlas.webp` used for an animated sequence).
- `apps/web/public/photos/` — a library of real photography (office, team portraits, certifications, etc.) used across the site.
- `apps/web/public/technologies/` — a substantial real logo/icon set for the technology catalog (languages, frameworks, QA/testing tools, DevOps tools).

Do not assume completeness: confirm with the user before treating any specific testimonial, team bio, or project write-up as final/publishable fact, since some catalog and case-study content may still be partial or in progress (see `docs/technology-catalog-audit.md` and `PLAN-TECNOLOGIAS-Y-CASOS-DE-EXITO.md` for current gaps).

## Product Principles

- Content over chrome: technologies, services, and case studies must be real, administrable, and correctable — never hardcoded or fabricated to fill a gap.
- Serve both audiences at once: every page should work as both a sales pitch (for prospective clients) and a credibility signal (for evaluators of technical skill), not force a choice between them.
- Earn technical trust through craft: because the audience includes people evaluating DevSure's own engineering ability, the site's own execution (performance, accessibility, motion quality) is itself part of the pitch.
- Small, reviewable, vertical slices: ship one feature (backend + frontend + admin) end-to-end before starting the next, per `PLAN-DEVSure.md`'s phased plan.
- Stay within MVP scope: resist adding payments, LMS, real-time chat, or microservices until an approved requirement exists.

## Accessibility & Inclusion

WCAG AA is a stated project requirement (not optional polish): keyboard navigation, visible focus states, labeled form fields, `prefers-reduced-motion` support, and verified color contrast across the dark visual theme.
