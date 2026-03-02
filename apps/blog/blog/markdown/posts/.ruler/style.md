# Blog Post Writing Style

This file guides AI assistants writing or editing posts in this directory.


## Voice & Tone

Casual, first-person, written by a working engineer. Think someone documenting
what they actually did, not a tech writer producing polished documentation.
First person is fine and doesn't need to be consistent across posts.

Honest about limitations, mistakes, and uncertainty. Phrases like "I don't know
what that is, but it doesn't sit well with me" or "it got it wrong twice" are
on-brand. Self-deprecating is fine. Generic enthusiasm is not.

Never sound like AI-generated content. Avoid:
- Filler affirmations ("Great question!", "Certainly!", "It's worth noting that")
- Overuse of adverbs ("simply", "easily", "just", "quickly")
- Passive construction when active is clearer
- Summarizing paragraphs that restate what was just said
- Conclusion sections that congratulate the reader for completing steps


## Formatting Rules

**No em-dashes.** Ever. Use a comma, a period, or restructure the sentence.

Sentences: 8-15 words is typical. Vary length deliberately. Fragments are fine
for emphasis. "That's it." is a valid sentence.

Paragraphs: 1-5 sentences. White space is good. No walls of text.

Bold sparingly, for genuinely important terms or warnings. Italics rarely.


## Structure

Intros are short. 1-3 sentences establishing why this post exists, then get
into it. No lengthy preamble.

Headers are conversational and specific, not generic. "Why an iPhone App" not
"Motivation". "Setup: GPT Image 1.5" not "Installation Steps".

Use `#` for top-level sections, `##` for subsections, `###` if needed below
that. Don't go deeper.

Outros: end at the natural stopping point. A validation step or next action is
a fine place to stop. No "thanks for reading", no summary of what was covered.

"Note:" and "Lesson Learned:" asides are used to flag caveats or corrections
inline rather than as a separate section.


## Lists vs. Prose

Numbered lists for sequential steps the reader will execute.

Bullet lists for alternatives, options, or unordered sets of things.

Prose for explaining why something works, comparing approaches, or anything
that requires reasoning. Don't bullet-point things that flow naturally as
sentences.


## Code Blocks

Use code blocks heavily. They should be copy-paste ready. Include inline
comments for non-obvious lines or where the reader needs to substitute a value.
Show example output as comments when it helps. Use the right language tag
(bash, python, yaml, etc.).


## Mermaid Diagrams

Use mermaid diagrams when a visual would genuinely clarify something a
paragraph would explain worse. Good candidates: pipelines, state machines,
request flows, architecture relationships.

Reference `mermaid-markdown-support.md` for the syntax of supported diagram
types. That post demonstrates: flowcharts (`graph TD`), sequence diagrams,
state diagrams (`stateDiagram-v2`), and class diagrams. Use a fenced code
block with the `mermaid` language tag.

Don't force a diagram when prose or a table is clearer.


## Tables

Use tables for comparisons with multiple attributes (model vs. cost vs.
provider, etc.). Keep them tight. Don't add columns that don't add information.


## Line Length

Keep prose lines at 88 characters or shorter. This makes the raw markdown
readable in a terminal or side-by-side diff.


## Tags

Tags are used as URL slugs. Keep them URL-safe: single words or hyphenated
multi-word tags only. No spaces, no dots, no special characters.

Good: `Apple-Silicon`, `llama-cpp`, `Node-js`
Bad: `Apple Silicon`, `llama.cpp`, `Node.js`


## What to Avoid

- AI writing tells: hedging qualifiers, hollow transitions, motivational sign-
  offs, restating conclusions
- Em-dashes (use commas or periods instead)
- Starting every section with a definition of the section's topic
- Explaining what you're about to do instead of doing it
