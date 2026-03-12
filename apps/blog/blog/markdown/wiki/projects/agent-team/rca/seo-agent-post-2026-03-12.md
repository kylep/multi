---
title: "RCA: seo-agent.md post failure — 2026-03-12"
summary: "Post-mortem on the first blog post produced by the Publisher pipeline. Post was rejected as boring, not interesting, just a narrated log, and missing a post image."
keywords:
  - rca
  - publisher
  - reviewer
  - writer
  - quality-gate
  - editorial
  - post-mortem
scope: "Full RCA covering what shipped, what was wrong, root cause per agent, and all action items implemented."
last_verified: 2026-03-12
---

## What shipped

`seo-agent.md` — "AI SEO Agent That Audits Your Blog" — the first blog post
produced end-to-end by the Publisher pipeline (researcher → writer →
fact-checker → reviewer). Merged to PR #42, branch
`kyle/per-45-blog-ai-seo-agent-that-audits-your-blog`.

## What was wrong

Kyle's verdict: "boring, not interesting, basically a log file of what was tried.
If I am not learning something new when I follow along with the post then what
the fuck is the point?"

Specific failures:

1. **No post image.** Frontmatter missing `image`, `thumbnail`, and `imgprompt`
   fields. Every published post has these. The post could not have rendered
   with a proper header image.

2. **No editorial value.** The post pastes the audit output, then narrates the
   audit output. Two versions of the same information. Reader learns nothing they
   could not get from running the agent themselves.

3. **Wrong structure for the substance.** 1500 words of log narration when the
   actual useful content was the internal linking fixes (100 words) and the
   insight that idea-first beats data-first (one sentence).

4. **Reviewer approved it.** The style was clean. That is not sufficient.

## Timeline

1. Pai ran the SEO agent to gather real audit data. Good: real data, not fabricated.
2. Pai passed the audit output to Publisher with instructions to "write the post
   using this data."
3. Publisher ran the pipeline. Researcher gathered tool facts. Writer wrote a post
   structured around the audit output as the primary content.
4. Fact-checker caught one factual error (a quoted string mismatch). Corrected.
5. Reviewer approved. Style guide compliance: pass.
6. PR opened, merged. Post rejected by Kyle same day.

## Root cause

**The post was assembled from an artifact rather than conceived around something
the reader would learn. The idea comes first. The data serves the idea. Here it
was reversed.** (CMO finding)

Secondary causes:

- **No substance gate.** Publisher had no step that asked "does this have enough
  substance and a clear angle to be worth a post?"
- **No editorial brief to the writer.** Writer received audit output and style
  guide. No stated angle. No target reader. No definition of what the post is NOT.
  Writer defaulted to the safest structure: here is the tool, here is what it
  found.
- **Reviewer scope too narrow.** Reviewer checked style and structure. Style was
  clean. "Is this worth reading?" was outside its mandate.
- **No frontmatter completeness check.** No agent in the pipeline checked for
  required image fields. The gap existed between fact-checker (claims), reviewer
  (style), and done.
- **Pai contributed.** Passing raw SEO audit output with "write a post about this"
  sets up the writer to produce a log file. The brief should have included the
  angle: what will the reader learn that they did not know before?

## Agent findings

### CMO
"The core failure: the post was assembled from an artifact rather than conceived
around something the reader would learn. The idea comes first. The data serves
the idea. Here it was reversed."

### Publisher (self-assessment)
- No substance gate before writer
- No editorial brief in writer prompt (angle, target reader, what post is NOT)
- No frontmatter checklist
- Deferred to reviewer approval instead of exercising editorial judgment
- "I treated the pipeline as a sequence of handoffs and assumed approval from
  each agent meant the post was ready. It does not."

### Reviewer (self-assessment)
- Approved because post met all style guide rules (which it did)
- "Is this post worth reading?" was explicitly outside scope
- Missing image frontmatter also outside scope
- "A post can be well-written (style pass) and boring (editorial fail) at the
  same time."

## Action items — all implemented 2026-03-12

| # | Change | File | Status |
|---|--------|------|--------|
| 1 | Substance gate before writer step | `.claude/agents/publisher.md` | Done |
| 2 | Editorial brief requirement in writer prompt | `.claude/agents/publisher.md` | Done |
| 3 | Frontmatter completeness checklist at pipeline end | `.claude/agents/publisher.md` | Done |
| 4 | Substance check added to reviewer output format | `.claude/agents/reviewer.md` | Done |
| 5 | Frontmatter check added to reviewer scope | `.claude/agents/reviewer.md` | Done |
| 6 | Insufficient-substance return added to writer | `.claude/agents/writer.md` | Done |
| 7 | Publisher wiki page updated | `wiki/projects/agent-team/publisher.md` | Done |
| 8 | Style guide editorial quality section added | `wiki/projects/agent-team/style-guide.md` | Done |

## What Pai should do differently

When passing source material to Publisher, always include the angle: what will
the reader learn that they did not know before? Raw audit output + "write a post"
is not a sufficient brief. The orchestrator owns the editorial direction, not
just the data handoff.

If the source material is thin (e.g., a tool ran and found some dead links),
say so before invoking Publisher. Option: reduce scope to a short note, combine
with a more substantial second finding, or don't publish at all.

## Status

Closed. All action items implemented. The failed post (seo-agent.md) is in draft
status in the repo. The RCA itself became the subject of the next blog post.
