# Design System — Agent Guide

How to work on the blog design system (PER-135). Visual direction is
**Terminal** (dark-default, developer-native).

## Where things live

- **Tokens** — `design-system/tokens.css`: the single source of truth
  (Tailwind v4 `@theme` + `.prose-ds`). Dark values in `:root`, light in
  `[data-theme="light"]`.
- **Owned UI** — `components/ui/*.tsx`: shadcn-style (Radix + cva + `cn`).
- **Layout primitives** — `components/primitives/*.tsx`: Container, Stack,
  Cluster, Grid, Prose.
- **Blog components** — `components/*.tsx`.
- **Stories** — colocated `*.stories.tsx`; Storybook is the catalogue.
- **Preview** — `pages/design-system` is a throwaway; Storybook is canonical.

## Rules

- **No raw hex / raw px** (except `0`/`1px`) in component code — use token
  utilities (`bg-canvas`, `text-default`, `text-accent`, `border-border`,
  …). Enforced by `scripts/check-no-raw-hex.mjs`.
- New design-system code is **TypeScript** (`.tsx`); legacy pages stay `.js`.
- **Preflight is omitted** while MUI coexists — give native elements an
  explicit bg/border/appearance reset in the component (see `button.tsx`).
  Preflight is enabled in the MUI-removal task (TASK-014).
- Fixed stack: Next 15 Pages Router static export, React 19, Tailwind v4,
  Radix + shadcn-owned components, Storybook 10 **(webpack — `nextjs-vite`
  is unsupported because `next.config.js` has a custom webpack config)**.
  No App Router / SSR / rebrand.

## Add a component

1. `npx shadcn add <name>` (or author under `components/ui`), then
   retokenize: replace raw palette classes (`bg-blue-500`) with token
   classes (`bg-accent`).
2. Add a `*.stories.tsx`.
3. Run `apps/blog/bin/verify-design-system.sh` — must exit 0.

## Change a token

Edit `design-system/tokens.css` only. Every component follows automatically
(and both themes, via the `:root` / `[data-theme="light"]` swap).

## Remove an MUI component

1. `rg "@mui" apps/blog/blog --files-with-matches` to find usages.
2. Replace one file at a time; verify with the gate + Playwright screenshots.
3. Remove the MUI/Emotion/styled-components deps only once
   `rg "@mui|@emotion|styled-components" apps/blog/blog` returns nothing.
