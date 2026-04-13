import { log } from "./logger";

export const DEFAULT_COLORIZE_PROMPT =
  "[Supported colour codes - use sparingly - wrap key words in {X}...{/X} tags: r=numbers, o=propper noun people names, t=propper noun place names, b=rare/magic items]";

export async function colorizeResponse(
  text: string,
  endpoint: string,
  customPrompt?: string,
): Promise<string> {
  if (!text || text.length < 20) return text;
  if (text.includes("⚠️")) return text;
  if (text.length > 3000) {
    log.info("colorize: skipping, response too long for second-pass");
    return text;
  }

  log.info(`colorize: sending ${text.length} chars for annotation`);

  try {
    const res = await fetch(
      `${endpoint.replace(/\/+$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: customPrompt || DEFAULT_COLORIZE_PROMPT },
            { role: "user", content: text },
          ],
          max_tokens: Math.ceil(text.length / 3) + 50,
          temperature: 0.1,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      },
    );
    if (!res.ok) {
      log.warn(`colorize: server returned ${res.status}, using plain text`);
      return text;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const result = json.choices?.[0]?.message?.content?.trim();
    if (!result) return text;

    // Sanity check: if the colorized version is wildly different in length
    // (model rewrote instead of annotating), discard it.
    const plainResult = result.replace(/\{[a-z]\}|\{\/[a-z]\}/g, "");
    const ratio = plainResult.length / text.length;
    if (ratio < 0.5 || ratio > 2.0) {
      log.warn(`colorize: output length ratio ${ratio.toFixed(2)}, discarding`);
      return text;
    }

    log.info(`colorize: annotated with ${(result.match(/\{[a-z]\}/g) || []).length} color tags`);
    return result;
  } catch (err) {
    log.warn(`colorize: failed — ${(err as Error).message}`);
    return text;
  }
}
