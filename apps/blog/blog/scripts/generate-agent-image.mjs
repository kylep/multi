/**
 * One-off script to generate an agent avatar image.
 *
 * Usage:
 *   node scripts/generate-agent-image.mjs <output-filename> "<prompt>"
 *
 * Example:
 *   node scripts/generate-agent-image.mjs agent-design-doc-writer.png \
 *     "a nautilus shell built from geometric shapes"
 *
 * The image is saved to public/images/<output-filename>.
 * Style is hardcoded to match existing agent avatars: geometric flat design,
 * dark navy background, bold colors (teal, magenta, orange, yellow).
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '../public/images');

const [, , outputFile, subject] = process.argv;
if (!outputFile || !subject) {
  console.error('Usage: node generate-agent-image.mjs <filename> "<subject>"');
  process.exit(1);
}

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'openai';
const GEMINI_MODEL_IDS = {
  'gemini': 'gemini-3-pro-image-preview',
  'gemini-2.0-flash': 'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash': 'gemini-2.5-flash-image',
  'gemini-3-pro': 'gemini-3-pro-image-preview',
};

const prompt = [
  `Subject: ${subject}`,
  'Style: geometric flat design illustration.',
  'Colors: bold — teal, magenta, orange, yellow. No gradients.',
  'Background: dark navy (#1a1f2e), filling the entire image.',
  'Render the subject using only geometric shapes: triangles, circles, squares.',
  'Clean, icon-style. No text, no shadows, no textures.',
  'Square format, centered composition.',
].join('\n');

console.log(`Generating ${outputFile} using ${IMAGE_MODEL}...`);
console.log(`Prompt:\n${prompt}\n`);

const outputPath = path.join(IMAGES_DIR, outputFile);

if (IMAGE_MODEL === 'openai') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  const openai = new OpenAI({ apiKey });
  const response = await openai.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    size: '1024x1024',
    quality: 'medium',
    output_format: 'png',
  });
  fs.writeFileSync(outputPath, Buffer.from(response.data[0].b64_json, 'base64'));
} else if (IMAGE_MODEL in GEMINI_MODEL_IDS) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
  const geminiModelId = GEMINI_MODEL_IDS[IMAGE_MODEL];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelId}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  const result = await response.json();
  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) throw new Error('Gemini returned no image data');
  fs.writeFileSync(outputPath, Buffer.from(imagePart.inlineData.data, 'base64'));
} else {
  console.error(`Unknown IMAGE_MODEL: ${IMAGE_MODEL}`);
  process.exit(1);
}

const tmp = outputPath + '.tmp';
await sharp(outputPath).resize(512, 512).toFile(tmp);
fs.renameSync(tmp, outputPath);
console.log(`Saved to ${outputPath} (512x512)`);
