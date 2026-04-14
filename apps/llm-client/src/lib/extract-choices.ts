export interface Choice {
  number: number;
  text: string;
  raw: string;
}

export interface ExtractionResult {
  cleanedText: string;
  choices: Choice[];
}

const CHOICE_LINE = /^(\d+)[.)]\s+(.+)$/;
const MAX_CHOICES = 5;
const MIN_CHOICES = 2;
const MAX_ITEM_LEN = 200;

function stripFormatting(text: string): string {
  return text
    .replace(/\{[a-z]\}|\{\/[a-z]\}/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .trim();
}

export function extractChoices(content: string): ExtractionResult {
  if (!content) return { cleanedText: content, choices: [] };

  const lines = content.split("\n");

  // Walk backwards from the end to find the block of consecutive numbered items.
  let blockEnd = lines.length - 1;
  // Skip trailing blank lines.
  while (blockEnd >= 0 && !lines[blockEnd].trim()) blockEnd--;
  if (blockEnd < 0) return { cleanedText: content, choices: [] };

  const candidates: { index: number; num: number; text: string; raw: string }[] = [];
  for (let i = blockEnd; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) break;
    const match = line.match(CHOICE_LINE);
    if (!match) break;
    const num = parseInt(match[1], 10);
    const text = match[2].trim();
    if (text.length > MAX_ITEM_LEN) break;
    candidates.push({ index: i, num, text, raw: line });
  }

  candidates.reverse();

  if (candidates.length < MIN_CHOICES || candidates.length > MAX_CHOICES) {
    return { cleanedText: content, choices: [] };
  }

  // Verify sequential numbering starting from 1
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].num !== i + 1) {
      return { cleanedText: content, choices: [] };
    }
  }

  // Verify nothing meaningful follows the numbered block
  const afterBlock = lines
    .slice(blockEnd + 1)
    .join("")
    .trim();
  if (afterBlock.length > 0) {
    return { cleanedText: content, choices: [] };
  }

  const firstChoiceIndex = candidates[0].index;
  const cleanedLines = lines.slice(0, firstChoiceIndex);
  // Trim trailing blank lines from the cleaned text.
  while (
    cleanedLines.length > 0 &&
    !cleanedLines[cleanedLines.length - 1].trim()
  ) {
    cleanedLines.pop();
  }

  return {
    cleanedText: cleanedLines.join("\n"),
    choices: candidates.map((c) => ({
      number: c.num,
      text: stripFormatting(c.text),
      raw: c.raw,
    })),
  };
}
