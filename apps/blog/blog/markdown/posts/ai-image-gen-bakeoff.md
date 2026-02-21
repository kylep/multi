---
title: "AI Image Generator Bakeoff"
summary: Comparing GPT Image 1, Nano Banana, and Flux 2 Pro for blog image generation
slug: ai-image-gen-bakeoff
category: ai
tags: AI, Images, OpenAI, Flux, Nano Banana
date: 2026-02-21
modified: 2026-02-21
status: draft
image: ai-image-gen-bakeoff.png
thumbnail: ai-image-gen-bakeoff-thumb.png
imgprompt: A cute robot holding a paint brush
---

I wrote about this blog's [automated image generation](/blog/ai-generated-blog-images) previously. The short version: `generate-images.mjs` runs before each build, finds posts with missing images, builds a prompt from the `imgprompt` front matter field (or has `gpt-4o-mini` summarize the post), then calls DALL-E 3 to produce a 1024x1024 image.

It works, but DALL-E 3 is frustrating. It ignores prompt details, can't make a white background to save its life, and the results look more "AI art" than "clean icon." Time to see what else is out there.


# Top Models Today

There are three models worth testing here. Each has an API, reasonable pricing, and strong community reputation.

| Model | Provider | Released | Notes |
|-------|----------|----------|-------|
| **GPT Image 1** | OpenAI | April 2025 | ELO 1284 on LM Arena. Best overall prompt adherence. Token-based pricing. |
| **Nano Banana Pro** | Google (Gemini 3 Pro Image) | November 2025 | ELO 1268. Native Gemini image gen. Strong multimodal integration. |
| **Flux 2 Pro** | Black Forest Labs | November 2025 | ELO 1265. 32B parameter model. Megapixel-based pricing. Great photorealism. |

**What about open source?** Flux 2 Dev is open-weight and Stable Diffusion 3.5 is fully open source, but neither is practical for this use case. Running them on a MacBook Air M2 (8GB unified memory, passive cooling) means throttling after ~90 seconds, a max practical resolution of 512x512, and needing to close basically every other app first. The quality gap vs. the API models is real too. For a build-time script that needs to reliably produce clean images, cloud APIs win.


# Setup: GPT Image 1

This is the easiest since the blog already uses OpenAI.

1. **API Key**: Already set up. Same `OPENAI_API_KEY` used for DALL-E 3.
2. **Model change**: Update the `model` parameter from `dall-e-3` to `gpt-image-1` in the images API call.
3. **API differences**: GPT Image 1 supports both the Images API (`/v1/images/generations`) and the newer Responses API. The Images API is the closest drop-in replacement. The response format changes slightly — quality can now be set to `low`, `medium`, or `high`.

```bash
export OPENAI_API_KEY="sk-..."
```

If you don't already have a key, create one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).


# Setup: Nano Banana

Nano Banana is Google's image generation feature built on Gemini. You can access it through the official Google Gemini API.

1. **Get an API key**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new API key.
2. **Install the SDK**:
   ```bash
   npm install @google/genai
   ```
3. **Set the environment variable**:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   ```
4. **API usage**: Nano Banana image gen uses the Gemini API with `responseModalities: ["TEXT", "IMAGE"]`. The model name for the standard tier is `gemini-2.5-flash-preview-image` and for Pro it's `gemini-3-pro-image`.

Note: the API flow is different from OpenAI. You send a chat completion-style request with image output enabled, and the response includes inline image data.


# Setup: Flux 2 Pro

Black Forest Labs runs their own API platform.

1. **Create an account**: Register at [dashboard.bfl.ai](https://dashboard.bfl.ai) and confirm your email.
2. **Add credits**: Navigate to API → Credits and add funds via Stripe. Pricing is simple: 1 credit = $0.01 USD.
3. **Create an API key**: Go to API → Keys, click "Add Key", and copy it immediately (it's only shown once).
4. **Set the environment variable**:
   ```bash
   export BFL_API_KEY="your-key-here"
   ```
5. **API usage**: POST to `https://api.bfl.ai/v1/flux-2-pro` with your prompt, width, and height. The API is async — you submit a task and poll for the result using the returned task ID.


# Setup Verification

Once you've configured your API keys, you can verify everything is wired up correctly by running:

```bash
node apps/blog/blog/scripts/generate-images.mjs --verify
```

This will check that each configured API key is valid and can reach its respective service without actually generating any images. We'll implement this flag in a follow-up change.


# Cost

All prices are USD per image at 1024x1024.

| Model | Cost | Pricing Model | Notes |
|-------|------|---------------|-------|
| DALL-E 3 (current) | ~$0.04 | Per image | Fixed price, single quality tier |
| GPT Image 1 | $0.01–$0.17 | Per token (output) | Varies by quality: low ~$0.01, medium ~$0.04, high ~$0.17 |
| Nano Banana | ~$0.02 | Per image | Standard tier (Gemini 2.5 Flash). Pro tier is ~$0.10/image |
| Flux 2 Pro | ~$0.03 | Per megapixel | Scales with resolution. 1024x1024 ≈ 1MP ≈ 3 credits |

The ambiguity here is mostly around GPT Image 1 — the token-based pricing means cost depends heavily on the quality setting and prompt length. For a fair comparison we'll use "medium" quality, which lands close to what we're paying for DALL-E 3 today. Flux 2 Pro's megapixel pricing is predictable but gets more expensive at higher resolutions.


# Verdict

TBD — will run all three models against the same prompts and compare results in a follow-up post.
