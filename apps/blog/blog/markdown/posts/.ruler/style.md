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


## AI Slop

If a sentence exists to sound good rather than say something, cut it.

### Structural tells

**Performative contrast.** "Not X, but Y" sentences that dismiss
something the reader wasn't thinking about. "Not marketing fluff,
actual engineering posts." If the real thing is good, say it directly.
The contrast is doing work for the writer's ego, not the reader's
understanding.

**Throat-clearing.** Paragraphs that introduce the next section but
contain no information the reader won't get from the section itself.
If the heading and first sentence make it redundant, delete the
paragraph. The reader doesn't need a tour guide between sections.

**Setup/payoff filler.** Sentences that exist only to frame the next
sentence as important. "What was more interesting was..." "Here's
the thing." "It turns out that..." Just say the thing. If it's
interesting, the reader will notice without being told.

**Vague advice.** Sections that state a principle ("start simple")
without giving the reader enough to act on it. If a section's
takeaway is something the reader already believed before reading
it, it needs concrete detail: a comparison table, a list of
scenarios, worked examples, or decision criteria. "Use workflows
before agents" is vague. A table showing which tasks are workflows
vs. agents is useful. When the section header already states the
advice, the body must add specifics, not restate it in more words.

**Uniform paragraph size.** If every paragraph is 3-4 sentences,
the rhythm is artificial. Vary deliberately. A one-sentence
paragraph punches. A five-sentence paragraph explains. Sameness
across paragraphs is a tell even when each paragraph individually
follows the rules.

### Lexical tells

**Kill list.** These words and phrases are almost never necessary.
Delete or replace with plain language: "Additionally",
"Moreover", "Furthermore", "delve", "leverage", "seamless",
"robust", "It's important to note", "It's worth noting",
"significant", "notable", "simply", "easily", "quickly",
"key takeaways", "in today's world", "in today's rapidly
evolving", "in the current landscape", "tapestry", "landscape"
(non-literal), "multifaceted", "nuanced", "comprehensive",
"innovative", "crucial", "vibrant", "embark", "unpack",
"revolutionary", "game-changing", "stands as testament to",
"plays crucial role", "generally speaking", "I should note
that". "Just" when used as a minimizer ("just run", "just
add", "just use") but not as a temporal marker ("I just
found out"). Prefer concrete verbs and nouns over evaluative
adjectives.

**Repeated evaluatives.** If the same adjective ("significant",
"important", "key") appears in multiple paragraphs, the writer
is asserting importance instead of demonstrating it. Replace
with "because" clauses that show why something matters.

**"Not only X but also Y."** Signature LLM construction.
Pick the stronger claim and state it directly, or use two
sentences.

**Shallow causality.** "X is important" or "X matters" without
"because" is an assertion, not an argument. "Tool design matters"
is empty. "Tool design matters because the model reads tool
descriptions as instructions" earns the claim.

### Tone tells

**Hedging when you could verify.** "This might improve
performance" is weak when you can run it and report what
happened. Don't hedge when testing is possible. If you can't
test, say so directly: "I haven't tested this" or "TODO."

**Generic safe centre.** Sections that avoid taking a position,
present all options as equally valid, or hedge every claim. If
the post is about a decision, state the decision and the
tradeoff. "There are many options" is filler. "I picked X
because Y, and the tradeoff is Z" is useful.

**Over-helpful.** Don't explain things the audience already
knows. The reader is a competent engineer (see Audience). Don't
tutorialize basics, define common terms, or add "step-by-step"
scaffolding that wasn't asked for. Assume competence, explain
the delta.

**Performative casualness.** The overcorrection for AI formality.
"Look, here's the deal." "Let's cut to the chase." "Hot take:"
"Real talk:" These are as artificial as "Moreover" but in the
opposite direction. Bluntness should come from short sentences
and direct claims, not from announcing that you're being blunt.

**Humor.** Dry understatement and self-deprecation are
on-brand ("Because it's cool, mostly."). Performed humor
(forced jokes, winking asides) is not. If it reads like a
standup bit, cut it.


## Audience

Working engineers and technically curious people who might actually
go try this themselves. They're competent but not necessarily
experienced with the specific tool or technique. The reader is a
friend or coworker, not a stranger googling for a tutorial.

Posts exist to up-skill them: high fact density, reproducible steps,
honest about what worked and what didn't. Write for someone who will
use what you wrote, not someone who needs to be convinced to care.

The reader trusts the author. That trust is the blog's most valuable
property. Every post carries an implicit guarantee that the author
has reviewed the material and verified the advice actually works,
unless explicitly flagged otherwise. Uncertainty is called out
honestly and eagerly, but uncertainty that can be resolved through
more research or testing should be resolved, not published. Don't
write "I think this works" when you can run it and find out.


## Formatting Rules

**No em-dashes.** Ever. Use a comma, a period, or restructure the sentence.

**Use contractions.** "I've", "it's", "don't", "that's", "didn't". Natural
English uses contractions. Uncontracted prose reads as formal or robotic.

Sentences: 8-15 words is typical. Vary length deliberately. Fragments are fine
for emphasis. "That's it." is a valid sentence. Starting sentences with "And"
or "But" is fine. They're shorter than "Additionally" and "However."

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
Good closings: a final command the reader can run, a blunt sign-off
("That should do it."), or just stopping after the last useful thing.
Abrupt is better than ceremonial.

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


## Internal Links

This blog uses static HTML export. All internal links between posts must
end in `.html`. Use the slug from frontmatter plus `.html`:

Good: `[my post](/some-slug.html)`
Bad: `[my post](/some-slug)`


## Honesty

Never write anything dishonest, even in grey areas. Don't embellish, dramatize,
or frame events misleadingly to make them sound better. If something is cool,
let it stand on its own.

Don't fabricate output. If a blog post includes command output, error messages,
or conversation transcripts, they must be from real runs.


## Attribution: "I" vs. "Claude"

The author is a human who directs Claude to do work. Get the attribution right:

- **"I"** for decisions the author made: choosing tools, architectures,
  approaches, tradeoffs. The author would have changed these if Claude got them
  wrong. "I went with Vault" or "I moved it into Kubernetes" are correct.
- **"Claude"** / **"I had Claude..."** for implementation work Claude did
  autonomously between prompts: writing code, running commands, talking to other
  agents, debugging errors. "I had Claude add chmod calls to the init container"
  or "Claude ran the healthcheck and found three issues."

Research and reading follow the same rule. "I read everything
Anthropic published" is dishonest when Claude did the reading. Use
"I had Claude read..." or "I ran a research agent on..." The test
is the same: would saying "I" misrepresent who did the work?

Don't over-attribute. Not every line needs "Claude did X." Use it where saying
"I" would be dishonest about who did the work.

**Never fabricate the author's preferences, opinions, or predictions.**
Statements like "This is the one I'll use most" or "I prefer X over Y"
can only come from the author. If the AI is writing the draft, it doesn't
know what the author prefers, uses most, or plans to do next. State the
objective fact instead: "This one appears the most useful" or "X has
fewer steps than Y." The test: could this sentence only be true if a
specific human felt or decided it? Then don't write it.


## External References

When mentioning research, CVEs, products, or tools by name, always link to
the primary source. Link to the original publication, not a news summary.
If you reference a GitHub project, link to the repo. If you reference a
security advisory, link to the researcher's writeup or the CVE page.

Don't drop names without links. "Lasso Security published research" is
incomplete. "Lasso Security published a [prompt injection taxonomy](url)"
is correct.


## What to Avoid

- AI writing tells: hedging qualifiers, hollow transitions, motivational sign-
  offs, restating conclusions
- Em-dashes (use commas or periods instead)
- Starting every section with a definition of the section's topic
- Explaining what you're about to do instead of doing it
- Internal links without `.html` extension (static export requires it)
- Dishonest attribution (see above)
