---
title: "Claude Deep Research: A Modern, Agent-Native Design System for kyle.pericak.com"
summary: "Claude Deep Research report on building an additive, agent-readable design system on the existing Next.js + MUI blog stack — design tokens (DTCG/Style Dictionary), Tailwind v4, Radix primitives, the shadcn/ui copy-paste model, MCP-driven workflows, and Playwright/axe visual + a11y guardrails."
keywords:
  - deep-research
  - claude
  - design-system
  - design-tokens
  - tailwind
  - storybook
  - shadcn
  - radix
  - component-library
  - blog-redesign
provider: claude
prompt: "Research a modern, agent-native design system for kyle.pericak.com as a predicate to a blog redesign: what a design system is, what makes one good, the modern building blocks (tokens, styling, primitives, component model, MCP, LLM-readable docs), and prescriptive guidance for an additive migration off the current Next.js Pages Router + MUI stack."
date_generated: 2026-05-28
related:
  - wiki/research
  - wiki/research/design-system
  - wiki/prds/blog-design-system
scope: "Single-provider Deep Research report. Not cross-referenced or synthesized. Seed input for PER-135 (blog redesign / design system). Kyle's steering overrides parts of it — notably Storybook is in scope despite the report recommending against it."
last_verified: 2026-05-28
---

# A Modern, Agent-Native Design System for kyle.pericak.com

**TL;DR**
- **Build the design system *additively* on top of your existing Next.js (Pages Router, JavaScript) + MUI + remark + Prism stack.** Adopt three industry-standard layers — Tailwind CSS v4 (CSS-first design tokens), Radix UI primitives, and the shadcn/ui copy-paste model — and migrate components one at a time. Don't rewrite; co-exist with MUI until the last `<Typography>` is gone.
- **Skip Storybook for now.** For a solo blog with ~12 component types, Storybook is overkill; the right "isolated component playground" is a single `/design-system` Next.js route plus Playwright MCP screenshots driven by Claude Code. Adopt Storybook only if/when you publish a public component registry or open up the blog to multiple authors.
- **Make design tokens the agent-readable contract.** Author tokens in W3C DTCG JSON, compile through Style Dictionary into Tailwind v4 `@theme` CSS variables, document the system in `apps/blog/design-system/AGENTS.md` (mirrored from your existing `.ruler/` source), and run a `/design-token` slash command + Playwright visual diff as the guardrail that lets Pai/Publisher/Reviewer iterate without you in the loop.

---

## 1. What Is a Design System?

A design system is the **single source of truth that turns design decisions into shipped product code**. It is not a Figma file, not a component library, and not a brand guidelines PDF — it is the union of all of those plus the *governance and tooling* that keeps them coherent. The most-cited working definition comes from Nathan Curtis of EightShapes: "A design system isn't a project. It's a product, serving products." Brad Frost's *Atomic Design* (2013, with design tokens added formally in 2019) gave the industry the dominant mental model: subatomic tokens → atoms → molecules → organisms → templates → pages.

### Distinguishing it from related concepts

| Term | What it is | Relationship to a design system |
|---|---|---|
| **Style guide** | A document describing visual rules (colors, type, spacing) | One *artifact* a design system produces |
| **Pattern library** | A catalogue of UI patterns (login form, empty state) | The "molecules/organisms" layer |
| **Component library** | Shippable, importable code components | The "atoms/molecules" layer in code |
| **UI kit** | Reusable design files (Figma library) | The Figma-side mirror of the component library |
| **Brand guidelines** | Logo, voice, photography, identity rules | An *upstream* input the tokens encode |
| **Design system** | All of the above + tokens + docs + governance + tooling | The umbrella |

### The canonical anatomy

A mature design system has six layers (this is the consensus stack across Material Design, Atlassian Design System, Shopify Polaris, IBM Carbon, Salesforce Lightning, and GitHub Primer):

1. **Design tokens** — the indivisible, named values (`color.brand.500`, `space.4`, `radius.md`, `font.size.lg`). The W3C Design Tokens Community Group, whose specification reached its first stable version (2025.10) on October 28, 2025, defines a vendor-neutral JSON format with explicit support for theming, modern color spaces, and cross-tool interoperability. Salesforce coined the term "design tokens" in 2014.
2. **Primitives / atoms** — typography, color, iconography, spacing, motion, elevation rules realized in code.
3. **Components** — Button, Input, Dialog, Card, Toast. Accessible, themeable, composable.
4. **Patterns / recipes** — repeatable UI compositions (e.g., a "post card with tag pills and timestamp"). Often the layer where Brad Frost's "organisms" live.
5. **Documentation** — usage, do/don't, code examples, a11y notes, version history. Tools: Storybook, Zeroheight, Supernova, or a custom docs site.
6. **Governance** — versioning policy, contribution workflow, deprecation strategy, ownership.

### Well-known industry exemplars

- **Material Design (Google)** — the most influential of all; its design tokens work directly informed the DTCG spec.
- **Atlassian Design System** — strong on tokens-as-API and theming.
- **Shopify Polaris** — exemplary docs and accessibility posture.
- **IBM Carbon** — multi-platform (Web/iOS/Android/Native), Style-Dictionary-driven token pipeline.
- **Salesforce Lightning** — birthplace of design tokens.
- **GitHub Primer** — pragmatic; Primer Primitives package = pure tokens.
- **Adobe Spectrum / React Spectrum (React Aria)** — gold standard for accessibility primitives.

The throughline: tokens are the contract; components are the implementation; docs are the API; governance is the SLA.

---

## 2. What Makes a Design System *Good*?

Below is a concrete evaluation rubric. Score 0–3 on each criterion; a healthy DS scores ≥2 on every row.

| # | Criterion | What "good" looks like | What "bad" looks like |
|---|---|---|---|
| 1 | **Single source of truth** | Tokens defined once (DTCG JSON or Tailwind `@theme`), compiled to every consumer | Color hex codes duplicated across CSS, JS, Figma |
| 2 | **Token architecture** | Three tiers: *primitive* (raw values) → *semantic* (`color.text.primary`) → *component* (`button.bg.hover`) | Flat list of 200 named colors with no aliasing |
| 3 | **Theming / dark mode** | Theme = swap of semantic tokens; no component changes needed | Forked components per theme |
| 4 | **Accessibility (a11y)** | WCAG 2.2 AA baseline, automated axe-core checks in CI, keyboard-tested, screen-reader-tested | Visual-only QA |
| 5 | **Composability** | Components compose via slots, polymorphic `as`, or Radix-style `asChild` | Monolithic, prop-explosion components |
| 6 | **Responsiveness** | Mobile-first; tested at common breakpoints | Desktop-only baselines |
| 7 | **Performance** | Tree-shakable, CSS-variable-driven, low runtime cost (no heavy CSS-in-JS for static content) | Megabyte of JS to render a button |
| 8 | **Documentation quality** | Each component has: purpose, anatomy, props, a11y notes, do/don't, code example | A README with three sentences |
| 9 | **Developer experience** | One-command install (`shadcn add button`), type-safe APIs, autocomplete | Manual copying with broken imports |
| 10 | **Versioning** | SemVer, changelog, deprecation warnings, migration codemods | Silent breaking changes |
| 11 | **Design-dev handoff** | Tokens flow from Figma to code automatically (Tokens Studio, Figma MCP, Style Dictionary) | Eyeball-pixel-pushing in dev |
| 12 | **Maintainability** | Tests + visual regression + a11y CI as quality gates | "It looked fine when I shipped it" |
| 13 | **Adoption telemetry** | You know which components are used where | No insight into actual usage |
| 14 | **LLM-readability** | Components live as plain source files; an `AGENTS.md` / `CLAUDE.md` explains conventions; an `llms.txt` indexes docs | Components hidden in opaque `node_modules` with no agent-readable docs |

Criterion 14 is the new addition for 2025–2026. The shift to agent-driven development means a design system is now also evaluated on how legibly an LLM can read, reason about, and extend it — which is the central thesis of the next section.

---

## 3. Modern Building Blocks for an AI-Native Design System (with a Claude bias)

The state of the practice in 2025–2026 is a *layered, code-owned* stack. Each layer has a clear winner; you should not mix and match outside this list unless you have a specific reason.

### 3.1 The token layer

- **W3C Design Tokens Community Group format** — JSON files with `$value`, `$type`, `$description`, and alias references (`{color.brand.500}`). Stable since the 2025.10 release on October 28, 2025. **Use it.** Filenames end in `.tokens.json`; media type is `application/design-tokens+json`. Per the DTCG announcement: "The new stable specification addresses [fragmentation] through standardized support for theming, modern color spaces, and cross-tool interoperability."
- **Style Dictionary v4 (Amazon)** — the de facto tokens compiler; first-class DTCG support in v4. Per styledictionary.com/info/dtcg/: "As of version 4, Style Dictionary has first-class support for the DTCG format. Important note: the latest format 2025.10 does not have full support yet in Style Dictionary. This is a work in progress in v5."
- **Tokens Studio** — Figma plugin that authors DTCG JSON; the canonical Figma↔code bridge.
- **Tailwind CSS v4 `@theme` directive** — a *first-class* place to land your compiled tokens. In v4, `@theme { --color-primary-500: oklch(…); }` both registers a CSS variable and generates the corresponding utility (`bg-primary-500`). This collapses the old "tokens in JS config vs. CSS variables in `:root`" duplication into one source.

### 3.2 The styling layer

- **Tailwind CSS v4** is the dominant utility-first system in 2025–2026. Per Adam Wathan's release post on tailwindcss.com/blog/tailwindcss-v4 (January 22, 2025): "New high-performance engine — where full builds are up to 5x faster, and incremental builds are over 100x faster — and measured in microseconds." (Tailwind's own Catalyst benchmark cited "over 3.5x faster" full builds and "over 8x faster" incremental builds; the 5×/100× figures are stated maximums.) v4 also ships first-party Vite integration and exposes every theme value as a real CSS custom property. **CSS-in-JS (Emotion, styled-components) is no longer the default recommendation** for new projects — the React Server Components era favors zero-runtime CSS.
- **CSS variables for theming**, always. Light/dark = swap `:root` vars or toggle a `.dark` class on `<html>`; no component edits needed.

### 3.3 The primitives layer (unstyled, accessible behavior)

Three serious contenders. Pick one:

| Library | When to pick it |
|---|---|
| **Radix UI Primitives** | The default, ~30 components, used as the foundation for shadcn/ui. `@radix-ui/react-slot` records approximately 148 million weekly npm downloads as of May 15, 2026 (npmx.dev) — a useful proxy for shadcn/ui adoption. Radix was acquired by WorkOS; update cadence has slowed on some components. |
| **Base UI** (formerly MUI Base) | The actively-maintained alternative, backed by the MUI team. shadcn/ui added Base UI as a supported primitive layer in 2025. |
| **React Aria Components (Adobe)** | The deepest accessibility primitives; pick when WCAG compliance is a hard requirement (e.g., government). Heavier APIs, more code to write. |

Pick **Radix** for a personal blog. It's the path of least resistance and the one shadcn/ui defaults to.

### 3.4 The component model: shadcn/ui has won

shadcn/ui is the dominant component system of 2025–2026 — not because it has the most components, but because of its distribution model. Per the official docs at ui.shadcn.com: "It is built around the following principles: **Open Code, Composition, Distribution, Beautiful Defaults, AI-Ready**." You run `npx shadcn add button` and the source code for `components/ui/button.tsx` lands in *your* repo. You own it. There is no `node_modules/shadcn-ui` to upgrade.

Why this wins in an AI-native world:
1. **Agents can read the code.** When you ask Claude to "make the dialog slide in from the right," it can open `components/ui/dialog.tsx`, see the actual classes, and modify them. With an opaque npm dependency, Claude has to guess at the theme object's shape.
2. **No version lock-in.** The component is a checked-in `.tsx` (or `.jsx`) file. It changes when you change it.
3. **It's a *registry*, not a library.** Per the official "August 2025 - shadcn CLI 3.0 and MCP Server" changelog at ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp: "We just shipped shadcn CLI 3.0 with support for namespaced registries, advanced authentication, new commands and a completely rewritten registry engine." You can run your own private or public registry behind `@yourorg/component`.
4. **MCP-native.** The shadcn MCP server (made zero-config in 2025) lets an AI agent browse a registry and install components by prompt rather than by typing CLI commands.

The same changelog states: "Back in April, we introduced the first version of the MCP server. Since then, we've taken everything we learned and built a better MCP server… Works with all registries. Zero config." This is the unlock: a design system is now a thing an agent can *consume* as a tool, not just code an agent can edit.

### 3.5 The MCP layer (the agentic glue)

Three MCP servers matter for design systems in 2026:

- **shadcn registry MCP** — your agent can call `get_items`, `add`, `init`, etc., against the official `ui.shadcn.com/r` registry or your own. Configure in `components.json`.
- **Figma Dev Mode MCP** — Figma's remote MCP at `https://mcp.figma.com/mcp` (or local desktop server at `http://127.0.0.1:3845/mcp`). It exposes `get_design_context` (returns a React + Tailwind representation of the selection) and `get_variable_defs` (extracts colors, spacing, typography variables). For Claude Code, the recommended installer is `claude plugin install figma@claude-plugins-official`, per developers.figma.com/docs/figma-mcp-server/remote-server-installation/.
- **Playwright MCP** — Microsoft's MCP server that drives a real browser. This is the visual-feedback loop: an agent navigates the dev server, takes a screenshot or DOM snapshot, evaluates against the design, and iterates. Kyle already uses this in his `CLAUDE.md` ("`mcp__playwright__browser_navigate` → `_take_screenshot` → `_snapshot` → `_close`").

### 3.6 LLM-readable documentation: llms.txt, AGENTS.md, CLAUDE.md

- **`/llms.txt`** — Jeremy Howard's proposal (llmstxt.org) for a Markdown file at site root that gives LLMs a curated map of the most important content. Adopted by Mintlify, Vercel, and others. Status: voluntary, treated as an "interesting idea" by most crawlers but increasingly useful for *your own* agents reading *your own* docs.
- **`/llms-full.txt`** — a flattened, full-text dump of the most important docs (e.g., your design system reference), so an agent can ingest the entire spec in one fetch.
- **`AGENTS.md`** — a joint open standard published by OpenAI, Google, Factory, Sourcegraph, and Cursor. Plain Markdown at the repo root. Per agents.md: "Think of AGENTS.md as a README for agents: a dedicated, predictable place to provide context and instructions to help AI coding agents work on your project." Compatible with Cursor, Codex, Aider, Gemini CLI, Jules, Zed, Phoenix, and others. The closest `AGENTS.md` to the file being edited wins.
- **`CLAUDE.md`** — Claude Code's project memory file. Loaded at the start of every session; subdirectory `CLAUDE.md` files load when Claude reads files in that directory; `#`-prefixed lines in the REPL auto-append to memory. Kyle already maintains a 247-line root `CLAUDE.md`.

The 2026 best practice is to use **Ruler** (or a similar tool) to author rules *once* and fan them out to `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, and `.opencode/agents/`. Kyle already has a `.ruler/` directory doing exactly this.

### 3.7 Claude Code as the IDE for the design system

The capabilities that matter for a design-system workflow:

- **CLAUDE.md project memory** — already covered. Keep it under 250 lines; dense prose wastes context every session.
- **Custom slash commands and skills** — `.claude/commands/*.md` (legacy) or `.claude/skills/<name>/SKILL.md` (new, recommended). The latter is loaded based on the `description` field, so well-written descriptions are how Claude discovers when to use them. Per the official Claude Code docs at code.claude.com/docs/en/slash-commands: "Every skill needs a SKILL.md file with two parts: YAML frontmatter (between --- markers) that tells Claude when to use the skill, and markdown content with instructions Claude follows when the skill is invoked." The `/goal` command (a session-level completion condition shipped in Claude Code v2.1.x) is purpose-built for "run until visual diff passes and a11y is clean" kinds of tasks.
- **Subagents** — isolated Claude instances with their own context windows. Kyle has 11: Pai (orchestrator), Publisher, Analyst, Synthesizer, PRD Writer, Design Doc Writer, plus the auto-delegated Interviewee/Researcher/Reviewer/QA/Security Auditor.
- **MCP integration** — `claude mcp add` registers servers; `/mcp` debugs them. The Figma plugin is installed via `claude plugin install figma@claude-plugins-official`.
- **Hooks** — shell commands fired on lifecycle events (PostToolUse, PreCompact, etc.). Use these to auto-run `biome check` after edits, or `playwright test` after dependency upgrades.
- **Artifacts** (Claude apps) — useful for quick component prototyping in chat; less relevant for the in-repo workflow.

### 3.8 Visual & a11y guardrails for human-out-of-the-loop work

The whole point of an agentic workflow is that the human doesn't have to look at every diff. That requires *machine-verifiable* quality signals. For a personal blog:

- **Playwright `toHaveScreenshot()`** — built-in, free, zero new dependencies. The official Playwright docs (playwright.dev/docs/test-snapshots) describe layout-based diffing with configurable thresholds via `maxDiffPixels` and `maxDiffPixelRatio`; the standard guidance is to configure those thresholds and run snapshots in a containerized CI environment to eliminate environment-driven false positives (anti-aliasing, OS fonts, sub-pixel rendering).
- **Playwright MCP** — drives the same browser from an agent prompt. Kyle is already using this.
- **axe-core via `@axe-core/playwright`** — runs accessibility checks inside Playwright tests. Free, open source, the industry-standard a11y engine.
- **Biome** for linting/formatting. Kyle uses Biome v2.0.0.
- **Chromatic** — pay-for-it tier when you scale to many components and want a review UI. **Not warranted for a personal blog.**
- **Storybook test runner** — only if you adopt Storybook. (You shouldn't, for this blog — see §4.)

The agent feedback loop: *generate change → run Playwright + axe → diff snapshots → if pass, open PR; if fail, retry up to N times.* Kyle's existing `Reviewer` and `QA` subagents are already the right shape for this.

---

## 4. Prescriptive Guidance: A First-Class Design System for kyle.pericak.com

### 4.1 What you actually have today (verified from the repo)

This is the grounding for everything below. Confirmed from `apps/blog/README.md`, the root `CLAUDE.md`, and `biome.json`:

- **Framework**: Next.js, **Pages Router** (`pages/[..route.js]`, `pages/_app.js`), **JavaScript** (not TypeScript).
- **Styling**: **Material UI (MUI)** via `sx` props on page components; theme + `<head>` in `pages/_app.js`; small `styles/globals.css` for remark-rendered markdown HTML. Per `apps/blog/README.md`: "I've tried to keep the styles as close to the code as possible. Primarily in react's `sx` props on page components… Theme styles and `<head>` are in `pages/_app.js`."
- **Content**: Plain `.md` files at `apps/blog/blog/markdown/posts/*.md`, parsed with **remark** (+ `remark-toc`, `remark-gfm`) and built to JSON; **Prism.js** for syntax highlighting.
- **Build/deploy**: `bin/build-blog-files.sh` → static `out/` → Docker image `gcr.io/kylepericak/kylepericakdotcom` → Google Cloud Build reads `apps/blog/cloudbuild.yaml` → rsync to a public GCS bucket. Terraform-managed GCB trigger in `tf/`.
- **Agentic tooling**: `CLAUDE.md` (247 lines), 11 Claude Code agents in `.claude/agents/` (Pai, Publisher, Analyst, Synthesizer, PRD Writer, Design Doc Writer + 5 subagents), `.ruler/` fans rules into `.cursor/rules/` and `.opencode/agents/`, `opencode.json`, `prompt-readme.md`.
- **Quality gates**: Biome v2.0.0 (with blog-specific rule relaxations in `biome.json` for `<img>`, `dangerouslySetInnerHTML`, array index keys); pre-commit gitleaks via Docker; CodeRabbit (`chill` profile) with detailed per-path instructions — notably *"do not suggest grammar/tone changes"* for `apps/blog/blog/markdown/posts/**`; Playwright MCP for human-out-of-the-loop visual verification.

**Implication**: you do not need to "rebuild" or even change frameworks. Next.js Pages Router with static export is a perfectly fine substrate for a ~100-post technical blog. You need to *layer in* a token system, a primitives layer, and a documentation surface — and gradually retire MUI from one component at a time as you go.

### 4.2 The target stack (additive, mainstream, named)

| Layer | Pick | Why this and not alternatives |
|---|---|---|
| Framework | **Keep Next.js Pages Router + JS** | The blog works. Migrating to App Router or TS is a separate project. |
| Tokens (source) | **DTCG JSON in `apps/blog/design-system/tokens/`** | Open standard, future-proof, agent-readable. |
| Tokens (compiler) | **Style Dictionary v4** | First-class DTCG; outputs CSS vars + JS module. |
| Styling | **Tailwind CSS v4** alongside MUI | v4's `@theme` is the perfect landing pad for compiled DTCG tokens; CSS-variable-first matches dark-mode needs. |
| Primitives | **Radix UI** | shadcn/ui default; battle-tested. |
| Components | **shadcn/ui** (copy-paste, you own the code) | AI-native, no version churn, Claude can edit the files directly. |
| Component CLI | **`shadcn` CLI 3.0+** | Adds components on demand; supports MCP. |
| MCP — components | **shadcn MCP server** | Zero-config; Claude can install components by prompt. |
| MCP — visuals | **Playwright MCP** (already in use) | Drives the verification loop. |
| Docs surface | **A single `/design-system` Next.js route** + `apps/blog/design-system/AGENTS.md` + `/llms.txt` + `/llms-full.txt` | Sized for a solo blog. Not Storybook. |
| Visual regression | **Playwright `toHaveScreenshot()`** + axe-core | Free, in-repo, agent-friendly. |
| Author rules once | **Keep Ruler** | You already use it. |

### 4.3 Should you adopt Storybook? No. Here's the reasoning.

You have, realistically, ~8–12 components in a blog: Header/Nav, Footer, PostCard, PostList, PostLayout, Tag, Category, CodeBlock, Callout, TableOfContents, ArticleMeta, and a few markdown-element overrides (`h1`–`h6`, `a`, `img`). Storybook's value scales with: (a) team size, (b) component count, and (c) the need for public/shared documentation. For one author, ~12 components, and a private blog, Storybook adds:

- A non-trivial install footprint. Per the official Storybook blog post *Storybook bloat? Fixed.* (storybook.js.org/blog/storybook-bloat-fixed, July 2025), pre-v9 installs routinely ran several hundred MB of `node_modules`; Storybook 9 cut install size by over 50% versus v8, and the ESM-only Storybook 10 cuts a further ~29%. The footprint argument has weakened, but the surface area is still meaningful.
- A second build pipeline.
- A maintenance tax (`@storybook/*` packages change frequently).
- A second source of truth for "how this component looks in isolation."

The *lighter alternative* that does 90% of what you need:

> **A dedicated, unindexed `/design-system` Next.js route inside the blog itself.** Each component has a sub-route (`/design-system/post-card`, `/design-system/callout`) that renders it in a few canonical states. Add `<meta name="robots" content="noindex">` so it doesn't show in search. The agent navigates this route via Playwright MCP, screenshots it, and diffs. You read the source code instead of reading Storybook docs.

Adopt Storybook *only* if and when you publish a component registry that other people consume, or open up the blog to multiple authors. Until then, the `/design-system` route is the right tool.

### 4.4 Scope: what the design system should accomplish and own

The design system is responsible for:

**Tokens** (in `apps/blog/design-system/tokens/`):
- `color.tokens.json` — primitive palette + semantic tokens (`color.text.primary`, `color.surface.elevated`, `color.code.bg`, etc.) + light/dark mode aliases.
- `space.tokens.json` — 4px-based spacing scale (`0`, `1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24`, `32`, `48`, `64`).
- `typography.tokens.json` — type scale (12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48), font families (mono for code, sans for body, optional serif for headings — Kyle's current MUI theme decides), line heights, letter spacing.
- `radius.tokens.json`, `shadow.tokens.json`, `motion.tokens.json`, `breakpoint.tokens.json`.

**Layout primitives** (in `apps/blog/design-system/primitives/`):
- `<Container>` — max-width content well.
- `<Stack>` and `<Cluster>` — vertical/horizontal flex with token-driven gap.
- `<Grid>` — for archive/category pages.
- `<Prose>` — wraps remark-rendered HTML; replaces MUI `<Typography>` for markdown content.

**Blog components** (in `apps/blog/components/`, gradually copy-paste from `shadcn add`):
- `<SiteHeader>` / `<SiteFooter>` / `<NavMenu>`.
- `<PostCard>` (thumbnail + title + date + tags + excerpt — matches the homepage grid you already have).
- `<PostLayout>` (article shell with title, meta, TOC, content, navigation).
- `<CodeBlock>` (wraps Prism output; adds copy button, language label).
- `<Callout>` (info / warn / tip / danger variants for blog posts).
- `<TagPill>`, `<CategoryBadge>`, `<Breadcrumbs>`.
- `<TableOfContents>` (sticky on desktop).
- Markdown element overrides for `h1`–`h6`, `a`, `img`, `blockquote`, `table`.

**Theming**:
- Single `:root { --color-… }` set, swapped via `[data-theme="dark"]` on `<html>`. No JS theme provider needed; Tailwind v4's CSS variables do it natively.

**Documentation**:
- `/design-system` route (one page per component, with a "view source" link to the actual `.jsx` file).
- `apps/blog/design-system/AGENTS.md` — how an agent should add, modify, or remove components.
- `/llms.txt` and `/llms-full.txt` at the site root — so external coding agents (and your own Pai bot) can ingest the spec.

**Governance**:
- Solo author = lightweight. SemVer on the monorepo. A `CHANGELOG.md` in `apps/blog/design-system/`. A `/design-token` Claude Code slash command that enforces "no raw hex codes in components — only token references."

### 4.5 How to interact with it: a Claude-Code-driven, mostly-human-out-of-the-loop workflow

Add this section to your existing `.ruler/` source (which fans out to `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`):

```markdown
## Design system rules (apps/blog/design-system/)

- All visual values come from `apps/blog/design-system/tokens/*.tokens.json` (DTCG format).
- Never write raw hex, raw rem/px (except 0/1px), or raw shadow values in component code.
- Components use Tailwind utility classes; classes resolve to token-backed CSS variables via `@theme`.
- Markdown-rendered content lives inside a `<Prose>` primitive — do not nest <Typography> inside <Prose>.
- When adding a new component:
  1. Check `apps/blog/design-system/AGENTS.md` for naming and structure conventions.
  2. Prefer `npx shadcn add <component>` over hand-rolling; review the generated file before commit.
  3. Add a story page at `pages/design-system/<component>.js`.
  4. Run `bin/verify-design-system.sh` (Playwright + axe + Biome).
- When removing an MUI component:
  1. Find all usages with `rg "@mui" apps/blog`.
  2. Replace one file at a time; verify with the screenshot loop in CLAUDE.md.
  3. Only remove the MUI dependency once `rg "@mui" apps/blog` returns nothing.
```

Add three Claude Code slash commands (skills) in `.claude/skills/`:

1. **`/design-token`** — given a Figma frame URL or a description, the agent (a) calls Figma MCP's `get_variable_defs`, (b) maps to or adds DTCG tokens, (c) regenerates Tailwind theme via Style Dictionary, (d) opens a PR.
2. **`/ds-add`** — given a component name, the agent (a) runs `npx shadcn add <name>`, (b) wires it to your tokens (replaces raw `bg-blue-500` with `bg-primary` etc.), (c) adds the story page, (d) runs `bin/verify-design-system.sh`, (e) opens a PR.
3. **`/ds-replace-mui`** — given an MUI component name, the agent rewrites callers to use the shadcn equivalent, runs the screenshot loop, and opens a PR.

Configure two Claude Code hooks in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [
        { "type": "command", "command": "cd apps/blog && npx @biomejs/biome check --apply $CLAUDE_FILE_PATH || true" }
      ]}
    ]
  }
}
```

…and have `bin/verify-design-system.sh` do:

```bash
#!/usr/bin/env bash
set -e
cd apps/blog
npx @biomejs/biome check .
npx playwright test design-system/      # screenshots + axe assertions
node scripts/check-no-raw-hex.mjs        # regex guard: no #abcdef in components/
```

This is the contract that lets Pai and Publisher work without you. The agent edits a component, the hook runs Biome on save, the verification script runs Playwright (which uses `toHaveScreenshot()` and `@axe-core/playwright`), and the PR either opens green or the agent retries.

### 4.6 Phased implementation roadmap

A realistic order of operations for working *with* Claude Code, one phase per session-ish.

**Phase 0 — Inventory (1 session, mostly reading)**
- Have Claude generate a component inventory: `find apps/blog/components -name '*.js' | xargs -I {} echo {}` and `rg "from '@mui" apps/blog --files-with-matches`.
- Output: `apps/blog/design-system/INVENTORY.md` listing every existing component and every MUI usage.

**Phase 1 — Stand up Tailwind v4 alongside MUI (1 session)**
- Install `tailwindcss@4`, `@tailwindcss/postcss`, `@tailwindcss/typography`.
- Add `apps/blog/styles/tailwind.css` with `@import "tailwindcss";` and an empty `@theme { }`.
- Update PostCSS / Next.js config so Tailwind compiles. Keep MUI untouched; the two coexist.
- Verify: nothing visible changes; build succeeds; bundle size diff documented.

**Phase 2 — Token foundation (1 session)**
- Create `apps/blog/design-system/tokens/{color,space,typography,radius,shadow,motion}.tokens.json` in DTCG format. Seed values by reading the current MUI theme in `pages/_app.js` and translating.
- Install Style Dictionary v4. Add `apps/blog/design-system/sd.config.mjs` with a CSS-variables platform that writes into the `@theme` block of `tailwind.css`.
- Add `npm run tokens` to `apps/blog/package.json`.
- Commit the *generated* CSS so the build remains reproducible without running Style Dictionary.

**Phase 3 — Stand up the `/design-system` route + AGENTS.md (1 session)**
- Add `pages/design-system/index.js` with a noindex meta and a list of components.
- Write `apps/blog/design-system/AGENTS.md` and `apps/blog/design-system/CLAUDE.md`.
- Add `/llms.txt` and `/llms-full.txt` at the site root (point llms.txt at the design-system docs + the top 5 most-linked posts).

**Phase 4 — First shadcn component (1 session)**
- `npx shadcn init` in `apps/blog/`. Configure `components.json` to point at `components/ui/` and to use your token variables.
- `npx shadcn add button` — your first owned component.
- Convert one MUI `<Button>` call site as a pilot; verify visually with Playwright MCP.

**Phase 5 — Replace MUI page-by-page (3–6 sessions)**
- For each page in `pages/`: identify MUI usages, swap for shadcn/Radix equivalents, verify screenshots, open PR. Use the `/ds-replace-mui` slash command.
- Components in priority order: `<Typography>` → `<Prose>` primitive; layout (`<Box>`, `<Container>`) → Tailwind utilities; navigation; `<Card>` → `<PostCard>`; tag chips → `<TagPill>`.

**Phase 6 — Add the verification rails (1 session)**
- Write `bin/verify-design-system.sh`.
- Add `@axe-core/playwright`; write 3–5 Playwright tests that load `/design-system/*` and assert (a) `toHaveScreenshot()` matches, (b) axe finds zero serious/critical issues.
- Add the PostToolUse Biome hook.
- Add the `/design-token`, `/ds-add`, `/ds-replace-mui` skills.

**Phase 7 — Wire the shadcn MCP server (1 session)**
- `claude mcp add` for the shadcn MCP server (or `claude mcp add-json` with the official config).
- Test by asking Claude in a session: "list available shadcn components" — it should answer via MCP, not by guessing.

**Phase 8 — Optional: Figma Dev Mode MCP (only if you start designing in Figma)**
- `claude plugin install figma@claude-plugins-official`.
- This unlocks the `/design-token` flow from Figma frames. Skip if you don't use Figma.

**Phase 9 — Remove MUI (1 session, last)**
- `npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled`.
- Delete `theme.js` and the MUI theme provider from `_app.js`.
- Final verification run.

At the end you have: a token-driven, shadcn-based, agent-friendly design system that lives entirely in `apps/blog/`, with zero new fancy infrastructure beyond Tailwind v4 + Style Dictionary + a few `.skill` files.

---

## Recommendations (prioritized)

1. **Start with Phase 1–2 this week.** Tailwind v4 alongside MUI + DTCG tokens via Style Dictionary is the highest-leverage move. Everything else flows from a real token source of truth.
2. **Do not adopt Storybook.** Use the `/design-system` Next.js route. Revisit only if you publish a public registry or take on co-authors.
3. **Write `apps/blog/design-system/AGENTS.md` before writing any component.** It's the agent's instruction manual. Mirror it from Ruler so `CLAUDE.md`, `.cursor/rules/`, and `AGENTS.md` stay aligned.
4. **Make the verification script (`bin/verify-design-system.sh`) a hard gate** — Pai/Publisher PRs that fail it auto-close. This is what lets you stay out of the loop.
5. **Use shadcn/ui with the Radix primitive layer, not React Aria.** React Aria is overkill for a blog; Radix is the path of least resistance and is what Claude has seen the most of in training.
6. **Stay on JavaScript for now.** A TS migration is a separate project; don't conflate it with the design-system work. Reconsider once MUI is gone.

**Benchmarks that should change the recommendations:**

- If you start adding 30+ components or open up the blog as a multi-author publication, **adopt Storybook** — at that scale (and especially post-Storybook-9's slimmer install footprint) its docs/discovery value pays for the maintenance tax.
- If you start collaborating with a designer in Figma, **wire up the Figma Dev Mode MCP** and adopt Tokens Studio as the upstream token authoring tool.
- If a Playwright + axe loop ever exceeds ~30 components or you find yourself eyeballing diffs more than once a week, **upgrade to Chromatic** for its review UI.
- If you ever want to publish your tokens or components for other developers/agents to consume, **publish a shadcn-compatible registry** (it's just a `registry.json` plus per-component JSON files at a public URL — the same `npx shadcn add @kylep/post-card` pattern shadcn CLI 3.0 enables).

---

## Caveats

- **The design tokens spec is stable but young.** DTCG 2025.10 is the *first* stable version (October 28, 2025). Style Dictionary v4 has DTCG support but its own docs note that "the latest format 2025.10 does not have full support yet in Style Dictionary; this is a work in progress in v5." Expect minor breaking changes if you adopt bleeding-edge token features.
- **shadcn/ui depends on you owning the maintenance.** The "no upgrade path" benefit is also the cost: if Radix ships a fix, you have to re-copy or hand-patch the component. For ~12 components this is fine; for 200 it is a serious tax.
- **The `llms.txt` standard is voluntary.** Google, Anthropic, and OpenAI have not committed to honoring it as crawler instructions. Treat it as documentation for *your own* agents, not as an SEO/AEO lever.
- **Visual regression is noisy.** Anti-aliasing, OS font rendering, and emoji differences can cause false-positive diffs across machines. Always run Playwright snapshots in a containerized CI environment (your existing Docker-based Cloud Build is a good substrate) and configure `maxDiffPixels` / `maxDiffPixelRatio` thresholds — strict pixel-perfect comparison without tolerance is widely cited as the leading cause of teams abandoning visual testing.
- **MUI and Tailwind coexisting will temporarily inflate the bundle.** That's the cost of an additive migration. Phase 9 (uninstall MUI) recovers it.
- **The Figma MCP requires a Dev or Full seat** on a paid Figma plan for sustained use; the Starter plan caps at 6 tool calls per month per the Figma MCP documentation. Skip it unless you actually use Figma.
- **AGENTS.md and CLAUDE.md are not perfectly redundant.** Where they conflict, Claude Code prefers `CLAUDE.md`. Author once in Ruler; let Ruler resolve the precedence.
- **The Storybook recommendation is intentionally contrarian.** Most "modern Next.js blog" guides recommend Storybook reflexively. For a solo blog the cost/benefit math doesn't work out, and Claude Code can read a `/design-system` route just as easily as it can read a Storybook docs page — arguably more easily, since it's just Next.js JSX.