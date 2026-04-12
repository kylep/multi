const FALLBACK_RATIO = 4;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / FALLBACK_RATIO);
}

export function estimateMessagesTokens(
  messages: { role: string; content: string }[],
): number {
  let total = 0;
  for (const m of messages) {
    total += estimateTokens(m.content) + 4;
  }
  return total + 2;
}

let _tokenizeEndpoint: string | null = null;

export function setTokenizeEndpoint(endpoint: string | null) {
  _tokenizeEndpoint = endpoint;
}

const tokenCache = new Map<string, number>();
const MAX_CACHE = 500;

export async function countTokens(text: string): Promise<number> {
  if (!text) return 0;
  if (!_tokenizeEndpoint) return estimateTokens(text);

  const cached = tokenCache.get(text);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `${_tokenizeEndpoint.replace(/\/+$/, "")}/tokenize`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text }),
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!res.ok) return estimateTokens(text);
    const json = (await res.json()) as { tokens?: number[] };
    const count = json.tokens?.length ?? estimateTokens(text);

    if (tokenCache.size >= MAX_CACHE) {
      const first = tokenCache.keys().next().value;
      if (first !== undefined) tokenCache.delete(first);
    }
    tokenCache.set(text, count);
    return count;
  } catch {
    return estimateTokens(text);
  }
}

export async function countMessagesTokens(
  messages: { role: string; content: string }[],
): Promise<number> {
  let total = 0;
  for (const m of messages) {
    total += (await countTokens(m.content)) + 4;
  }
  return total + 2;
}
