---
title: "Blog Redesign: Agent-Native Design System — Design Doc"
summary: "Token-driven design system on the existing Next.js 15 Pages Router static export: Tailwind v4 @theme as the token source of truth, Radix + shadcn owned components in TSX, Storybook 10 as the workshop/docs/visual-test surface, dark mode by token swap, and an autonomous verification gate — replacing MUI/Emotion/styled-components/dead-Tailwind-v3."
status: draft
owner: kyle
date: 2026-06-13
prd: wiki/prds/blog-design-system
hidden: false
related:
  - wiki/prds/blog-design-system
  - wiki/research/design-system
---

## Context

Link to PRD: [Blog Redesign: Agent-Native Design System](../prds/blog-design-system.html)

The blog (`apps/blog/blog/`) is a Next.js 15.5.12 Pages Router app with
`output: 'export'` (fully static, deployed to GCS via Cloud Build). The
technically interesting and risky part of this work is **not** building a
design system from scratch — it is layering a coherent, token-driven,
agent-maintainable system onto a live static site that currently runs
**three overlapping styling stacks** (MUI 5 + Emotion as the real one;
`tailwindcss@3.3` installed but inert because its `content` globs point at
a non-existent `./src/**`; `styled-components@6` as dead weight) **without
a flag-day rewrite**, and doing the migration mostly through agents whose
only safety net is a machine-checkable verification gate.

Two hard constraints shape every decision below:

1. **`output: 'export'`** — no server runtime. Theming (dark mode) must
   be a client-side CSS-variable swap with a no-flash inline script, not a
   server decision. Next.js rewrites are dev-only (already true in
   `next.config.js` for the `.html` link convention).
2. **Static-content performance** — the payoff of leaving CSS-in-JS
   (MUI/Emotion runtime) for Tailwind's zero-runtime CSS variables is real
   on a content site; it is a goal, not incidental.

## Goals and Non-Goals

**Goals (technical, derived from the PRD):**
- One token source of truth → CSS variables consumed everywhere; zero raw
  hex / raw px (except `0`/`1px`) in component code.
- Tailwind (upgraded to v4, correctly wired) as the styling layer.
- An owned, readable, accessible component library covering the blog's
  real surface, authored in TypeScript (`.tsx`).
- Storybook 10 as the component workshop, documentation surface, and host
  for visual + a11y tests.
- Dark mode by token swap, no flash, no layout shift.
- A `bin/verify-design-system.sh` gate (build + lint + Storybook build +
  Playwright/axe) that lets agents self-verify before opening PRs.
- End state: MUI, Emotion, styled-components, and the dead Tailwind v3
  config fully removed.

**Non-Goals:**
- No App Router / SSR / re-platform; stay Pages Router + static export.
- No change to the markdown→remark→HTML authoring pipeline or Prism
  highlighting (only the *rendered* output is restyled, via `<Prose>`).
- No forced full-repo TS migration; legacy `pages/*.js` stay JS except
  where a component swap touches them.
- No public component registry / npm package in v1.
- React **18 → 19** upgrade *is* in scope (Kyle: bias to newest); it is
  the one framework-version bump. Still no App Router / SSR / re-platform.

## Proposed Design

A four-layer system plus an autonomy harness, all living under
`apps/blog/blog/` next to the existing app.

```mermaid
graph TD
    subgraph Source of truth
        T[design-system/tokens.css<br/>@theme: color/space/type/radius/shadow]
    end
    subgraph Styling
        TW[Tailwind v4<br/>utilities from @theme vars]
        GL[public/css/globals.css<br/>+ Prose base styles]
    end
    subgraph Primitives + Components
        RX[Radix UI primitives]
        UI[components/ui/*.tsx<br/>shadcn-seeded, owned]
        PR[primitives: Container/Stack/Grid/Prose]
        BLOG[blog components:<br/>SiteHeader/PostCard/PostLayout/<br/>CodeBlock/Callout/TagPill/TOC/Pagination]
    end
    subgraph Pages
        P[pages/*.js<br/>index, about, [...route]]
    end
    subgraph Docs + Verification
        SB[Storybook 10<br/>foundations + every component]
        VG[bin/verify-design-system.sh<br/>build + lint + SB build + Playwright/axe]
        AG[design-system/AGENTS.md<br/>mirrored via .ruler/]
    end

    T --> TW
    T --> GL
    RX --> UI
    UI --> BLOG
    PR --> BLOG
    TW --> UI
    TW --> PR
    BLOG --> P
    BLOG --> SB
    PR --> SB
    T --> SB
    SB --> VG
    P --> VG
    AG -.guides agents.-> UI
    VG -.gates PRs.-> P
```

The migration is **additive and page-by-page**: Tailwind v4 and the token
layer stand up alongside MUI; components are replaced one at a time and
verified; MUI/Emotion/styled-components are removed only after the last
usage is gone.

### Component Details

**Token layer** — `apps/blog/blog/design-system/tokens.css`
- Responsibility: the single source of truth for color, spacing, type
  scale, radius, shadow, motion, breakpoints, expressed as Tailwind v4
  `@theme` custom properties (`--color-brand-500`, `--space-4`,
  `--font-size-lg`, …) using a primitive → semantic two-tier naming
  (`--color-brand-500` primitive, `--color-text-primary` semantic alias).
- Seeded by translating the current MUI theme in `pages/_app.js`
  (`#337ab7` brand blue, `#333333` text, greys) into primitives, then
  refreshed to a modern palette as part of the visual direction work.
- Dark mode: a `[data-theme="dark"]` block re-aliases the *semantic*
  tokens only; primitives and components don't change.
- Optional `tokens/*.json` (DTCG) export is explicitly **not** load-bearing
  (see Alternatives) — `tokens.css` is the contract.

**Styling layer** — Tailwind v4
- `tailwindcss@^4` + `@tailwindcss/postcss`; replace the broken
  `tailwind.config.ts` with v4 CSS-first config (`@import "tailwindcss";
  @theme { … }`) imported from `tokens.css`. `@tailwindcss/typography`
  backs the `<Prose>` wrapper for rendered markdown.
- `postcss.config.js` updated to the v4 plugin.

**Primitives layer** — Radix UI (`@radix-ui/react-*`)
- Unstyled, accessible behavior (dialog, dropdown, tooltip, etc.).
  Radix supports React 19. Used as the foundation for the owned components.

**Owned component library** — `apps/blog/blog/components/ui/*.tsx`
- shadcn/ui as the *seed* (`npx shadcn@latest init` → `add <component>`),
  configured to emit into `components/ui/` and to consume the token CSS
  variables (not raw Tailwind palette). Components are checked-in `.tsx`
  files the agents own and edit directly.
- Layout primitives in `components/primitives/`: `<Container>`,
  `<Stack>`, `<Cluster>`, `<Grid>`, `<Prose>` (wraps remark HTML; replaces
  MUI `<Typography>` for post bodies).
- Blog components in `components/`: `<SiteHeader>`/`<SiteFooter>`/`<NavMenu>`,
  `<PostCard>`, `<PostLayout>`, `<CodeBlock>` (wraps existing Prism output,
  adds copy button + language label), `<Callout>`, `<TagPill>`,
  `<CategoryBadge>`, `<Breadcrumbs>`, `<TableOfContents>`, and a
  refactored `<Pagination>`. These replace the current `SiteLayout.js`,
  `IndexPage.js`, `BlogPostContentPage.js`, `BlogSidebar.js`, `WikiPage.js`,
  `Pagination.js`.

**Documentation + workshop** — Storybook 10 — `apps/blog/blog/.storybook/`
- `@storybook/nextjs-vite` (Vite builder; independent of the app's webpack
  build, faster, the current recommended Next.js path). One story per
  component plus a "Foundations" section rendering the token scales.
- Hosts the test layer: Storybook test-runner + `@axe-core/playwright` for
  a11y, and Playwright `toHaveScreenshot()` for visual regression against
  story canvases (more stable than full-page diffs).
- `npm run build-storybook` produces the static artifact Kyle demos.

**Dark mode**
- `data-theme` on `<html>`, set by a tiny blocking inline script in
  `pages/_document.js` (reads `localStorage`/`prefers-color-scheme` before
  paint → no flash). A `<ThemeToggle>` flips it. Pure CSS-variable swap;
  no JS theme provider, compatible with static export.

**Autonomy harness**
- `apps/blog/bin/verify-design-system.sh`: `next build` (static export
  succeeds) + `next lint` + `npm run build-storybook` + `npx playwright
  test` (visual + axe) + a `check-no-raw-hex` grep guard. Exit non-zero
  fails the agent's PR.
- `apps/blog/blog/design-system/AGENTS.md`: how to add/change/remove a
  component and a token; mirrored into `CLAUDE.md`/`.cursor` via a new
  `.ruler/design-system.md` source.

### Data Model

None. No persistence; tokens and components are source files. The only
"state" is the dark-mode preference in `localStorage`.

### API / Interface Contracts

- **Token contract:** components reference CSS variables via Tailwind
  utility classes (`bg-surface`, `text-primary`, `p-4`) that resolve to
  `@theme` vars. No component hardcodes a hex or px (except `0`/`1px`).
  Enforced by the grep guard.
- **`<Prose>` contract:** rendered markdown HTML is injected inside a
  single `<Prose>` wrapper; markdown element styling lives there, not
  scattered. Prism markup and classes are preserved; `<CodeBlock>`
  decorates rather than replaces them.
- **Story contract:** every component in `components/ui|primitives` and
  every blog component has a `*.stories.tsx` with at least default + dark
  variants; the verification gate fails if a component lacks a story
  (lightweight check).

## Alternatives Considered

### Decision: Styling layer

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Tailwind v4 (CSS-first `@theme`) | Token source of truth + utilities in one place; zero runtime; mainstream; Kyle wants exposure | New major; must rewire the broken v3 config | **Chosen** — directly serves the token-driven, modern, durable goals |
| Fix existing Tailwind v3 | Smaller step | No `@theme`; keeps tokens split JS/CSS; aging | Rejected — v3 is already broken and dated |
| Keep MUI + Emotion | No migration | CSS-in-JS runtime on a static site; not the modern pick; opaque to agents | Rejected — it's the thing being replaced |

### Decision: Token source of truth (addresses Kyle's "DTCG is young" concern)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Tailwind `@theme` (`tokens.css`) is load-bearing; DTCG optional | Stable, mainstream, no young-spec risk; one file an agent edits | Not a tool-neutral interchange format | **Chosen** — removes the risk Kyle flagged while keeping a real token layer |
| DTCG JSON + Style Dictionary as source | Tool-neutral, Figma bridge | Spec is young (first stable 2025.10), Style Dictionary lacks full support; extra build step | Rejected for v1 — kept as optional export only |

### Decision: Primitive + component model (addresses Kyle's "shadcn = you own maintenance" concern)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Radix + shadcn-seeded owned `.tsx`, **kept small & Storybook-documented** | Agents read/edit real files; AI-native; no opaque upgrades; the demo Kyle wants | You own upstream fixes | **Chosen** — small surface + Storybook + AGENTS.md is exactly what makes "maintain via AI" cheap |
| Versioned library (MUI Joy / Radix Themes / Park UI) | `npm`-upgradeable | Opaque to agents; theming fights the token layer; less to "show" as *your* system | Rejected — undercuts the demoable-POC goal |
| React Aria Components | Deepest a11y | Heavier API, more code; overkill for a blog | Rejected — Radix is sufficient |

### Decision: Storybook (Kyle hard-requirement; overrides the seed research)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Storybook 10 (`@storybook/nextjs-vite`) | Industry-standard workshop + docs + test host; Kyle wants exposure; the demo surface; slim modern install | Second build pipeline to maintain | **Chosen** — the seed research argued against it, but it is a stated outcome and *is* the component-library showcase |
| Bespoke `/design-system` Next route | No new dep | Reinvents Storybook badly; not what a reviewer expects to see | Rejected — Kyle explicitly wants Storybook |

### Decision: Dark mode under static export

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| `data-theme` + no-flash inline script + CSS-var swap | Works with `output: 'export'`; no flash; no provider | Tiny inline script in `_document.js` | **Chosen** |
| MUI/JS theme provider | Familiar | CSS-in-JS runtime; flash risk on static; being removed anyway | Rejected |

### Decision: TypeScript depth

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| New DS code in `.tsx`, legacy pages stay `.js` | Tooling already present (`typescript@5`, TS configs); shadcn/Storybook are TS-first; modern signal | Mixed JS/TS repo during transition | **Chosen** |
| Convert whole blog to TS | Uniform | Large, out-of-scope, risky | Rejected — explicit non-goal |
| Stay all-JS | No new surface | Fights shadcn/Storybook defaults; weaker demo | Rejected |

## File Change List

| Action | File | Rationale |
|--------|------|-----------|
| CREATE | `apps/blog/blog/design-system/tokens.css` | Token source of truth (`@theme` CSS vars, light + `[data-theme=dark]`) |
| CREATE | `apps/blog/blog/design-system/AGENTS.md` | Agent instructions: add/change/remove component or token |
| CREATE | `apps/blog/blog/design-system/INVENTORY.md` | Phase-0 map of existing components + every MUI/styled-components usage |
| CREATE | `apps/blog/blog/components/ui/*.tsx` | shadcn-seeded owned primitives (Button, Dialog, etc.) |
| CREATE | `apps/blog/blog/components/primitives/{Container,Stack,Cluster,Grid,Prose}.tsx` | Layout primitives; `<Prose>` wraps rendered markdown |
| CREATE | `apps/blog/blog/components/{SiteHeader,SiteFooter,NavMenu,PostCard,PostLayout,CodeBlock,Callout,TagPill,CategoryBadge,Breadcrumbs,TableOfContents,ThemeToggle}.tsx` | Blog component library |
| CREATE | `apps/blog/blog/**/*.stories.tsx` | One story per component + Foundations |
| CREATE | `apps/blog/blog/.storybook/{main.ts,preview.ts}` | Storybook 10 config (nextjs-vite, dark backgrounds, a11y addon) |
| CREATE | `apps/blog/bin/verify-design-system.sh` | Autonomy gate: build + lint + SB build + Playwright/axe + hex guard |
| CREATE | `apps/blog/blog/scripts/check-no-raw-hex.mjs` | Grep guard: no raw hex/px in component code |
| CREATE | `.ruler/design-system.md` | Ruler source → fans DS rules into CLAUDE.md/.cursor |
| MODIFY | `apps/blog/blog/package.json` | Add tailwind@4, @tailwindcss/postcss+typography, radix, storybook 10, axe; remove mui/emotion/styled-components/tailwind@3 (last) |
| MODIFY | `apps/blog/blog/postcss.config.js` | Tailwind v4 PostCSS plugin |
| DELETE | `apps/blog/blog/tailwind.config.ts` | Broken v3 config replaced by v4 CSS-first `@theme` |
| MODIFY | `apps/blog/blog/pages/_app.js` | Remove MUI ThemeProvider/createTheme; import token CSS; keep GA |
| MODIFY | `apps/blog/blog/pages/_document.js` | No-flash dark-mode inline script; `data-theme` bootstrap |
| MODIFY | `apps/blog/blog/pages/{index,about,[...route]}.js` | Swap MUI components for the new library, page by page |
| MODIFY | `apps/blog/blog/public/css/globals.css` | Token-backed base styles; `<Prose>` typography |
| MODIFY | `apps/blog/blog/playwright.config.ts` | Add story-canvas visual + axe projects |
| DELETE | `apps/blog/blog/components/{SiteLayout,IndexPage,BlogPostContentPage,BlogSidebar,WikiPage,Pagination}.js` | Superseded by the new library (after migration) |

## Task Breakdown

Dependency-ordered. Each task is one coherent, isolated-testable change
sized for a single Claude Code `/goal`-driven turn. `[P]` =
parallelizable with its siblings. Every task ends green on the relevant
slice of `verify-design-system.sh`.

### TASK-001: Inventory + visual direction

- **Requirement:** PRD "demos to experts" + the visual-direction gate
- **Files:** `apps/blog/blog/design-system/INVENTORY.md`
- **Dependencies:** None
- **Acceptance criteria:**
  - [ ] Every component, page, and MUI/styled-components usage listed with paths.
  - [ ] **3** visual directions (palette + type + spacing) proposed as mockups for Kyle to choose before mass component work.

### TASK-001B: Upgrade React 18 → 19 `[P]`

- **Requirement:** "bias to newest" decision; shadcn/ui targets React 19
- **Files:** `package.json` (`react`, `react-dom`, `@types/react*`)
- **Dependencies:** None
- **Acceptance criteria:**
  - [ ] React 19 + matching types installed; `next build` static export succeeds; existing pages render unchanged (Playwright smoke).
  - [ ] Any peer-dep breakage resolved or recorded; isolated commit, easy to revert.

### TASK-002: Stand up Tailwind v4 alongside MUI

- **Requirement:** PRD success metric 1 (styling layer)
- **Files:** `package.json`, `postcss.config.js`, `tailwind.config.ts` (delete), `design-system/tokens.css`, `public/css/globals.css`
- **Dependencies:** TASK-001
- **Acceptance criteria:**
  - [ ] `tailwindcss@4` + `@tailwindcss/postcss` installed and compiling; broken v3 config removed.
  - [ ] An empty/seed `@theme` renders; `next build` static export still succeeds; nothing visually changes yet.

### TASK-003: Token foundation

- **Requirement:** PRD success metric 1 (single source of truth)
- **Files:** `design-system/tokens.css`
- **Dependencies:** TASK-002
- **Acceptance criteria:**
  - [ ] Color/space/type/radius/shadow tokens defined as `@theme` vars (primitive + semantic tiers), seeded from the current MUI theme then refreshed per the chosen direction.
  - [ ] `[data-theme="dark"]` re-aliases semantic tokens; both themes render in a scratch page.

### TASK-004: Storybook 10 install + Foundations story

- **Requirement:** PRD "demonstrable component library" `[P]`
- **Files:** `.storybook/main.ts`, `.storybook/preview.ts`, `package.json`, `design-system/Foundations.stories.tsx`
- **Dependencies:** TASK-003
- **Acceptance criteria:**
  - [ ] `npm run storybook` runs; `npm run build-storybook` produces a static build.
  - [ ] A Foundations story renders the token scales in light + dark.

### TASK-005: shadcn init + first owned primitive `[P]`

- **Requirement:** PRD "future change is straightforward through AI"
- **Files:** `components.json`, `components/ui/button.tsx`, `button.stories.tsx`
- **Dependencies:** TASK-003
- **Acceptance criteria:**
  - [ ] `shadcn` initialized to emit into `components/ui/`, wired to token vars (no raw palette classes).
  - [ ] `<Button>` renders in Storybook; one MUI button call site swapped as a pilot and verified via Playwright MCP.

### TASK-006: Layout primitives + `<Prose>`

- **Requirement:** PRD readability / `<Prose>` contract
- **Files:** `components/primitives/{Container,Stack,Cluster,Grid,Prose}.tsx` + stories
- **Dependencies:** TASK-003
- **Acceptance criteria:**
  - [ ] Primitives render token-driven; `<Prose>` styles a sample rendered-markdown blob (incl. Prism code) with no MUI.

### TASK-007: Dark-mode plumbing

- **Requirement:** PRD "modern, nicer" + dark mode
- **Files:** `pages/_document.js`, `components/ThemeToggle.tsx` + story
- **Dependencies:** TASK-003
- **Acceptance criteria:**
  - [ ] No-flash inline script sets `data-theme` from storage/`prefers-color-scheme` before paint.
  - [ ] Toggle flips theme with no layout shift; Playwright confirms both themes.

### TASK-008: Verification gate + Ruler docs

- **Requirement:** PRD autonomy / verification gate (land before mass migration)
- **Files:** `apps/blog/bin/verify-design-system.sh`, `scripts/check-no-raw-hex.mjs`, `playwright.config.ts`, `design-system/AGENTS.md`, `.ruler/design-system.md`
- **Dependencies:** TASK-004, TASK-005, TASK-006
- **Acceptance criteria:**
  - [ ] Gate runs build + lint + storybook build + Playwright(visual+axe) + hex guard and exits non-zero on any failure.
  - [ ] `AGENTS.md` documents add/change/remove flows; `ruler apply` fans the rules into CLAUDE.md.

### TASK-009 … 013: Blog component build + page migration `[P per page]`

- **Requirement:** PRD "visibly modern blog" + metric 1
- **Files:** `components/{SiteHeader,SiteFooter,NavMenu,PostCard,PostLayout,CodeBlock,Callout,TagPill,CategoryBadge,Breadcrumbs,TableOfContents}.tsx` + stories; `pages/{index,about,[...route]}.js`; delete old `components/*.js`
- **Dependencies:** TASK-008 (gate must exist first)
- **Acceptance criteria (per page):**
  - [ ] Page uses only the new library; its MUI/styled-components imports are gone; each new component has a story.
  - [ ] `verify-design-system.sh` is green; Playwright MCP screenshots at mobile/tablet/desktop match the chosen direction.

### TASK-014: Remove MUI / Emotion / styled-components (last)

- **Requirement:** PRD success metric 1 (full removal)
- **Files:** `package.json`, `pages/_app.js`
- **Dependencies:** TASK-009–013 all done
- **Acceptance criteria:**
  - [ ] `rg "@mui|@emotion|styled-components" apps/blog/blog --files-with-matches` returns nothing.
  - [ ] Packages uninstalled; `next build` + full gate green; bundle size delta recorded.

## Implementation Additions

_(none yet — populated as scope drifts during implementation)_

## Open Questions

- **Visual direction** — the one remaining human gate. Blocks TASK-009+
  mass work until Kyle picks one of the three TASK-001B mockups. Everything
  before it (foundations, React 19, tooling, gate) runs without it.

Resolved (2026-06-13): component model = shadcn-owned `.tsx`; React = 19;
autonomy = a `/goal` session (not `autolearn` Linear sub-issues).

## Risks

- **Mid-migration bundle bloat** (MUI + Tailwind coexisting). Accepted;
  recovered at TASK-014. Mitigation: remove old system last, record delta.
- **Noisy visual regression.** Mitigation: diff Storybook story canvases
  (isolated) not full pages; run in the Docker/Cloud Build environment;
  set `maxDiffPixelRatio` thresholds.
- **Static-export dark-mode flash.** Mitigation: blocking inline script in
  `_document.js` before first paint.
- **Weak gate → autonomous regressions.** Mitigation: gate is TASK-008,
  landed and proven before any mass page migration.
- **React 19 ecosystem maturity.** Upgrading to React 19 (TASK-001B) can
  surface peer-dep warnings or a lib not yet on 19. Mitigation: do the bump
  early and isolated; `mermaid`/`openai`/`sharp` are runtime-agnostic; pin
  versions and verify `next build` before any component work.
- **Scope creep toward a full TS/App-Router rewrite.** Mitigation: tasks
  are additive; the non-goals are explicit and enforced in review.
