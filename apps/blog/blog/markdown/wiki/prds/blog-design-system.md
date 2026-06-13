---
title: "Blog Redesign: Agent-Native Design System"
summary: "A modern, demonstrable design system for kyle.pericak.com — token-driven theming, a real component library, Tailwind + Storybook, built and maintained mostly autonomously by the agent team."
status: draft
owner: kyle
date: 2026-06-13
hidden: false
related:
  - wiki/design-docs/blog-design-system
  - wiki/research/design-system
  - https://linear.app/pericak/issue/PER-135/blog-redesign-agent-native-design-system
---

## Problem

kyle.pericak.com works but looks dated and is built on an incoherent
styling foundation. Verified from the repo (`apps/blog/blog/`):

- **Three styling systems coexist.** Material UI 5 + Emotion is the real
  one (a `createTheme` in `pages/_app.js` with bespoke typography
  variants and four hardcoded hex colors). On top of that, `tailwindcss@3.3`
  is installed but **inert** — `tailwind.config.ts` scans `./src/**`
  globs that don't exist, so it emits no utilities — and
  `styled-components@6` sits in `dependencies` as further dead weight.
- **No design tokens.** Colors are hardcoded hex (`#337ab7`, `#333333`,
  …) inside the MUI theme. There is no single source of truth; changing
  the brand color means hunting through `sx` props and `_app.js`.
- **No dark mode.** Single light theme only.
- **No component library or component documentation.** Six ad-hoc
  components (`SiteLayout`, `IndexPage`, `BlogPostContentPage`,
  `BlogSidebar`, `WikiPage`, `Pagination`) with styling inline via `sx`.
  Nothing renders a component in isolation; there is no catalogue.
- **Visual quality is "2014 Bootstrap."** The look does not represent
  the technical sophistication of the content or the agent tooling
  behind it.

The blog is the public face of a heavily AI-native engineering practice.
Right now the *content* demonstrates that sophistication and the *design*
undercuts it. Kyle wants the design to become a showpiece in its own
right — something he can put in front of other full-stack experts as a
proof of how a small team (one human + an agent fleet) builds a
first-class, modern frontend.

## Goal

Give the blog a clearly-defined, modern, demonstrable design system —
token-driven, documented in a real component library, built on
mainstream building blocks chosen to last 3–5+ years — and ship a
visibly nicer redesign on top of it, executed mostly autonomously by
the agent team.

## Success Metrics

1. **Single source of visual truth:** 100% of the redesigned UI's
   colors, spacing, type, radius, and shadows resolve to named design
   tokens. A grep guard finds zero raw hex / raw px (except `0`/`1px`)
   in component code. MUI, Emotion, dead Tailwind v3, and
   styled-components are fully removed from `dependencies`.
2. **Demonstrable component library:** Every shipped component has a
   Storybook story showing its canonical states; the static Storybook
   builds clean and is the artifact Kyle shows other engineers.
3. **Autonomy:** ≥80% of the implementation tasks (by task count in the
   design doc) are completed by the agent pipeline / Claude Code
   sessions with Kyle reviewing PRs rather than writing code.
4. **Quality bar held:** Lighthouse/axe accessibility ≥ the current
   site on every redesigned page (target: zero serious/critical axe
   violations), and the production static export still builds and
   deploys unchanged.

## Non-Goals

- **Not a framework migration.** Stay on Next.js 15 Pages Router with
  `output: 'export'`. No App Router, no SSR, no re-platform.
- **Not a content migration.** The markdown posts, the remark→HTML
  pipeline, Prism syntax highlighting, and the `.html` internal-link
  convention stay as-is. The design system styles the *rendered* output;
  it does not change how posts are authored.
- **Not a full TypeScript migration of the blog.** New design-system
  code is authored in TypeScript (the tooling is already present), but
  legacy `pages/*.js` are not force-converted beyond what a component
  swap requires.
- **Not a rebrand of identity** (logo, name, voice). This is a visual
  system refresh, not a brand exercise — though a refreshed, tokenized
  color palette and type scale are in scope.
- **Not a public component registry / npm package** in v1. The library
  is internal to `apps/blog`. (Publishing a `shadcn`-compatible registry
  is a noted future option, not a v1 deliverable.)

## User Stories

### Story: Kyle demos the design system to other full-stack experts

As the blog's owner, I want a browsable component library with a
documented token system, so that I can show another senior engineer
"here's the design system" and have it stand up to scrutiny.

**Acceptance criteria:**
- [ ] A Storybook instance renders every component in its canonical
  states (default, variants, dark mode), buildable with one command and
  as a static site.
- [ ] Tokens (color, space, type, radius, shadow) are visible and
  documented — a "foundations" section in Storybook plus the token
  source files.
- [ ] The stack is composed of named, mainstream tools a reviewer would
  recognize as current best practice (Tailwind, Storybook, an
  accessible primitive layer, a token pipeline).

### Story: Kyle gets a visibly modern, nicer-looking blog

As a reader-facing outcome, I want the blog to look modern and polished,
so that the design matches the sophistication of the content.

**Acceptance criteria:**
- [ ] Home, post, wiki, and about pages are visually refreshed against
  the new token system (improved type scale, spacing rhythm, color, and
  component polish).
- [ ] Dark mode is supported and toggles without a flash or layout shift.
- [ ] Redesigned pages are responsive and verified at mobile / tablet /
  desktop breakpoints via the Playwright MCP screenshot loop.

### Story: The agent team builds and maintains it with Kyle mostly out of the loop

As the operator of an agent fleet, I want the redesign executed and
maintained primarily by agents, so that I review and steer rather than
hand-code.

**Acceptance criteria:**
- [ ] The work is decomposed into dependency-ordered tasks (in the
  design doc) that the autolearn pipeline / Claude Code can pick up and
  execute one at a time.
- [ ] A machine-checkable verification gate (`bin/verify-design-system.sh`
  or equivalent: build + lint + Storybook build + Playwright/axe) lets
  an agent self-verify a change before opening a PR.
- [ ] A short `apps/blog/design-system/AGENTS.md` (mirrored through
  `.ruler/`) tells any agent how to add, change, or remove a component
  so future maintenance is "ask an agent," not "relearn the system."

### Story: A future component change is straightforward through AI

As the maintainer, I want adding or changing a component to be a simple,
well-paved request to an agent, so that maintenance stays cheap.

**Acceptance criteria:**
- [ ] Component source lives as readable, checked-in files (not opaque
  `node_modules`), so an agent can open and edit them directly.
- [ ] There is a documented, repeatable path ("add a component", "change
  a token") an agent can follow end to end, ending in a green
  verification gate.

## Scope

**In scope (v1):**
- A token layer (color, spacing, typography, radius, shadow, breakpoints)
  as the single source of truth, surfaced as CSS variables.
- Tailwind (upgraded and correctly wired) as the styling layer consuming
  those tokens.
- An accessible component library covering the blog's real surface:
  layout primitives, site header/footer/nav, post card + post layout,
  code block, callout, tag/category, pagination, breadcrumbs, table of
  contents, and markdown element styling (the `<Prose>` wrapper).
- Storybook as the component workshop, documentation surface, and visual
  + a11y test host.
- Dark mode via token swap.
- Full removal of MUI, Emotion, dead Tailwind v3 config, and
  styled-components by the end.
- Agent-facing docs + a verification gate that make the system
  autonomously buildable and maintainable.

**Deferred:**
- Publishing a public/shared component registry or npm package.
- Figma / Tokens Studio design-tool integration (only if Kyle starts
  designing in Figma).
- Hosted visual-review SaaS (Chromatic) — adopt only if local visual
  regression proves too noisy at scale.
- Any redesign of non-blog apps in the monorepo.

## Open Questions

These do not block starting; flagged for Kyle to pick at on review. The
design doc proposes a default for each.

- **Component model — shadcn/ui vs. a maintained library.** The seed
  research recommends the shadcn/ui copy-paste model (you own the
  `.tsx`), which is AI-friendly but means Kyle owns upstream
  maintenance — a caveat he disliked. Design doc default: **use shadcn/ui
  as the *starting point* for owned primitives but keep the surface
  small and Storybook-documented**, which is what makes "maintain via
  AI" tractable. Alternative to weigh: a versioned library (e.g. MUI
  Joy / Park UI / Radix Themes) that upgrades via `npm`. *Decision
  needed from Kyle.*
- **Token format — DTCG JSON vs. Tailwind `@theme` as source of truth.**
  Kyle flagged the DTCG spec as "young." Design doc default: **Tailwind
  v4 `@theme` (or a plain tokens module) is the load-bearing source of
  truth; DTCG export is optional and non-blocking**, which removes the
  young-spec risk while keeping a real token layer. *Confirm acceptable.*
- **TypeScript depth.** Author new DS components in `.tsx` (tooling
  present) while leaving legacy pages `.js`? Design doc default: **yes.**
  *Confirm.*
- **How "redesigned" visually?** Is there a reference aesthetic Kyle
  wants (e.g. Vercel/Geist, Linear, Stripe-like), or should the agents
  propose 2–3 directions for him to pick? Design doc default: **agents
  produce 2–3 visual directions as Storybook mockups for Kyle to choose
  before mass component work.**
- **Tailwind v4 vs. fixing v3.** v3 is already a (broken) dep. Design
  doc default: **upgrade to Tailwind v4** for the `@theme` token model
  and longevity. *Confirm the upgrade is wanted vs. repairing v3.*

## Risks

- **Three-way styling coexistence inflates the bundle mid-migration.**
  MUI + Tailwind running together temporarily is expected; the metric
  (remove MUI/Emotion/styled-components) only lands at the end.
  Mitigation: page-by-page migration with the old system removed last.
- **Visual regression is noisy** (anti-aliasing, fonts, emoji across
  machines). Mitigation: run snapshots in the existing Docker/Cloud
  Build environment, set diff thresholds, and lean on Storybook's
  isolated rendering rather than full-page diffs.
- **`output: 'export'` constraints.** No SSR theming; dark mode must be
  a no-flash inline script + CSS-variable swap, not a server decision.
  Mitigation: standard `class`/`data-theme` on `<html>` with a tiny
  blocking script.
- **Autonomy depends on a trustworthy gate.** If the verification gate
  is weak, autonomous PRs ship visual regressions. Mitigation: the gate
  (build + lint + Storybook build + Playwright/axe) is itself a v1
  deliverable, landed before mass migration.
- **Scope creep into a full TS / App Router rewrite.** Explicitly a
  non-goal; the design doc must keep tasks additive.
