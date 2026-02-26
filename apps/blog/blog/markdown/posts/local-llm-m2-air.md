---
title: Local LLM Bakeoff on Apple M2 Air
summary: Running and comparing Qwen3 8B, DeepSeek-R1-Distill-Qwen-7B, and
  Mistral Nemo 12B locally using llama.cpp on Apple Silicon
slug: local-llm-bakeoff
category: ai
tags: AI, LLM, Apple Silicon, llama.cpp, Qwen, DeepSeek, Mistral
date: 2026-02-25
modified: 2026-02-25
status: published
image: local-llm-m2-air.png
thumbnail: local-llm-m2-air-thumb.png
imgprompt: A cute robot wearing a small chef's hat with an empty speech bubble
---

No API costs, no data leaving the machine, works offline. The catch is you're
limited to models that fit in RAM. At 16GB, you can run most 7-8B models at
good quality, or push into 12B at a lower quant.

This runs three models locally and compares them:

| Model | Params | Style | Q4_K_L Size |
|-------|--------|-------|-------------|
| Qwen3 8B | 8B | Instruction | 5.49 GB |
| DeepSeek-R1-Distill-Qwen-7B | 7B | Reasoning | 5.09 GB |
| Mistral Nemo Instruct 2407 | 12B | Instruction | 7.98 GB |

All three fit comfortably in 16GB with room for context. To browse other models,
[bartowski's HuggingFace page](https://huggingface.co/bartowski) is a good
starting point for well-tested GGUF quantizations.

**Params** (parameters) are the learned weights that make up the model. More
parameters generally means more capable, but also more RAM and slower inference.
7-8B is a practical sweet spot for 16GB machines.

**Quantization** is how a full-precision model gets compressed to fit on
consumer hardware. The original weights are 16 or 32-bit floats; quantization
rounds them down to fewer bits, trading a small amount of accuracy for a large
reduction in size and RAM usage. **Q4_K_L** specifically uses 4-bit weights
with the embedding and output layers kept at 8-bit to preserve quality. It's a
good default: much smaller than the lossless formats, better output than plain
Q4.

**Instruction** models are trained to follow directions and answer questions
directly. You ask, they answer. **Reasoning** models think out loud first,
working through the problem step by step before giving a final answer. Slower,
but more reliable on anything involving logic, math, or code.


# Hardware

- MacBook Air M2, 16GB unified memory
- macOS 26 (Tahoe)

No active cooling on the Air, so it'll throttle during long runs. Fine for
interactive use.


# Setup

These steps are shared across all three models.

## 1. Install llama.cpp

[llama.cpp](https://github.com/ggerganov/llama.cpp) is the runtime that loads
and runs GGUF model files. It handles the actual inference: tokenizing your
input, running it through the model weights, and streaming tokens back to you.
Think of it as the engine; the GGUF file is the model it runs. It also handles
Metal GPU offloading on Apple Silicon, which is what makes local inference fast
enough to be usable.

```bash
brew install llama.cpp
```

Gives you `llama-cli` for interactive chat and `llama-server` for an
OpenAI-compatible HTTP API.

## 2. Install the Hugging Face CLI

Installing Python tools with plain `pip` can stomp on system Python or conflict
with other packages. `pipx` puts each CLI tool in its own isolated environment
and adds it to your PATH. No venv to activate.

```bash
brew install pipx
pipx ensurepath
pipx install "huggingface_hub[cli]"
```

`pipx ensurepath` adds pipx's bin dir to your PATH. Restart your terminal after
running it.

Note: the installed command is `hf`, not `huggingface-cli`. The name changed in
v1.x.


# The Models

## Qwen3 8B

Alibaba's Qwen3 8B (released April 2025) is a dense instruction-tuned model
that also supports a thinking mode. By default it answers directly. You can
enable step-by-step reasoning with `/think` in the chat, or disable it with
`/no_think`.

```bash
hf download bartowski/Qwen_Qwen3-8B-GGUF Qwen_Qwen3-8B-Q4_K_L.gguf \
  --local-dir ~/models/qwen3-8b/
```

## DeepSeek-R1-Distill-Qwen-7B

Note: despite the name, there is no 8B Qwen-based DeepSeek distill. The 8B
distill uses Llama architecture. This one is 7B on Qwen architecture, released
January 2025.

DeepSeek distilled the chain-of-thought behaviour from their R1 reasoning model
into this smaller base. It always shows its thinking inside `<think>...</think>`
tags before the final answer. Verbose for simple questions, but useful for
anything involving logic or code.

```bash
hf download bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF \
  DeepSeek-R1-Distill-Qwen-7B-Q4_K_L.gguf \
  --local-dir ~/models/deepseek-r1-qwen-7b/
```

## Mistral Nemo Instruct 12B

Mistral's 12B model (released July 2024, jointly with NVIDIA). Bigger than the
other two, which shows in the quality of longer-form responses. At Q4_K_L it's
7.98 GB, leaving ~6GB free for macOS and context.

```bash
hf download bartowski/Mistral-Nemo-Instruct-2407-GGUF \
  Mistral-Nemo-Instruct-2407-Q4_K_L.gguf \
  --local-dir ~/models/mistral-nemo-12b/
```


# Running Them

The flags are the same for all three. Swap the `-m` path.

## Interactive chat

```bash
# Qwen3 8B
llama-cli \
  -m ~/models/qwen3-8b/Qwen_Qwen3-8B-Q4_K_L.gguf \
  -ngl 99 -c 8192

# DeepSeek-R1-Distill-Qwen-7B
llama-cli \
  -m ~/models/deepseek-r1-qwen-7b/DeepSeek-R1-Distill-Qwen-7B-Q4_K_L.gguf \
  -ngl 99 -c 8192

# Mistral Nemo 12B
llama-cli \
  -m ~/models/mistral-nemo-12b/Mistral-Nemo-Instruct-2407-Q4_K_L.gguf \
  -ngl 99 -c 8192
```

Flags:
- `-ngl 99`: offload all layers to Metal. Without this you're CPU-only and it's
  very slow. `--fit on` instead might be better, not sure.
- `-c 8192`: context window. Comfortable with 16GB for the smaller two. Fine
  for Mistral Nemo too given the headroom.

Interactive mode is auto-enabled when the model has a chat template, which all
three do. The old `--interactive-first` flag was removed in newer llama.cpp.

## OpenAI-compatible server

```bash
llama-server \
  -m ~/models/qwen3-8b/Qwen_Qwen3-8B-Q4_K_L.gguf \
  -ngl 99 -c 8192 --port 8080
```

Exposes `http://localhost:8080/v1/chat/completions`. Swap the model path for
whichever you want to serve.


# Conclusion

## Notes on Each

**Qwen3 8B**: Pretty fast. The thinking thing was a bit slow but not bad. It mostly
stuck to the instructions I gave it, like "max 3 paragraphs", and was reasonably
creative. It was also kind of bland and generic, for better or worse.

**DeepSeek-R1-Distill-Qwen-7B**: Also ok speed. It had a hard time following
instructions and sticking to the constraints that I'd tried to put in place, like that
same 3 paragraph limit. Overall I was pretty dissapointed given its reputation.

**Mistral Nemo 12B** The direct responses felt fast even though it ran at about half
the tokens per second, due to it not working in Reasoning mode. The writing style of
Nemo was by far the best, and it adhered much better to the prompts.



## Not enough tokens

The `8192` tokens they all use got to feeling pretty small, pretty fast. I tried to
push the continuity with a "Choose your own adventure" style conversation and it did
well until it just kind of stopped. I think I've seen claude crushing context down when
it gets near the limit, I wonder if there's a way to do that with this too, or get it
to do some sort of context shifting where it restarts with just the later context when
it runs low. Maybe I can run it in server mode and have a better client manage that,
but that seems like its own post.


## Winner

Nemo was the pretty clear winner. I'm not sure if that's because of the size of the
model or something else, but it was a significant step up in its ability to stick to
the prompt's instructions, and the writing style was better too.

