# Design System — Phase 0 Inventory (TASK-001)

Map of the blog's current UI surface and every styling-system usage that
the design-system migration (PER-135) must replace. Verified from the repo
on 2026-06-13.

## Stack today

- **Next.js** 15.5.12, **Pages Router**, `output: 'export'` (fully static).
- **React** 18 (→ 19 in TASK-001B).
- **Styling:** Material UI 5 + Emotion is the live system (theme in
  `pages/_app.js`). **Tailwind v3.3 is installed but inert** (config globs
  `./src/**`, which doesn't exist). **styled-components 6 is installed but
  unused** — see below.
- **Markdown:** remark (+ gfm, toc, html) → HTML; **Prism** vendored as
  static `public/js/prism.js` + `public/css/prism.css`.
- **Lint:** ESLint (`next lint`, `eslint.ignoreDuringBuilds: true`). No Biome.
- **Tests:** Playwright (`playwright.config.ts`), specs in `tests/playwright/`.

## styled-components — dead dependency

`grep -rl styled-components --include="*.js" components pages` → **no hits.**
It is a pure `package.json` removal (plus `babel-plugin-styled-components`
in devDeps), no code migration required.

## Components (6) — all MUI-styled via `sx`

| Component | Lines | MUI usage | Replaced by |
|---|---|---|---|
| `components/IndexPage.js` | 161 | `@mui/material` | `<PostCard>` grid + `<Container>`/`<Grid>` |
| `components/SiteLayout.js` | 152 | AppBar, Toolbar, Box, CssBaseline, icons (Home, RssFeed) | `<SiteHeader>`/`<SiteFooter>`/`<NavMenu>` |
| `components/WikiPage.js` | 137 | `@mui/material` ×3 | `<PostLayout>` + `<Prose>` |
| `components/BlogPostContentPage.js` | 108 | `@mui/material` ×2 | `<PostLayout>` + `<Prose>` + `<CodeBlock>` |
| `components/BlogSidebar.js` | 81 | `@mui/material` ×3 | `<TableOfContents>` / sidebar primitives |
| `components/Pagination.js` | 62 | `@mui/material` ×2 | `<Pagination>` (rebuilt on tokens) |

## Pages (5)

| Page | Lines | MUI? | Notes |
|---|---|---|---|
| `pages/_app.js` | 104 | `ThemeProvider`, `createTheme`, `CssBaseline` | Holds the theme + 4 hardcoded hex colors; GA scripts. Becomes token CSS import + (no MUI provider). |
| `pages/_document.js` | 16 | no | Gets the no-flash dark-mode bootstrap script (TASK-007). |
| `pages/index.js` | 39 | no | Renders `IndexPage`. |
| `pages/about.js` | 105 | `@mui/material` ×1 | Static page; migrate with the rest. |
| `pages/[...route].js` | 160 | no (delegates) | Catch-all → `BlogPostContentPage` / `WikiPage`. |

## MUI modules in use (the removal checklist)

`@mui/material` (Box, Typography, Container, etc.), `@mui/material/styles`
(`ThemeProvider`, `createTheme`), `@mui/material/{Box,Typography,AppBar,
Toolbar,CssBaseline}`, `@mui/icons-material/{Home,RssFeed}`. Plus
`@emotion/react`, `@emotion/styled` (MUI's engine).

**Done = none of the above resolve** (`rg "@mui|@emotion|styled-components"
apps/blog/blog --files-with-matches` is empty) and they're gone from
`package.json` (TASK-014).

## Current theme values to tokenize (from `pages/_app.js`)

Seed primitives from these, then refresh per the chosen visual direction:

- `headerGrey #EEEEEE`, `headerBlue #337ab7`, `textGrey #333333`,
  `blogPostGrey #888888`.
- Font: `"Helvetica Neue", Helvetica, Arial, sans-serif`.
- Type ramp (current, ad hoc): h1 50→63px, blog title 35px, h3 21px,
  subtitle 14px, sidebar/footer "small". No spacing scale; no radius/shadow
  tokens; **no dark mode.**

## Takeaway

Small surface (~1,125 lines, 6 components, 5 pages, one real styling system
to remove + two dead deps). The migration is bounded and page-by-page. The
real design work is the **visual direction** — see `VISUAL-DIRECTIONS.md`.
