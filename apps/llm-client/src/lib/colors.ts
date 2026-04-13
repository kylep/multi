export const COLOR_CODES: Record<string, { name: string; css: string }> = {
  r: { name: "red", css: "#ef4444" },
  g: { name: "green", css: "#22c55e" },
  b: { name: "blue", css: "#3b82f6" },
  y: { name: "yellow", css: "#eab308" },
  m: { name: "magenta", css: "#d946ef" },
  c: { name: "cyan", css: "#06b6d4" },
  o: { name: "orange", css: "#f97316" },
  w: { name: "bold", css: "#f8fafc" },
};

const COLOR_KEYS = Object.keys(COLOR_CODES).join("");
const COLOR_RE = new RegExp(
  `\\{([${COLOR_KEYS}])\\}(.*?)\\{/\\1\\}`,
  "gs",
);

export function processColors(content: string): string {
  return content.replace(
    COLOR_RE,
    (_, code: string, text: string) => {
      const c = COLOR_CODES[code];
      if (!c) return text;
      const style = code === "w"
        ? `color:${c.css};font-weight:600`
        : `color:${c.css}`;
      return `<span style="${style}">${text}</span>`;
    },
  );
}

export const COLOR_PROMPT =
  `[Colors for emphasis only — names, places, items, not adjectives. ` +
  `Codes: ${Object.entries(COLOR_CODES)
    .map(([k, v]) => `{${k}}${v.name}{/${k}}`)
    .join(" ")}. ` +
  `Use sparingly: 2-4 per response max. Never colour common words.]`;
