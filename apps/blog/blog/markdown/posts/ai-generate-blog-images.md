---
title: Automating Blog Images with OpenAI
summary: Using Codex and DALL·E to create blog title art on the fly
slug: ai-generated-blog-images
category: ai
tags: AI, OpenAI, Blog
date: 2026-01-01
modified: 2026-01-01
status: published
image: ai-generated-blog-images.png
thumbnail: ai-generated-blog-images-thumb.png
---

Keeping visual assets in sync with blog posts can be a chore. To make publishing easier, this site now checks each markdown post during the build. If an image or thumbnail is missing, a prompt is built from the post title and content and sent to OpenAI's image API. The returned art is saved alongside the post and a 70×70 thumbnail is produced.

This automation was coded with Codex and lives in a small script that runs before `npm run build`. You can read the full discussion and code on [GitHub issue #9](https://github.com/kylep/multi/issues/9).

## How It Works

The image generation system is integrated into the build pipeline through the `package.json` build script:

```json
"build": "node scripts/generate-images.mjs && next build"
```

Before Next.js builds the static site, the `generate-images.mjs` script runs and:

1. **Scans all markdown files** in `markdown/posts/` for front matter
2. **Checks for missing images** referenced in the `image` and `thumbnail` fields
3. **Generates missing images** using OpenAI's DALL·E API if `OPENAI_API_KEY` is set
4. **Creates thumbnails** by resizing generated images to 70×70 pixels using Sharp

### The Generation Process

For each blog post, the script:

```javascript
// Parse the markdown front matter
const { data, content } = matter(raw);
const image = data.image;
const thumb = data.thumbnail;

// Check if image file exists
const imagePath = path.join(IMAGES_DIR, image);
if (!fs.existsSync(imagePath)) {
  // Generate with OpenAI
  const prompt = `Simple, tasteful, low-detail icon for a blog post titled "${data.title}". Transparent background.`;
  const result = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '650x250'
  });
}
```

The system is designed to be **non-destructive** - it only generates images that don't already exist, so you can manually replace any AI-generated image and it won't be overwritten.

### Environment Setup

To enable image generation, set your OpenAI API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Without this key, the build continues normally but skips image generation with a warning. This makes the feature completely optional - the blog works fine with manually created images or no images at all.

### Error Handling

The script includes robust error handling:
- **Missing API key**: Warns and continues without generation
- **API failures**: Logs errors but doesn't break the build
- **Image processing errors**: Continues with original image if thumbnail creation fails

This ensures that a failed image generation never blocks publishing a blog post.

