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

async function generateImageIfMissing(postPath) {
  const raw = fs.readFileSync(postPath, 'utf8');
  const { data, content } = matter(raw);
  const image = data.image;
  const thumb = data.thumbnail;
  if (!image) {
    return;
  }
  const imagePath = path.join(IMAGES_DIR, image);
  const thumbPath = thumb ? path.join(IMAGES_DIR, thumb) : null;
  if (!fs.existsSync(imagePath)) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn(`OPENAI_API_KEY not set, skipping generation for ${image}`);
    } else {
      try {
        console.log(`🎨 Generating image: ${image} for post "${data.title}"`);
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `Simple, minimalist icon for a blog post titled "${data.title}". Clean lines, lots of white space, no shadows or gradients. Flat design with transparent background.`;
        const result = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          size: '1024x1024',
          response_format: 'b64_json'
        });
        const b64 = result.data[0].b64_json;
        fs.writeFileSync(imagePath, Buffer.from(b64, 'base64'));
        console.log(`✅ Successfully generated image: ${image}`);
      } catch (err) {
        console.error(`❌ Failed to generate image ${image}:`, err.message);
      }
    }
  }
  if (thumbPath && !fs.existsSync(thumbPath) && fs.existsSync(imagePath)) {
    try {
      console.log(`🖼️  Creating thumbnail: ${thumb}`);
      await sharp(imagePath).resize(70, 70).toFile(thumbPath);
      console.log(`✅ Successfully created thumbnail: ${thumb}`);
    } catch (err) {
      console.error(`❌ Failed to create thumbnail ${thumb}:`, err.message);
    }
  }
}

async function run() {
  if (!fs.existsSync(POSTS_DIR)) {
    return;
  }
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    await generateImageIfMissing(path.join(POSTS_DIR, file));
  }
}

run();
