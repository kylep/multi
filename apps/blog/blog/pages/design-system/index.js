import Head from 'next/head';

// Design-system scratch/preview page (TASK-003). Renders the Terminal token
// foundation in both themes so the palette + type can be verified visually
// and via Playwright. Noindex — not part of the public blog. This is a
// throwaway preview surface; Storybook (TASK-004) becomes the real catalogue.

const SWATCHES = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['raised', 'bg-raised'],
  ['border', 'bg-border'],
  ['default (text)', 'bg-default'],
  ['muted', 'bg-muted'],
  ['accent', 'bg-accent'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['success', 'bg-success'],
];

function ThemePanel({ theme }) {
  // theme === 'dark' relies on :root defaults; 'light' sets data-theme.
  return (
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="bg-canvas text-default border border-border rounded-lg p-6"
      style={{ flex: 1, minWidth: 320 }}
    >
      <p className="font-mono text-accent" style={{ fontSize: 12, letterSpacing: 1 }}>
        {theme.toUpperCase()} THEME
      </p>
      <h2 className="font-mono text-default" style={{ fontSize: 28, fontWeight: 600, margin: '8px 0' }}>
        kyle.pericak.com
      </h2>
      <p className="text-muted font-sans" style={{ maxWidth: 460, lineHeight: 1.6 }}>
        A token-driven Terminal design system. Body copy in the sans stack;
        headings and meta in mono. <span className="text-subtle">Subtle text.</span>{' '}
        <a className="text-link" href="/about.html">An inline link.</a>
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button
          type="button"
          className="bg-accent text-on-accent font-mono rounded-md"
          style={{ padding: '8px 14px', border: 'none', fontWeight: 600 }}
        >
          Primary
        </button>
        <button
          type="button"
          className="bg-surface text-default border border-border rounded-md font-mono"
          style={{ padding: '8px 14px' }}
        >
          Secondary
        </button>
      </div>

      <div
        className="bg-surface border border-border rounded-md font-mono"
        style={{ padding: 12, fontSize: 13 }}
      >
        <span className="text-success">$</span>{' '}
        <span className="text-default">npm run build</span>
        <br />
        <span className="text-muted">✓ 354 routes exported</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 20 }}>
        {SWATCHES.map(([name, cls]) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div className={`${cls} border border-border rounded-md`} style={{ height: 40 }} />
            <span className="text-subtle font-mono" style={{ fontSize: 10 }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DesignSystemPreview() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>Design System — Terminal tokens</title>
      </Head>
      <div className="bg-canvas" style={{ minHeight: '100vh', padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <ThemePanel theme="dark" />
          <ThemePanel theme="light" />
        </div>
      </div>
    </>
  );
}
