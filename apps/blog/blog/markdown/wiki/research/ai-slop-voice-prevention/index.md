---
title: "AI Slop / Voice Prevention"
summary: "Three Deep Research reports on suppressing AI writing tells and matching a specific author voice, generated from the same prompt across ChatGPT, Gemini, and Claude."
keywords:
  - deep-research
  - ai-slop
  - voice-matching
  - writing-style
  - reviewer-agent
  - prompt-engineering
related:
  - wiki/research
scope: "Subject index for AI slop / voice prevention research. Links to three provider reports."
last_verified: 2026-03-15
---

Three Deep Research reports on suppressing AI writing tells and
matching a specific author voice. Used as inputs for the blog
reviewer agent.

## Prompt

> Research the perfect prompt to give Claude Opus 4.6 and Sonet so
> their writing style feels like a casual human. It should identify
> all of the notable tells. I'm not sure if a rule list (do not do
> x,y,x), best practice guide (try to do a,b,c), or something else
> is best. Research both the best way to prompt and the best content
> for the prompt, then derive your research into a prompt I can use
> as part of the definition of my Reviewer agent. It's going to be
> used for my blog posts on kyle.pericak.com (if you check if for
> style, posts before 2025 are entirely human, 2025 and later are
> AI-supplemented).

## Reports

- [ChatGPT Deep Research: AI Slop / Voice Prevention](/wiki/research/ai-slop-voice-prevention/chatgpt.html) —
  AI tell taxonomy (20 classes), prompting strategies for Claude
  4.6, author voice profiling, and ready-to-use reviewer agent
  prompts.
- [Gemini Deep Research: AI Slop / Voice Prevention](/wiki/research/ai-slop-voice-prevention/gemini.html) —
  Synthetic indicator taxonomy (lexical, syntactic, structural),
  prompt engineering strategy comparison, voice analysis, and
  reviewer agent prompt.
- [Claude Deep Research: AI Slop / Voice Prevention](/wiki/research/ai-slop-voice-prevention/claude.html) —
  Tiered AI tell taxonomy, hybrid prompt format research (Saxifrage
  experiment), voice profile analysis, and production-ready XML
  reviewer prompt with two-pass workflow.

---

## Cross-Source Synthesis

Compare and contrast of findings across all three reports. No outside
opinions added. Every point below is derived directly from the source
material.

### Shared Findings (present in 2+ sources)

- **Ban a common AI vocabulary list** — all three name nearly the same words: "delve," "tapestry," "landscape," "multifaceted," "nuanced," "robust," "seamless," "vibrant," "leverage," "embark," "unpack," "crucial," "comprehensive," "innovative" (all 3)
- **Reduce or eliminate em-dashes** — flagged as the single most recognizable punctuation tell of AI writing (all 3)
- **Vary sentence length** — AI produces metronomically uniform sentences; human writing alternates short punches with longer constructions (all 3)
- **Eliminate formal transitions** — "Moreover," "Furthermore," "Additionally" used with mechanical regularity are AI markers; use headers and horizontal rules instead (all 3)
- **Remove hedging phrases** — "It's important to note," "It's worth noting," "Generally speaking" signal abnormal qualifier density (all 3)
- **Remove meta-commentary / self-referential language** — "Let me explain," "I should note that," "Great question," "Absolutely" (all 3)
- **Never open with throat-clearing** — "In today's fast-paced world," "In the ever-evolving landscape of" are near-diagnostic of AI (all 3)
- **Never write summary/conclusion sections** — end when the content ends; don't restate what was already said (all 3)
- **Use positive framing in prompts** — "do Y" outperforms "don't do X"; negative framing causes worse output in larger models (all 3)
- **Use XML tags to structure prompts** — separate role, voice profile, rules, examples, and task into tagged sections (all 3)
- **Two-pass flag-then-rewrite workflow** — flag issues first, then targeted rewrite; better than flag-only or full automatic rewrite (all 3)
- **Provide few-shot examples from the author's actual writing** to calibrate voice (all 3)
- **Code blocks should dominate technical posts** — 60%+ code, prose as connective tissue (all 3)
- **Assume reader competence** — link to docs instead of re-explaining; don't over-scaffold (all 3)
- **First person for personal experience only** — never editorial "we" or "let's" (all 3)
- **Use contractions everywhere** (all 3)
- **Express frustration, uncertainty, and pragmatic compromise directly** — don't diplomatize (all 3)
- **Mix informal vocabulary with technical precision** — "pain," "sane," "weird," "super tedious" alongside exact tool names (all 3)
- **Open with one functional declarative sentence** stating the problem or what the post covers (all 3)
- **Avoid symmetric/formulaic structure** — equal-length paragraphs and predictable organization are AI tells (all 3)
- **Don't inflate significance** — ban "revolutionary," "game-changing," "plays a crucial role in shaping," "stands as a testament to" (all 3)
- **Allow grammatical imperfection** — fragments, sentences starting with "And" or "But," bent rules for naturalness (all 3)
- **Ban "Not only X, but also Y" and tricolon (rule-of-three) constructions** (Claude, Gemini)
- **Opus 4.6 is better suited for reviewer/tone tasks** than Sonnet (ChatGPT, Gemini)
- **Keep prompt length to 1,500-2,500 tokens** for best results (ChatGPT, Claude)
- **Score drafts on voice match + AI detectability** and skip rewriting if the draft already scores well (ChatGPT, Claude)
- **Track which flags recur most often** and update the suppression list over time (ChatGPT, Claude)
- **End posts abruptly when the task is done** — "That should do it" rather than a wrap-up (ChatGPT, Claude)
- **Dry, understated humor as ironic asides** — never forced or performed (Claude, Gemini)

### Unique Findings (from one source only)

#### ChatGPT only

- AI tells should be treated as a **weighted bundle of signals**, not single smoking guns — one tell alone isn't proof
- **Prompt sensitivity is under-addressed** in AI detection research; the same model looks much more human under different prompting strategies
- Prefilling and format-forcing tricks are **deprecated on Opus 4.6 and Sonnet 4.6**
- Adjust **temperature OR top_p, not both** simultaneously
- Use `stop_sequences` to halt on specific strings
- Opus can do **multi-pass rewriting in a single call** due to 128k max output
- Use a **rubric + self-check rewrite loop** to force the model to notice its own tells
- Run **automated detectors** (token rank distribution, curvature analysis) when available as a supplementary check
- Ground style analysis in **peer-reviewed detection research** (GLTR, DetectGPT, watermarking)
- Place **longform data near the top and queries at the end** of prompts — Anthropic reports ~30% quality improvement on long inputs

#### Claude only

- An **AI-analyzed voice profile outperforms raw few-shot samples by ~20%** on embedding similarity (validated by 180-run Saxifrage experiment)
- **Write the prompt itself in the target style** — the prompt's own style influences output style
- Mark each change with **inline HTML comments** like `<!-- fixed: em_dash -->` so the author can review what changed
- Explicit limitation: reviewer catches **style only, not content fabrication** — factual accuracy is a separate concern
- Explicit limitation: the approach **cannot inject experiences the author hasn't had** or opinions they don't hold
- Keep the **suppression list to 6-8 hard constraints max** — long laundry lists are counterproductive

#### Gemini only

- Use **Extended Thinking for a "Tonal Audit"** pass — have Claude diagnose AI tells in a thinking block before editing
- Ask the model to **explain its editorial reasoning** in the thinking block to ensure active voice processing rather than superficial filtering
- Opus is particularly good at **compression** (2,000 words to 1,200 while preserving human voice)
- Sonnet tends toward **"softening" conclusions** to be more pro-social, potentially stripping opinionated edge
- Smaller models are more likely to **box themselves into examples without generalizing**
- Adopt a **"builder" persona** — sound like someone in a datacenter explaining to a peer, not an assistant
- Suggest **internal/external links smoothly** for SEO rather than forced keyword stuffing

### Contradictions (points where sources disagree)

- **Em-dash policy** — ChatGPT says **never use em-dashes** (zero tolerance). Claude calls them the "single most discussed punctuation tell" but discusses reduction, not elimination. Gemini prescribes a specific **80% reduction**, keeping some for emphasis. The spectrum runs from total ban to controlled use.
- **Number of example passages** — ChatGPT recommends **3-5 before/after pairs**. Claude says **1-2 brief excerpts** are sufficient for final calibration. Gemini says **3-5 high-quality examples** to create "prosodic memory." Claude is the outlier, favoring a lean approach.
- **Suppression list size** — Claude explicitly caps it at **6-8 hard constraints** and warns that long rule lists are counterproductive. ChatGPT and Gemini both present substantially longer suppression lists (15-20+ items) without noting diminishing returns.
- **Full rewrite risk** — Claude explicitly warns that **full automatic rewrite is risky** because it can introduce new tells and removes human oversight. ChatGPT recommends an **aggressive two-pass rewrite** with less emphasis on the risk. Gemini sits in the middle, focusing on flag-then-fix but encouraging Extended Thinking as a safeguard.
- **Sonnet's limitations** — Gemini warns Sonnet **"softens" conclusions and strips opinionated edge**, framing it as a substantive voice concern. ChatGPT notes Sonnet needs **tighter style guides** and recommends one-pass rewrites to avoid verbosity creep, framing it as a practical constraint. Claude doesn't call out Sonnet-specific limitations.
- **Voice profile approach** — Claude asserts that an **AI-analyzed voice profile outperforms raw samples by ~20%** and recommends profile-first. ChatGPT and Gemini both emphasize **direct few-shot examples** as the primary calibration mechanism, with voice characteristics as supplementary.
