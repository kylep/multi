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
  const subject = data.imgprompt
    ? data.imgprompt
    : await summarizeBlogContent(data, content);
  const prompt = [
    "Simple minimalist flat vector icon. 3 shapes max.",
    "Style: clean flat SVG-style vector, crisp edges, no gradients, no shadows, no textures, no lighting effects.",
    "Colors: Black, white, and primary colors only. No other colors. ",
    "Composition: centered subject with generous whitespace, 1:1 icon framing. ",
    "Background: pure solid white (#FFFFFF) and completely filled. ONLY WHITE AROUND THE ICON. ",
    "No transparency. No checkerboard. No shadow. No grid. No background but white. ",
    "No text. No words. ",
    "Just a simple image centered in white space. ",
    `Subject: "${subject}". `,
    "ONLY WHITE SPACE AROUND THE ICON. NO GRID. NO BACKGROUND. NO SHADOW. ",
    "ONLY WHITE SPACE AROUND THE ICON. NO GRID. NO BACKGROUND. NO SHADOW. ",
    "...Please?"
  ].join("\n");
  return prompt;
}

async function generateNewImage(prompt, imageFullPath) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log(`\n🎨 Generating image: ${imageFullPath} with prompt:\n${prompt}`);
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    response_format: 'b64_json'
  });
  const imageBase64 = response.data[0].b64_json;
  fs.writeFileSync(imageFullPath, Buffer.from(imageBase64, 'base64'));
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
  // blog header image
  if (data.image && !fs.existsSync(imageFullPath)) {
    if (process.env.OPENAI_API_KEY) {
      const prompt = await getPromptFromContent(data, content);
      await generateNewImage(prompt, imageFullPath);
    } else {
      console.warn(`OPENAI_API_KEY not set, skipping ai generation for ${data.image}`);
    }
  }
  // thumbnail
  if (data.thumbnail && fs.existsSync(imageFullPath)) {
    const thumbFullPath = path.join(IMAGES_DIR, data.thumbnail);
    if (!fs.existsSync(thumbFullPath)) {
      await resizeImageToThumbnail(imageFullPath, thumbFullPath);
    }
  }
}

async function run() {
  if (!fs.existsSync(POSTS_DIR)) {
    return;
  }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    await saveMissingBlogImageAndThumbnail(path.join(POSTS_DIR, file));
  }
}

run();
