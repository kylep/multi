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
related:
  - wiki/projects/agent-team/writer
  - wiki/projects/agent-team/reviewer
  - wiki/projects/agent-team/publisher
scope: "Blog writing style rules: voice, formatting, structure, honesty, attribution, and what to avoid."
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

## What to Avoid

- AI writing tells
- Em-dashes
- Starting sections with definitions of the topic
- Explaining what you're about to do instead of doing it
- Internal links without `.html` extension
- Dishonest attribution
