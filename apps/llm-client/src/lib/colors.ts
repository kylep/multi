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

/** Color codes only (no format codes like i/d/u). */
export const COLOR_KEYS = Object.entries(STYLE_CODES)
  .filter(([, v]) => v.style === "color")
  .map(([k]) => k);

export interface ColorConfig {
  enabled: boolean;
  category: string;
}

export const DEFAULT_COLOR_COLORS: Record<string, ColorConfig> = Object.fromEntries(
  COLOR_KEYS.map((k) => {
    if (k === "r") return [k, { enabled: true, category: "number" }];
    if (k === "b") return [k, { enabled: true, category: "special, important, or magic item" }];
    if (k === "o") return [k, { enabled: true, category: "Capitalized Proper Noun" }];
    return [k, { enabled: false, category: "" }];
  }),
);

const STYLE_KEYS = Object.keys(STYLE_CODES).join("");
const STYLE_RE = new RegExp(
  `\\{([${STYLE_KEYS}])\\}(.*?)\\{/\\1\\}`,
  "gs",
);

// HTML tags that rehype-raw should pass through. Everything else gets escaped
// so the browser doesn't warn about unknown elements like <player> or <name>.
const ALLOWED_HTML = new Set([
  "a", "abbr", "b", "blockquote", "br", "code", "dd", "del", "details",
  "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr",
  "i", "img", "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "rp",
  "rt", "ruby", "s", "samp", "small", "span", "strong", "sub", "summary",
  "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
  "var", "wbr",
]);

function escapeUnknownTags(html: string): string {
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s>\/])/g, (match, slash, tag, after) => {
    if (ALLOWED_HTML.has(tag.toLowerCase())) return match;
    return `&lt;${slash}${tag}${after}`;
  });
}

export function processColors(content: string): string {
  const colored = content.replace(
    STYLE_RE,
    (_, code: string, text: string) => {
      const def = STYLE_CODES[code];
      if (!def) return text;
      return `<span style="${def.css}">${text}</span>`;
    },
  );
  return escapeUnknownTags(colored);
}

export interface ColorMatch {
  code: string;
  phrases: string[];
}

/**
 * Programmatically wrap matched phrases with color tags.
 * Case-insensitive matching, longest phrases first to avoid partial overlaps.
 */
export function applyColorTags(text: string, matches: ColorMatch[]): string {
  // Collect all replacements, sorted longest-first to avoid partial matches
  const replacements: Array<{ phrase: string; code: string }> = [];
  for (const m of matches) {
    for (const phrase of m.phrases) {
      if (phrase.length > 0) {
        replacements.push({ phrase, code: m.code });
      }
    }
  }
  replacements.sort((a, b) => b.phrase.length - a.phrase.length);

  let result = text;
  for (const { phrase, code } of replacements) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const re = new RegExp(`(?!\\{[a-z]\\})\\b(${escaped})\\b(?!\\{/[a-z]\\})`, "gi");
    result = result.replace(re, `{${code}}$1{/${code}}`);
  }
  return result;
}
