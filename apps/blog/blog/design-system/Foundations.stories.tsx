import type { Meta, StoryObj } from '@storybook/nextjs';

// Foundations: renders the Terminal token system so the palette, type, and
// radii are documented and visually testable. Toggle the toolbar theme to
// see the dark<->light token swap.

const SEMANTIC: [string, string][] = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['raised', 'bg-raised'],
  ['border', 'bg-border'],
  ['default', 'bg-default'],
  ['muted', 'bg-muted'],
  ['accent', 'bg-accent'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['success', 'bg-success'],
];

const TYPE: [string, number][] = [
  ['xs', 12],
  ['sm', 14],
  ['base', 16],
  ['lg', 18],
  ['xl', 20],
  ['2xl', 24],
  ['3xl', 30],
  ['4xl', 36],
];

const RADII: [string, string][] = [
  ['sm (2px)', 'var(--radius-sm)'],
  ['md (4px)', 'var(--radius-md)'],
  ['lg (8px)', 'var(--radius-lg)'],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 className="font-mono text-accent" style={{ fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Foundations() {
  return (
    <div className="font-sans text-default" style={{ maxWidth: 900 }}>
      <h1 className="font-mono text-default" style={{ fontSize: 30, fontWeight: 600, marginBottom: 4 }}>
        Terminal — Foundations
      </h1>
      <p className="text-muted" style={{ marginBottom: 28 }}>
        Token-driven. Every value below is a semantic token; dark/light is a pure swap.
      </p>

      <Section title="SEMANTIC COLORS">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {SEMANTIC.map(([name, cls]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div className={`${cls} border border-border rounded-md`} style={{ height: 48 }} />
              <span className="text-subtle font-mono" style={{ fontSize: 11 }}>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="TYPE SCALE (sans body / mono headings)">
        {TYPE.map(([name, px]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 6 }}>
            <span className="text-subtle font-mono" style={{ fontSize: 11, width: 48 }}>{name}</span>
            <span style={{ fontSize: px }}>The quick brown fox — kyle.pericak.com</span>
          </div>
        ))}
      </Section>

      <Section title="RADII">
        <div style={{ display: 'flex', gap: 16 }}>
          {RADII.map(([name, v]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div className="bg-surface border border-border" style={{ height: 56, width: 80, borderRadius: v }} />
              <span className="text-subtle font-mono" style={{ fontSize: 11 }}>{name}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const meta: Meta<typeof Foundations> = {
  title: 'Design System/Foundations',
  component: Foundations,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Foundations>;

export const Tokens: Story = {};
