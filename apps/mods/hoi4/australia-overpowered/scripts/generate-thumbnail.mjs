/**
 * Generate a thumbnail for the Australia Overpowered mod via Gemini image gen.
 *
 * Writes a 1024x1024 PNG to mod/thumbnail-src.png. The companion
 * process-thumbnail.sh then re-encodes to canonical 512x512 8-bit RGB
 * mod/thumbnail.png and syncs the blog companion image. Split this way so
 * the regeneration step (model call, costs money / quota) and the format-
 * compliance step (free, deterministic) are independent.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/generate-thumbnail.mjs
 *   GEMINI_API_KEY=... IMAGE_MODEL=gemini-3-pro node scripts/generate-thumbnail.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOD_DIR = path.join(__dirname, "..", "mod");
const OUT_PATH = path.join(MOD_DIR, "thumbnail-src.png");

const GEMINI_MODEL_IDS = {
  "gemini-2.5-flash": "gemini-2.5-flash-image",
  "gemini-3-pro": "gemini-3-pro-image-preview",
};
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gemini-2.5-flash";
const modelId = GEMINI_MODEL_IDS[IMAGE_MODEL];
if (!modelId) {
  console.error(
    `Unknown IMAGE_MODEL: ${IMAGE_MODEL}. Valid: ${Object.keys(GEMINI_MODEL_IDS).join(", ")}`,
  );
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

// No text — Steam Workshop thumbnails read better with the title pulled from
// the listing rather than baked into the image.
const prompt = [
  "1940s WWII propaganda poster style cover art thumbnail for a Hearts of Iron IV mod called 'Australia Overpowered'.",
  "Subject: a colossal, heroic red kangaroo in an Australian Army slouch hat standing astride a stylised map of the Pacific Ocean, Australia glowing gold at its feet, with the islands of the Pacific — New Guinea, New Zealand, Hawaii, the Solomons — highlighted in the same gold.",
  "Midground: rows of factory smokestacks and shipyard cranes crowding the Australian coastline, battleships and bombers fanning out across the ocean.",
  "Background: a blazing sunrise with the Southern Cross constellation faintly visible in the upper sky, bold sunburst rays.",
  "Style: screen-printed poster look with limited palette of green, gold, navy and cream, halftone texture, high contrast, dramatic low-angle composition, in the visual register of Paradox Interactive's Hearts of Iron IV key art.",
  "Composition: square format, centered, kangaroo clearly the focal point. No text, no letters, no logos, no UI elements, no watermarks.",
].join(" ");

console.log(`Generating ${OUT_PATH}`);
console.log(`Model: ${modelId}`);

const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  }),
});

if (!response.ok) {
  console.error(`Gemini API error: ${response.status} ${response.statusText}`);
  console.error(await response.text());
  process.exit(1);
}

const result = await response.json();
const parts = result.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
if (!imagePart) {
  console.error("Gemini returned no image data. Full response:");
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

fs.writeFileSync(OUT_PATH, Buffer.from(imagePart.inlineData.data, "base64"));
const size = fs.statSync(OUT_PATH).size;
console.log(`Wrote ${OUT_PATH} (${size} bytes)`);
console.log("Next: scripts/process-thumbnail.sh");
