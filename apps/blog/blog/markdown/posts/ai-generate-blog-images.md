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

Making blog thumbnails and images is tedious. I don't want to fight with Gimp or whatever and I don't think anyone cares what the image really is. 

To make publishing easier, this site now checks for the image in each markdown post during the build to see if it already exists. If not, a prompt is built from the post title and content and sent to OpenAI's image API. The returned art is saved alongside the post and a 70×70 thumbnail is produced using Sharp. 

To make the image for this post it cost me about $0.12 CAD in OpenAI credits. Entertainingly that's probably more than what hosting this site will cost for like a week due to the setup I'm using to host this.

This automation was initially coded with Codex, but it didn't work quite right. I fixed it up with Cursor, then a bit manually to get it across the finish line. This was as much about playing with the AI dev tools as building the feature.

Check it out here [generate-images.mjs](https://github.com/kylep/multi/blob/main/apps/blog/blog/scripts/generate-images.mjs). 


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
    model: 'dall-e-2',
    prompt,
    size: '512x512'
  });
}
```

You can manually replace any AI-generated image and it won't be overwritten.

### Environment Setup

Set your OpenAI API key
```bash
export OPENAI_API_KEY="your-api-key-here"
```

Without this key the build just skips image generation with a warning.
