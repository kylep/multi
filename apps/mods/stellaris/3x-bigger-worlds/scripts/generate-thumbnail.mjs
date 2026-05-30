/**
 * Generate a thumbnail for the 3x Bigger Worlds mod via Gemini image gen.
 *
 * Writes a 1024x1024 PNG to mod/thumbnail-src.png. The companion
 * process-thumbnail.sh then re-encodes to canonical 512x512 8-bit RGB
 * mod/thumbnail.png and syncs the blog companion image. Split this way so
 * the regeneration step (model call, costs money / quota) and the format-
 * compliance step (free, deterministic) are independent.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/generate-thumbnail.mjs
 *   GEMINI_API_KEY=... IMAGE_MODEL=gemini-2.5-flash node scripts/generate-thumbnail.mjs
 *
 * Defaults to `gemini-2.5-flash-image` (stable preview tier) — adequate for
 * Workshop thumbnail quality and cheaper than the gpt-image / gemini-3-pro
 * tier used by apps/blog/blog/scripts/generate-agent-image.mjs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOD_DIR = path.join(__dirname, "..", "mod");
const OUT_PATH = path.join(MOD_DIR, "thumbnail-src.png");

const GEMINI_MODEL_IDS = {
  gemini: "gemini-3-pro-image-preview",
  "gemini-2.0-flash": "gemini-2.0-flash-exp-image-generation",
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

// Composed to match the mod's tagline: three giant habitable worlds, abundant
// resource deposits, Stellaris cover-art tone. No text — Steam Workshop
// thumbnails read better with the title pulled from the listing rather than
// baked into the image.
const prompt = [
  "Stellaris-style sci-fi cover art thumbnail for a mod called '3x Bigger Worlds'.",
  "Subject: three enormous, distinctly-coloured habitable planets arranged in a triangular composition, dominating the frame and visibly oversized compared to a small reference moon. Each planet shows a different climate band — one lush green continental, one ochre desert/savannah, one icy tundra with polar caps.",
  "Foreground / midground accents: faint glowing resource motes drifting between the planets in three colour-coded clusters (cyan for energy, amber for minerals, green for food) to telegraph 'abundant deposits'.",
  "Background: deep space with a soft cyan-to-magenta nebula gradient, scattered stars, one distant warm yellow star providing rim lighting on the planets.",
  "Style: painterly digital matte, high contrast, vibrant cinematic colour grading, in the visual register of Paradox Interactive's Stellaris key art.",
  "Composition: square format, centered, balanced, planets clearly the focal point. No text, no logos, no UI elements, no watermarks.",
].join(" ");

console.log(`Generating ${OUT_PATH}`);
console.log(`Model: ${modelId}`);
console.log(`Prompt: ${prompt}\n`);

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
