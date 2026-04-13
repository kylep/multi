import { log } from "./logger";

const MAX_LOOKBACK = 5;

export function isDuplicateResponse(
  newContent: string,
  history: { role: string; content: string }[],
  threshold = 0.85,
): boolean {
  if (!newContent || newContent.length < 20) return false;
  log.debug(`dedup: checking ${newContent.length} chars against last ${MAX_LOOKBACK} assistant msgs`);

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").trim();

  const newNorm = normalize(newContent);
  let checked = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role !== "assistant") continue;
    const prevNorm = normalize(history[i].content);
    if (!prevNorm) continue;

    if (newNorm === prevNorm) {
      log.info(`dedup: exact match with assistant msg at index ${i}`);
      return true;
    }

    const shorter = newNorm.length < prevNorm.length ? newNorm : prevNorm;
    const longer = newNorm.length < prevNorm.length ? prevNorm : newNorm;
    if (shorter.length / longer.length >= 0.5) {
      if (
        longer.startsWith(
          shorter.slice(0, Math.floor(shorter.length * threshold)),
        )
      ) {
        log.info(`dedup: prefix match with assistant msg at index ${i} (${(shorter.length / longer.length * 100).toFixed(0)}% overlap)`);
        return true;
      }

      let matches = 0;
      const len = Math.min(newNorm.length, prevNorm.length);
      for (let j = 0; j < len; j++) {
        if (newNorm[j] === prevNorm[j]) matches++;
      }
      const similarity = matches / Math.max(newNorm.length, prevNorm.length);
      if (similarity >= threshold) {
        log.info(`dedup: char-level match with assistant msg at index ${i} (${(similarity * 100).toFixed(0)}% similar)`);
        return true;
      }
    }

    checked++;
    if (checked >= MAX_LOOKBACK) break;
  }
  return false;
}
