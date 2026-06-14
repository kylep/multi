# Blog design system (apps/blog/blog/design-system/)

The blog uses a token-driven **Terminal** design system (PER-135). When
working on blog UI:

- All visual values come from `apps/blog/blog/design-system/tokens.css`
  (Tailwind v4 `@theme`). **Never write raw hex or raw px** (except 0/1px)
  in component code — use token utilities (`bg-canvas`, `text-default`,
  `text-accent`, `border-border`, …).
- New design-system components are **TypeScript** (`.tsx`) under
  `components/ui` (shadcn-owned, Radix + cva) and `components/primitives`.
  Legacy pages stay `.js` until migrated.
- Tailwind **preflight is omitted** during MUI coexistence; reset native
  elements per-component.
- Document/iterate components in Storybook (`npm run storybook`); it uses
  `@storybook/nextjs` (webpack), not vite.
- Verify any change with `apps/blog/bin/verify-design-system.sh` (exits 0).
- Full guide: `apps/blog/blog/design-system/README.md`.
