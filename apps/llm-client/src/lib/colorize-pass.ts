import { log } from "./logger";
import { apiHeaders } from "./api-headers";
import { applyColorTags, type ColorConfig, type ColorMatch } from "./colors";

const CATEGORIZE_SYSTEM =
  "List any words or exact phrases from the text that match this category: {category}. One per line. If none match, reply NONE.";

/**
 * Categorize-then-replace colorization.
 * For each enabled color, asks the model to list matching phrases,
 * then programmatically wraps them with color tags.
 */
export async function colorizeResponse(
  text: string,
  endpoint: string,
  colorColors: Record<string, ColorConfig>,
  signal: AbortSignal,
): Promise<string> {
  if (!text || text.length < 20) return text;
  if (text.includes("⚠️")) return text;

  const enabled = Object.entries(colorColors).filter(
    ([, cfg]) => cfg.enabled && cfg.category.trim(),
  );
  if (enabled.length === 0) return text;

  log.info(`colorize: ${enabled.length} colors enabled, ${text.length} chars`);

  const url = `${endpoint.replace(/\/+$/, "")}/v1/chat/completions`;
  const matches: ColorMatch[] = [];

  for (const [code, cfg] of enabled) {
    if (signal.aborted) {
      log.info("colorize: aborted before querying color " + code);
      break;
    }

    const systemPrompt = CATEGORIZE_SYSTEM.replace("{category}", cfg.category);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          max_tokens: 200,
          temperature: 0,
          stream: false,
        }),
        signal,
      });

      if (!res.ok) {
        log.warn(`colorize(${code}): server returned ${res.status}`);
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim() ?? "";

      log.exchange(`exchange:colorize-${code}`, {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        response: content,
        endpoint,
        category: cfg.category,
      });

      if (!content || content.toUpperCase() === "NONE") continue;

      const phrases = content
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0 && line.toUpperCase() !== "NONE");

      if (phrases.length > 0) {
        matches.push({ code, phrases });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        log.info(`colorize(${code}): aborted`);
        break;
      }
      log.warn(`colorize(${code}): ${(err as Error).message}`);
    }
  }

  if (matches.length === 0) return text;

  return applyColorTags(text, matches);
}
