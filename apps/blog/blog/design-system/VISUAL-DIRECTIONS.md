# Visual Directions (TASK-001)

> **DECISION (2026-06-13): A — Terminal.** Dark-first, developer-native.
> Token build (TASK-003) seeds from A's palette: bg `#0B0E14`, surface
> `#11151F`, text `#E6E9EF`, accent cyan `#36E2C4`, amber `#F5A623`; mono
> display (Geist/JetBrains Mono) + sans body; tight grid, 2–4px radius,
> borders over shadows. Light mode is the secondary theme.


Three distinct directions for the redesign. All map onto the **same token
structure** (primitive → semantic), so the choice changes *values*, not
architecture — and switching later is cheap. Each replaces the current
2014-Bootstrap look (`#337ab7` blue, Helvetica, no dark mode).

> Note: these are specified directions (palette + type + spacing + refs),
> not rendered screenshots — real pixel mockups need the token + Storybook
> scaffolding (TASK-003/004), which don't exist yet. Once you pick, I build
> that direction's tokens first and show a live rendered sample early.

---

## A — "Terminal" — dark-first, developer-native

Confident, high-contrast, code-forward. Reads as deep technical
credibility — the strongest "I build serious things" signal to other
engineers.

- **Mode:** dark default, light optional.
- **Palette:** near-black bg `#0B0E14`, surface `#11151F`, text `#E6E9EF`,
  accent terminal-cyan `#36E2C4` (or electric green), amber `#F5A623`
  warnings, hairline borders `#222a38`.
- **Type:** mono display (JetBrains Mono / Geist Mono) for headings + meta,
  clean sans body (Geist Sans / Inter). Code feels native.
- **Shape/space:** tight, dense, grid-aligned; small radius (2–4px);
  borders over shadows.
- **Refs:** Vercel dark, GitHub dark-dimmed, Fly.io, Warp.
- **Trade-off:** most memorable + most "POC to impress experts," but the
  most custom (less shadcn-default reuse → slightly more to maintain).

## B — "Editorial" — light, warm, publication

A refined technical magazine. Content-first, calm, timeless; deliberately
*not* generic SaaS. Best pure reading experience.

- **Mode:** light default, dark variant.
- **Palette:** warm paper `#FAF8F3`, ink `#1A1A1A`, single rich accent
  (burnt sienna `#C2410C` **or** deep indigo `#4338CA`), muted secondary
  text `#6B6B6B`.
- **Type:** serif headings (Fraunces / Newsreader / Source Serif), humanist
  sans body (Inter / IBM Plex Sans); generous line-height + margins.
- **Shape/space:** airy, generous whitespace; moderate radius (6–8px); soft
  minimal shadows.
- **Refs:** Stripe blog, Increment, Ghost editorial.
- **Trade-off:** most differentiated from AI-slop SaaS; serif-editorial can
  read less "engineering" and more "writer."

## C — "Modern Product" — Geist/Linear, current SaaS *(recommended default)*

The crisp, neutral, contemporary look every full-stack dev recognizes as
current. Pairs natively with shadcn/Radix defaults → least custom work,
easiest AI maintenance (outcome #5), lowest risk.

- **Mode:** light + dark, both first-class.
- **Palette:** neutral zinc/slate greys, white/`#FAFAFA` surfaces, vivid
  single accent (electric blue `#2563EB` or violet `#7C3AED`), standard
  semantic colors.
- **Type:** Geist Sans (or Inter) throughout; tight modern scale; Geist Mono
  for code.
- **Shape/space:** balanced 4px grid; rounded (8–12px); subtle soft shadows
  + hairline borders.
- **Refs:** Linear, Vercel light, shadcn/ui default, Resend.
- **Trade-off:** safest and most "2026," but the most common — less unique
  than A or B.

---

## Recommendation

**C** as the base (lowest-risk, most maintainable, pairs with shadcn so the
agentic build is smoothest), optionally **grafting A's dark-terminal code
treatment** for `<CodeBlock>` so the blog still reads as a builder's site.
If the priority is "make experts remember it," go **A**. Pick **B** only if
you want it to feel like a publication more than a product.

Reply with **A**, **B**, **C**, or **C+A code blocks** (or your own blend)
and I'll build that direction's tokens and a live sample as TASK-003.
