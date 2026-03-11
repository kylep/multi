---
title: "Local LLMs"
summary: "Running language models locally on Apple Silicon using llama.cpp. Covers model selection, performance benchmarks, and hardware constraints."
keywords:
  - local-llm
  - llama-cpp
  - apple-silicon
  - m2
  - quantization
  - inference
related:
  - wiki/ai-tools/opencode
  - local-llm-m2-air
scope: "Covers local LLM inference on macOS with Apple Silicon. Does not cover cloud-hosted models or fine-tuning."
last_verified: 2026-03-10
---


Local inference using llama.cpp on Apple Silicon hardware. Tested on
M2 Air (24GB unified memory).

## Tested Models

Models evaluated on M2 Air with 24GB RAM:

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| Qwen3 8B | 8B params | Fast | Good for coding tasks |
| DeepSeek-R1-Distill-Qwen-7B | 7B params | Fast | Reasoning-focused |
| Mistral Nemo 12B | 12B params | Medium | Balanced |
| Mistral Small 3.1 24B | 24B params | Slow | Best quality, memory-limited |

## Hardware Constraints

- 24GB unified memory limits model size to ~24B parameters (Q4 quantization)
- M2 Air GPU cores handle inference but thermal throttling occurs on long runs
- SSD swap enables larger models but with significant speed penalty

## Setup

llama.cpp with Metal acceleration. Models in GGUF format from
HuggingFace. Server mode exposes OpenAI-compatible API on localhost.

## Related Blog Posts

- [Local LLM Bakeoff on Apple M2 Air](/local-llm-m2-air.html):
  comparative benchmarks
