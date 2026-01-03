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


# How It Works
The image generation system is integrated into the build pipeline through the `package.json` build script:

```json
"build": "node scripts/generate-images.mjs && next build"
```

Before Next.js builds the static site, the `generate-images.mjs` script runs and:

1. **Scans all markdown files** in `markdown/posts/` for front matter
2. **Checks for missing images** referenced in the `image` and `thumbnail` fields
3. **Generates missing images** using OpenAI's DALL·E API if `OPENAI_API_KEY` is set
4. **Creates thumbnails** by resizing generated images to 70×70 pixels using Sharp

## The Generation Process

It's all pretty straightforward:

High level script logic: 
1. If there's no image defined, do nothing
1. If the image is defined in the front matter but doesn't exist, generate it.
1. If the image does exist but thumbnail doesn't, resize it and save that too.

Generating the image is also simple:
1. If the front matter has `imgprompt` in it, use that as the `summary` of the post.
1. If `imgprompt` is not present get `gpt-4o-mini'` to write a `summary` of the post.
1. Use `dall-e-3` to create the image.
1. Complain that it didn't look right, tweak the prompt, repeat until sufficiently frustrated, move on.

### Prompts

At time of writing (I won't keep this updated, check the code), I used these for the prompts:

Making the summary:
```javascript
async function summarizeBlogContent(data, content) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `In max 20 words, describe a simple logo image that would represent this blog post: ${content}` }],
  });
  const summary = prompt.choices[0].message.content;
  console.log(`✨📝 Created summary of "${data.title}" → ${summary}`);
  return summary;
}
```

Making the image

```javascript
async function getPromptFromContent(data, content) {
  const subject = data.imgprompt
    ? data.imgprompt
    : await summarizeBlogContent(data, content);
  const prompt = [
    "Simple minimalist flat vector icon.",
    `Subject: "${subject}".`,
    "Style: clean flat SVG-style vector, crisp edges, no gradients, no shadows, no textures, no lighting effects.",
    "Colors: limited palette, high contrast, modern minimal. Black, white, and primary colors only.",
    "Composition: centered subject with generous whitespace, 1:1 icon framing.",
    "Background: pure solid white (#FFFFFF) and completely filled. Nothing around the logo.",
    "No transparency. No checkerboard. No grid. No background elements.",
    "No text. No words. Just a simple image centered in white space."
  ].join("\n");
  return prompt;
}
```


### Environment Setup

Set your OpenAI API key
```bash
export OPENAI_API_KEY="your-api-key-here"
```

Without this key the build just skips image generation with a warning.


---

# Outstanding Problem

Dalle-3 is super frustrating when it comes to just making a white background. I spent a couple hours trying different prompts and it just refuses. Here's what the code came up with as a prompt for this page:

```text
Simple minimalist flat vector icon.
Subject: "A simple logo featuring a stylized laptop and a paintbrush, symbolizing effortless content creation and automated design.".                     
Style: clean flat SVG-style vector, crisp edges, no gradients, no shadows, no textures, no lighting effects.                                                                                                
Colors: limited palette, high contrast, modern minimal. Black, white, and primary colors only.   
Composition: centered subject with generous whitespace, 1:1 icon framing.                             
Background: pure solid white (#FFFFFF) and completely filled. Nothing around the logo.                
No transparency. No checkerboard. No grid. No background elements.                                    
No text. No words. Just a simple image centered in white space. 
```

It does not seem to care for my preference. If anyone has any tricks for this I'd love to hear about it.