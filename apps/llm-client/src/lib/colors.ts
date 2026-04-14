export interface StyleDef {
  name: string;
  css: string;
  style: "color" | "format";
}

export const STYLE_CODES: Record<string, StyleDef> = {
  // Colors
  r: { name: "red", css: "color:#ef4444", style: "color" },
  g: { name: "grn", css: "color:#22c55e", style: "color" },
  b: { name: "blu", css: "color:#3b82f6", style: "color" },
  y: { name: "yel", css: "color:#eab308", style: "color" },
  m: { name: "mag", css: "color:#d946ef", style: "color" },
  c: { name: "cyn", css: "color:#06b6d4", style: "color" },
  o: { name: "org", css: "color:#f97316", style: "color" },
  p: { name: "pur", css: "color:#a855f7", style: "color" },
  k: { name: "pnk", css: "color:#f472b6", style: "color" },
  n: { name: "brn", css: "color:#a16207", style: "color" },
  l: { name: "lim", css: "color:#84cc16", style: "color" },
  t: { name: "tea", css: "color:#2dd4bf", style: "color" },
  s: { name: "slt", css: "color:#94a3b8", style: "color" },
  a: { name: "amb", css: "color:#f59e0b", style: "color" },
  w: { name: "wht", css: "color:#f8fafc;font-weight:600", style: "color" },
  // Formatting
  i: { name: "itl", css: "font-style:italic", style: "format" },
  d: { name: "dim", css: "opacity:0.5", style: "format" },
  u: { name: "uln", css: "text-decoration:underline", style: "format" },
};

const STYLE_KEYS = Object.keys(STYLE_CODES).join("");
const STYLE_RE = new RegExp(
  `\\{([${STYLE_KEYS}])\\}(.*?)\\{/\\1\\}`,
  "gs",
);

export function processColors(content: string): string {
  return content.replace(
    STYLE_RE,
    (_, code: string, text: string) => {
      const def = STYLE_CODES[code];
      if (!def) return text;
      return `<span style="${def.css}">${text}</span>`;
    },
  );
}

// 188 tokens. Emphasizes restraint with correct vs wrong examples.
export const COLOR_PROMPT = `[COLOR]
Most text must be plain. Color only 1-2 words per response, often none. Response length is unaffected — write fully.
Wrap: {X}word{/X}

r=damage-numbers-only g=common-item b=rare/magic-item o=person-name t=place-name

CORRECT — notice how little color is used:
You enter the tavern. {o}Old Meg{/o} slides you a drink and warns about the crypt.

WRONG — too much color:
{o}You{/o} enter the {t}tavern{/t}. {o}Old Meg{/o} slides you a {g}drink{/g} and {i}warns{/i} about the {t}crypt{/t}.

Only color proper nouns and specific item names. Never color verbs, adjectives, common nouns like stone/campfire/smoke, or descriptions. This limit applies to color usage only — write responses as long as needed.`;
