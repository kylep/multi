export async function generateTitle(
  messages: { role: string; content: string }[],
  endpoint: string,
): Promise<string | null> {
  if (messages.length < 2) return null;

  const excerpt = messages
    .slice(0, 6)
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  try {
    const res = await fetch(
      `${endpoint.replace(/\/+$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Generate a short title (max 6 words) for this conversation. " +
                "Reply with ONLY the title, no quotes, no punctuation at the end.",
            },
            { role: "user", content: excerpt },
          ],
          max_tokens: 20,
          temperature: 0.3,
          stream: false,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    return raw.replace(/^["']|["']$/g, "").slice(0, 60);
  } catch {
    return null;
  }
}
