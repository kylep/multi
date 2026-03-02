import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../markdown/posts');
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

function getRequiredKey(model) {
  const envVar = MODEL_ENV_KEYS[model];
  const key = process.env[envVar];
  if (!key) {
    console.warn(`${envVar} not set, skipping image generation (IMAGE_MODEL=${model})`);
  }
  return key;
}

async function summarizeBlogContent(data, content) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `In max 10 words, describe a simple text-free icon that would represent this blog post: ${content}` }],
  });
  const summary = prompt.choices[0].message.content;
  console.log(`✨📝 Created summary of "${data.title}" → ${summary}`);
  return summary;
}

async function getPromptFromContent(data, content) {
  if (!data.imgprompt && !process.env.OPENAI_API_KEY) {
    console.warn(`No imgprompt and no OPENAI_API_KEY to generate one, skipping "${data.title}"`);
    return null;
  }
  const subject = data.imgprompt
    ? data.imgprompt
    : await summarizeBlogContent(data, content);
  const prompt = [
    `Subject: "${subject}".`,
    "Style: minimalist flat vector icon, clean lines, crisp edges, simplified geometric shapes.",
    "Colors: black, white, and one primary accent color only. No gradients.",
    "Composition: centered subject, generous negative space, wide landscape 16:9 aspect ratio. Keep subject within the center 60% of the frame.",
    "Background: pure solid white (#FFFFFF), filling the entire image.",
    "No text, no shadows, no textures, no transparency, no background elements.",
  ].join("\n");
  return prompt;
}


// --- Image generation providers ---

async function generateImageOpenAI(prompt, imageFullPath) {
  const apiKey = getRequiredKey('openai');
  if (!apiKey) return false;
  const openai = new OpenAI({ apiKey });
  console.log(`\n🎨 [OpenAI] Generating image: ${imageFullPath}`);
  const response = await openai.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    size: '1024x1024',
    quality: 'medium',
    output_format: 'png',
  });
  fs.writeFileSync(imageFullPath, Buffer.from(response.data[0].b64_json, 'base64'));
  return true;
}

async function generateImageGemini(prompt, imageFullPath) {
  const apiKey = getRequiredKey(IMAGE_MODEL);
  if (!apiKey) return false;
  const geminiModelId = GEMINI_MODEL_IDS[IMAGE_MODEL];
  console.log(`\n🎨 [Gemini/${IMAGE_MODEL}] Generating image: ${imageFullPath}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelId}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }
  const result = await response.json();
  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) {
    throw new Error('Gemini API returned no image data');
  }
  fs.writeFileSync(imageFullPath, Buffer.from(imagePart.inlineData.data, 'base64'));
  return true;
}

async function generateImageBFL(prompt, imageFullPath) {
  const apiKey = getRequiredKey('bfl');
  if (!apiKey) return false;
  console.log(`\n🎨 [BFL] Generating image: ${imageFullPath}`);
  const submitResponse = await fetch('https://api.bfl.ai/v1/flux-2-max', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': apiKey,
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 576,
    }),
  });
  if (!submitResponse.ok) {
    throw new Error(`BFL API submit error: ${submitResponse.status} ${await submitResponse.text()}`);
  }
  const { id: taskId } = await submitResponse.json();
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await fetch(`https://api.bfl.ai/v1/get_result?id=${taskId}`, {
      headers: { 'X-Key': apiKey },
    });
    if (!pollResponse.ok) continue;
    const result = await pollResponse.json();
    if (result.status === 'Ready') {
      const imgResponse = await fetch(result.result.sample);
      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      fs.writeFileSync(imageFullPath, buffer);
      return true;
    }
    if (result.status === 'Error') {
      throw new Error(`BFL generation failed: ${JSON.stringify(result)}`);
    }
  }
  throw new Error('BFL generation timed out after 2 minutes');
}

const IMAGE_GENERATORS = {
  openai: generateImageOpenAI,
  'gemini-2.0-flash': generateImageGemini,
  'gemini-2.5-flash': generateImageGemini,
  'gemini-3-pro': generateImageGemini,
  bfl: generateImageBFL,
};


// --- Main logic ---

const HEADER_HEIGHT = 500;
const HEADER_WIDTH = Math.round(HEADER_HEIGHT * (16 / 9)); // 533

async function cropToHeader(imageFullPath) {
  const tempPath = imageFullPath + '.tmp.png';
  await sharp(imageFullPath)
    .resize(HEADER_WIDTH, HEADER_HEIGHT, { fit: 'cover', position: 'attention' })
    .toFile(tempPath);
  fs.renameSync(tempPath, imageFullPath);
  console.log(`✂️  Cropped to ${HEADER_WIDTH}x${HEADER_HEIGHT}: ${imageFullPath}`);
}

async function generateNewImage(prompt, imageFullPath) {
  const generator = IMAGE_GENERATORS[IMAGE_MODEL];
  const success = await generator(prompt, imageFullPath);
  if (success) {
    await cropToHeader(imageFullPath);
  }
  return success;
}

async function resizeImageToThumbnail(imageFullPath, thumbFullPath) {
  console.log(`🖼️  Creating thumbnail: ${thumbFullPath}`);
  await sharp(imageFullPath).resize(70, 70).toFile(thumbFullPath);
}

async function saveMissingBlogImageAndThumbnail(postPath) {

  const raw = fs.readFileSync(postPath, 'utf8');
  const { data, content } = matter(raw);
  if (!data.image) {
    console.warn(`No image defined for ${data.title}, skipping image-generation`);
    return;
  }
  const imageFullPath = path.join(IMAGES_DIR, data.image);
  if (data.image && !fs.existsSync(imageFullPath)) {
    const prompt = await getPromptFromContent(data, content);
    if (!prompt) return;
    await generateNewImage(prompt, imageFullPath);
  }
  if (data.thumbnail && fs.existsSync(imageFullPath)) {
    const thumbFullPath = path.join(IMAGES_DIR, data.thumbnail);
    if (!fs.existsSync(thumbFullPath)) {
      await resizeImageToThumbnail(imageFullPath, thumbFullPath);
    }
  }
}

async function run() {
  if (!VALID_MODELS.includes(IMAGE_MODEL)) {
    console.error(`Invalid IMAGE_MODEL="${IMAGE_MODEL}". Must be one of: ${VALID_MODELS.join(', ')}`);
    process.exit(1);
  }
  console.log(`🔧 Image generation model: ${IMAGE_MODEL}`);
  if (!fs.existsSync(POSTS_DIR)) {
    return;
  }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    await saveMissingBlogImageAndThumbnail(path.join(POSTS_DIR, file));
  }
}

run();
