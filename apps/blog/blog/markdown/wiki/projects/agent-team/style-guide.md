---
title: "Blog Style Guide"
summary: "Single source of truth for blog post voice, formatting, structure, and rules. Used by the Writer and Reviewer agents."
keywords:
  - style-guide
  - writing
  - voice
  - formatting
  - reviewer
  - writer
  - editorial-quality
  - substance
related:
  - wiki/projects/agent-team/writer
  - wiki/projects/agent-team/reviewer
  - wiki/projects/agent-team/publisher
scope: "Blog writing style rules: voice, formatting, structure, honesty, attribution, editorial quality, and what to avoid."
last_verified: 2026-03-12
---

This is a wiki mirror of the canonical style guide at
`apps/blog/blog/markdown/posts/.ruler/style.md`. If they
diverge, the `.ruler/style.md` file wins.

The Reviewer and Writer agents must read and follow this guide.
The Reviewer's core job is enforcing it.

## Voice & Tone

Casual, first-person, written by a working engineer. Think someone
documenting what they actually did, not a tech writer producing
polished documentation. First person is fine and doesn't need to be
consistent across posts.

Honest about limitations, mistakes, and uncertainty. Phrases like
"I don't know what that is, but it doesn't sit well with me" or
"it got it wrong twice" are on-brand. Self-deprecating is fine.
Generic enthusiasm is not.

Never sound like AI-generated content. Avoid:
- Filler affirmations ("Great question!", "Certainly!")
- Overuse of adverbs ("simply", "easily", "just", "quickly")
- Passive construction when active is clearer
- Summarizing paragraphs that restate what was just said
- Conclusion sections that congratulate the reader

## Formatting Rules

**No em-dashes.** Ever. Use a comma, a period, or restructure.

Sentences: 8-15 words is typical. Vary length deliberately.
Fragments are fine for emphasis.

Paragraphs: 1-5 sentences. White space is good. No walls of text.

Bold sparingly, for genuinely important terms or warnings.

## Structure

Intros are short. 1-3 sentences establishing why this post exists,
then get into it.

Headers are conversational and specific, not generic. "Why an
iPhone App" not "Motivation".

Outros: end at the natural stopping point. No "thanks for reading."

## Lists vs. Prose

Numbered lists for sequential steps. Bullet lists for unordered
sets. Prose for reasoning and comparisons.

## Code Blocks

Use code blocks heavily. Copy-paste ready. Right language tag.
Inline comments for non-obvious lines.

## Internal Links

All internal links must end in `.html`.

## Honesty

Never write anything dishonest. Don't embellish or dramatize. Don't
fabricate output. If a post includes command output or transcripts,
they must be from real runs.

## Attribution

- **"I"** for decisions the author made
- **"Claude"** / **"I had Claude..."** for implementation work
  Claude did autonomously

## Editorial Quality

Style rules govern *how* a post is written. Editorial quality governs
*whether a post is worth writing at all.*

A post passes editorial quality if it satisfies all three:

**1. Point of view.** The post argues something, teaches something, or
reveals something the reader didn't already know. "Here is what the
agent did" is not a point of view. "Here is what I learned from
watching it fail, and what I changed" is.

**2. Reader value.** A reader who already knows the tool or topic
should finish the post having learned something they couldn't get from
reading the tool's docs or output directly. If the post is a narrated
walkthrough of output the reader could generate themselves, it has no
editorial value.

**3. Structure does work.** The structure organizes insight, not just
events. A post structured as "Step 1 happened, then Step 2 happened"
is a log. A post structured as "The approach I tried, why it failed,
and the pattern I found" organizes insight.

### The log file test

If you can describe the post as "a log of what [tool/agent] did," it
fails. Logs belong in KB notes, not published posts.

### The idea-first rule

The idea comes first. The data serves the idea. If a post was
assembled from artifact output with no pre-conceived angle, it will
almost certainly fail the editorial quality check. The angle must be
decided before writing begins.

### Who enforces this

- **Publisher**: enforces via the substance gate (before writing)
- **Writer**: enforces by returning INSUFFICIENT SUBSTANCE when
  source material is thin
- **Reviewer**: enforces via the SUBSTANCE section of the review report

## What to Avoid

- AI writing tells
- Em-dashes
- Starting sections with definitions of the topic
- Explaining what you're about to do instead of doing it
- Internal links without `.html` extension
- Dishonest attribution
- Posts that narrate output instead of teaching something
- Writing a full post when the material only supports a short note
