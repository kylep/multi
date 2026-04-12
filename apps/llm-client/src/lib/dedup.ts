export function isDuplicateResponse(
  newContent: string,
  history: { role: string; content: string }[],
  threshold = 0.85,
): boolean {
  if (!newContent || newContent.length < 20) return false;

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").trim();

  const newNorm = normalize(newContent);

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role !== "assistant") continue;
    const prevNorm = normalize(history[i].content);
    if (!prevNorm) continue;

    if (newNorm === prevNorm) return true;

    const shorter = newNorm.length < prevNorm.length ? newNorm : prevNorm;
    const longer = newNorm.length < prevNorm.length ? prevNorm : newNorm;
    if (shorter.length / longer.length < 0.5) continue;

    if (longer.startsWith(shorter.slice(0, Math.floor(shorter.length * threshold)))) {
      return true;
    }

    let matches = 0;
    const len = Math.min(newNorm.length, prevNorm.length);
    for (let j = 0; j < len; j++) {
      if (newNorm[j] === prevNorm[j]) matches++;
    }
    if (matches / Math.max(newNorm.length, prevNorm.length) >= threshold) {
      return true;
    }

    break;
  }
  return false;
}
