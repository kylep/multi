---
title: "AI Image Generator Bakeoff"
summary: Comparing GPT Image 1.5, Nano Banana, and Flux 2 Max for blog image generation
slug: ai-image-gen-bakeoff
category: ai
tags: AI, Images, OpenAI, Flux, Nano Banana
date: 2026-02-21
modified: 2026-02-24
status: published
image: ai-image-gen-bakeoff.png
thumbnail: ai-image-gen-bakeoff-thumb.png
imgprompt: A cute robot wearing a short chefs hat and holding a paint brush
keywords:
  - ai image generator comparison
  - gpt image vs gemini vs flux
  - best ai image generation api
  - dall-e alternative 2026
  - ai image generation cost comparison
---

I wrote about this blog's [automated image generation](/ai-generate-blog-images.html) previously. The short version: `generate-images.mjs` runs before each build, finds posts with missing images, builds a prompt from the `imgprompt` front matter field (or has `gpt-4o-mini` summarize the post), then calls DALL-E 3 to produce a 1024x1024 image.

It works, but DALL-E 3 is frustrating. It ignores prompt details, can't make a white background to save its life, and the results look more "AI art" than "clean icon." Time to see what else is out there.


*Lesson Learned*: Don't let Cursor/Claude look online to find the most recent model versions. It got it wrong twice. I had to manually go back and update it after noticing that Gemini's 2.0-flash was not the newer Nano Banana (2.5, 3).


# Top Models Today

This space moves fast. As of February 2026, these are the top 3 image generation models on the [LM Arena text-to-image leaderboard](https://arena.ai/leaderboard/text-to-image) that have public APIs. These rankings are based on blind human preference voting and will almost certainly be different by the time you read this.

**ELO Scores:** ELO is a rating system where users are shown two AI-generated images side by side (without knowing which model made which) and pick the one they prefer. Wins and losses shift each model's score, so a higher ELO means the model's images are consistently preferred by real people.


| Model | Provider | Released | ELO | Notes |
|-------|----------|----------|-----|-------|
| **GPT Image 1.5** | OpenAI | December 2025 | 1248 | 4x faster than GPT Image 1. Token-based pricing, 20% cheaper than its predecessor. |
| **Nano Banana Pro** | Google (Gemini 3 Pro Image) | November 2025 | 1237 | Native Gemini image gen. Strong multimodal integration. |
| **Flux 2 Max** | Black Forest Labs | November 2025 | 1169 | 32B parameter model. Megapixel-based pricing. BFL's highest quality tier. |

GPT Image 1.5 and Nano Banana Pro are close in quality. Flux 2 Max sits ~80 ELO points behind them but is the strongest non-Google non-OpenAI option available.

**What about open source?** Flux 2 Dev is open-weight and Stable Diffusion 3.5 is fully open source, but neither is practical for this use case. Running them on a MacBook Air M2 (8GB unified memory, passive cooling) means throttling after ~90 seconds, a max practical resolution of 512x512, and needing to close basically every other app first. The quality gap vs. the API models is real too. For a build-time script that needs to reliably produce clean images, cloud APIs win.


# Setup: GPT Image 1.5

This is the easiest since the blog already uses OpenAI.

1. **API Key**: Already set up. Same `OPENAI_API_KEY` used for DALL-E 3.
2. **Model change**: Update the `model` parameter from `dall-e-3` to `gpt-image-1.5` in the images API call.
3. **API differences**: GPT Image 1.5 supports both the Images API (`/v1/images/generations`) and the newer Responses API. The Images API is the closest drop-in replacement. Quality can be set to `low`, `medium`, `high`, or `auto`. It also supports streaming partial renders and up to 16 reference images for editing.

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


# Setup: Flux 2 Max

Black Forest Labs runs their own API platform.

1. **Create an account**: Register at [dashboard.bfl.ai](https://dashboard.bfl.ai) and confirm your email.
2. **Add credits**: Navigate to API → Credits and add funds via Stripe. Pricing is simple: 1 credit = $0.01 USD.
3. **Create an API key**: Go to API → Keys, click "Add Key", and copy it immediately (it's only shown once).
4. **Set the environment variable**:
   ```bash
   export BFL_API_KEY="your-key-here"
   ```
5. **API usage**: POST to `https://api.bfl.ai/v1/flux-2-max` with your prompt, width, and height. The API is async — you submit a task and poll for the result using the returned task ID.


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
| DALL-E 3 (prior) | ~$0.04 | Per image | Fixed price, single quality tier |
| GPT Image 1.5 | $0.009–$0.14 | Per token (output) | Varies by quality: low ~$0.009, medium ~$0.03, high ~$0.14. ~20% cheaper than GPT Image 1 |
| Nano Banana | ~$0.02 | Per image | Standard tier (Gemini 2.5 Flash). Pro tier is ~$0.10/image |
| Flux 2 Max | ~$0.07 | Per megapixel | Scales with resolution. 1024x1024 ≈ 1MP ≈ 7 credits |

The ambiguity here is mostly around GPT Image 1.5 — the token-based pricing means cost depends heavily on the quality setting and prompt length. For a fair comparison we'll use "medium" quality, which lands close to what we're paying for DALL-E 3 today. Flux 2 Max's megapixel pricing is predictable but gets more expensive at higher resolutions.


# Results

Each model was given the same prompt, built from `imgprompt: "A cute robot wearing a short chefs hat and holding a paint brush"`:

```text
Subject: "A cute robot wearing a short chefs hat and holding a paint brush".
Style: minimalist flat vector icon, clean lines, crisp edges, simplified geometric shapes.
Colors: black, white, and one primary accent color only. No gradients.
Composition: centered subject, generous negative space, wide landscape 16:9 aspect ratio.
Background: pure solid white (#FFFFFF), filling the entire image.
No text, no shadows, no textures, no transparency, no background elements.
```

All images were center-cropped to 533x300 (16:9) after generation.

## GPT Image 1.5 (OpenAI)

Model: `gpt-image-1.5`, size: 1024x1024, quality: medium. Estimated cost: ~$0.03.

![GPT Image 1.5 result](/images/ai-image-gen-bakeoff-openai.png)

## Gemini 2.0 Flash (Google)

Model: `gemini-2.0-flash-exp-image-generation`. Estimated cost: ~$0.02 (free tier may apply).

![Nano Banana 2.0 result](/images/ai-image-gen-bakeoff-gemini-2.0.png)

## Nano Banana (Gemini 2.5 Flash)

Model: `gemini-2.5-flash-image`. Estimated cost: ~$0.02.

![Nano Banana 2.5 Flash result](/images/ai-image-gen-bakeoff-gemini-2.5.png)

## Nano Banana Pro (Gemini 3 Pro)

Model: `gemini-3-pro-image-preview`. Estimated cost: ~$0.10.

![Nano Banana 3 Pro result](/images/ai-image-gen-bakeoff-gemini-3-pro.png)

## Flux 2 Max (BFL)

Model: `flux-2-max`, size: 1024x576. Estimated cost: ~$0.04 (~0.6MP at $0.07/MP).

![Flux 2 Max result](/images/ai-image-gen-bakeoff-flux.png)


# Conclusion

It's pretty close between OpenAI and Nano Banana 2.5. I'll likely switch back and forth between the two, but to pick a flat winner as default I'm going with OpenAI for now. 

OpenAI has that annoying same-y generic feel that lets you know it's AI art, and I don't love that, but it's also definitely more cute.

Nano Banana's ones are pretty original. I like 3-pro the most but not the price. 2.5-flash is fun, a bit cleaner than OpenAI's art, just kind of *busy*. I'll probably pick it when I'm aiming for cleaner images than cute ones.

Flux's was more artsy. It's just kind of... weird? It kept drawing unique stuff but just sort of unsettling.
