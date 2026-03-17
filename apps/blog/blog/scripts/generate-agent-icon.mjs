#!/usr/bin/env node
/**
 * Generate Discord-ready profile icons for the agent team.
 *
 * Uses the same env vars and providers as generate-images.mjs.
 *
 * Usage:
 *   node scripts/generate-agent-icon.mjs <agent-name>
 *   IMAGE_MODEL=gemini-3-pro node scripts/generate-agent-icon.mjs journalist
 *
 * Env vars: OPENAI_API_KEY, GEMINI_API_KEY, BFL_API_KEY, IMAGE_MODEL
 * Output:   public/images/agent-<name>.png (512x512)
 */
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '../public/images');

const VALID_MODELS = ['openai', 'gemini', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3-pro', 'bfl'];
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'openai';

const MODEL_ENV_KEYS = {
  openai: 'OPENAI_API_KEY',
  'gemini': 'GEMINI_API_KEY',
  'gemini-2.0-flash': 'GEMINI_API_KEY',
  'gemini-2.5-flash': 'GEMINI_API_KEY',
  'gemini-3-pro': 'GEMINI_API_KEY',
  bfl: 'BFL_API_KEY',
};

const GEMINI_MODEL_IDS = {
  'gemini': 'gemini-3-pro-image-preview',
  'gemini-2.0-flash': 'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash': 'gemini-2.5-flash-image',
  'gemini-3-pro': 'gemini-3-pro-image-preview',
};

// -- Theme: Geometric Animal Totems --
// Each agent is a distinct animal, rendered as a minimalist geometric portrait.
// Shared style keeps icons visually cohesive as a team.
const AGENT_SUBJECTS = {
  journalist:       'an owl with round spectacles, holding a tiny rolled-up newspaper',
  publisher:        'a lion with a geometric mane, wearing a small crown',
  analyst:          'a fox with sharp angular features, peering through a magnifying glass',
  synthesizer:      'an octopus with geometric tentacles, each holding a different colored orb',
  researcher:       'a bloodhound with floppy ears, nose to the ground following a trail',
  reviewer:         'a hawk with piercing eyes, perched with a red pen in its talon',
  qa:               'a beaver with square teeth, building with tiny blocks',
  'security-auditor': 'a pangolin curled into a defensive ball, with a small shield emblem',
  'prd-writer':       'a bowerbird arranging colorful geometric objects into a precise pattern',
};

function buildPrompt(agentName) {
  const subject = AGENT_SUBJECTS[agentName];
  if (!subject) {
    console.error(`Unknown agent "${agentName}". Known agents: ${Object.keys(AGENT_SUBJECTS).join(', ')}`);
    process.exit(1);
  }
  return [
    `Subject: ${subject}.`,
    'Style: minimalist flat vector portrait, clean lines, crisp edges, simplified geometric shapes.',
    'Colors: dark charcoal background (#1a1a2e) with bright accent colors. No gradients.',
    'Composition: centered bust/portrait, square 1:1 aspect ratio, subject fills 70% of frame.',
    'The animal should look friendly and professional, like a team avatar.',
    'No text, no shadows, no textures, no transparency.',
  ].join('\n');
}

// --- Image generation (same providers as generate-images.mjs) ---

function getRequiredKey(model) {
  const envVar = MODEL_ENV_KEYS[model];
  const key = process.env[envVar];
  if (!key) {
    console.error(`${envVar} not set. Set it or choose a different IMAGE_MODEL.`);
    process.exit(1);
  }
  return key;
}

async function generateImageOpenAI(prompt, outputPath) {
  const apiKey = getRequiredKey('openai');
  const openai = new OpenAI({ apiKey });
  console.log('[OpenAI] Generating...');
  const response = await openai.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    size: '1024x1024',
    quality: 'medium',
    output_format: 'png',
  });
  fs.writeFileSync(outputPath, Buffer.from(response.data[0].b64_json, 'base64'));
}

async function generateImageGemini(prompt, outputPath) {
  const apiKey = getRequiredKey(IMAGE_MODEL);
  const geminiModelId = GEMINI_MODEL_IDS[IMAGE_MODEL];
  console.log(`[Gemini/${IMAGE_MODEL}] Generating...`);
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
}

async function generateImageBFL(prompt, outputPath) {
  const apiKey = getRequiredKey('bfl');
  console.log('[BFL] Generating...');
  const submitResponse = await fetch('https://api.bfl.ai/v1/flux-2-max', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Key': apiKey },
    body: JSON.stringify({ prompt, width: 1024, height: 1024 }),
  });
  if (!submitResponse.ok) throw new Error(`BFL submit error: ${submitResponse.status} ${await submitResponse.text()}`);
  const { id: taskId } = await submitResponse.json();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await fetch(`https://api.bfl.ai/v1/get_result?id=${taskId}`, { headers: { 'X-Key': apiKey } });
    if (!pollResponse.ok) continue;
    const result = await pollResponse.json();
    if (result.status === 'Ready') {
      const imgResponse = await fetch(result.result.sample);
      fs.writeFileSync(outputPath, Buffer.from(await imgResponse.arrayBuffer()));
      return;
    }
    if (result.status === 'Error') throw new Error(`BFL failed: ${JSON.stringify(result)}`);
  }
  throw new Error('BFL timed out');
}

const GENERATORS = {
  openai: generateImageOpenAI,
  'gemini': generateImageGemini,
  'gemini-2.0-flash': generateImageGemini,
  'gemini-2.5-flash': generateImageGemini,
  'gemini-3-pro': generateImageGemini,
  bfl: generateImageBFL,
};

// --- Main ---

async function run() {
  const agentName = process.argv[2];
  if (!agentName) {
    console.error('Usage: node scripts/generate-agent-icon.mjs <agent-name>');
    console.error(`Agents: ${Object.keys(AGENT_SUBJECTS).join(', ')}`);
    process.exit(1);
  }
  if (!VALID_MODELS.includes(IMAGE_MODEL)) {
    console.error(`Invalid IMAGE_MODEL="${IMAGE_MODEL}". Must be one of: ${VALID_MODELS.join(', ')}`);
    process.exit(1);
  }

  const prompt = buildPrompt(agentName);
  const outputPath = path.join(IMAGES_DIR, `agent-${agentName}.png`);
  console.log(`\nAgent: ${agentName}`);
  console.log(`Model: ${IMAGE_MODEL}`);
  console.log(`Prompt:\n${prompt}\n`);

  const generator = GENERATORS[IMAGE_MODEL];
  await generator(prompt, outputPath);

  // Resize to 512x512 (Discord optimal avatar size)
  const tempPath = outputPath + '.tmp.png';
  await sharp(outputPath)
    .resize(512, 512, { fit: 'cover', position: 'attention' })
    .toFile(tempPath);
  fs.renameSync(tempPath, outputPath);

  console.log(`\nSaved: ${outputPath} (512x512)`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
