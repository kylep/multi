---
title: "AI Image Generation"
summary: "Image generation tools: ComfyUI for local generation with character consistency, and cloud services (DALL-E, Flux, GPT Image) for blog images."
keywords:
  - image-generation
  - comfyui
  - dall-e
  - flux
  - stable-diffusion
  - ip-adapter
related:
  - ai-image-gen-bakeoff
  - oss-img-gen
  - ai-generate-blog-images
scope: "Covers image generation tools and workflows. Does not cover text-based AI tools."
last_verified: 2026-03-10
---

# AI Image Generation

Image generation for blog post headers and other visual content.
Both local (ComfyUI) and cloud-based (DALL-E, Flux) pipelines.

## ComfyUI (Local)

ComfyUI runs on macOS with MPS acceleration. Key workflow: IP-Adapter
for character consistency across images. Exposes an API for programmatic
generation.

- Platform: macOS M2
- Backend: PyTorch with MPS
- Key plugin: IP-Adapter for reference image conditioning
- API mode for automated batch generation

## Cloud Services

| Service | Strengths | Used For |
|---------|-----------|----------|
| GPT Image 1.5 | Text rendering, instruction following | Blog headers with text |
| Flux 2 Max | Photorealistic, fast | General illustrations |
| DALL-E 3 | Good prompt adherence | Automated blog images |

## Blog Image Pipeline

The blog build script (`scripts/generate-images.mjs`) checks for posts
with `imgprompt` frontmatter but no existing image file. It generates
images via API and saves them to `public/images/`.

## Related Blog Posts

- [AI Image Generator Bakeoff](/ai-image-gen-bakeoff.html): cloud service
  comparison
- [ComfyUI on M2](/oss-img-gen.html): local setup with IP-Adapter
- [Automating Blog Images](/ai-generate-blog-images.html): build pipeline
