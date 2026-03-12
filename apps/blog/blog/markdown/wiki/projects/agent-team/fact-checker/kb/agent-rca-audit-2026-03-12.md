---
title: Fact-check report for agent-rca.md
summary: Verification of all factual claims in the RCA blog post draft
last_verified: 2026-03-12
audit_date: 2026-03-12
status: complete
---

## Scope

Fact-checked the agent-rca.md blog post draft (draft status) against:
1. The actual seo-agent.md post that was rejected
2. The authoritative RCA source document at `apps/blog/blog/markdown/wiki/projects/agent-team/rca/seo-agent-post-2026-03-12.md`
3. The agent definition files (publisher.md, reviewer.md, writer.md) before and after RCA changes
4. Git history to verify update dates

## Key findings

### VERIFIED CLAIMS

1. **SEO post description (lines 24-26)**: "six organic sessions in twelve months, three content gaps verified via WebSearch, five internal linking fixes with specific file paths and suggested edits"
   - Source: seo-agent.md content
   - Status: VERIFIED

2. **No image fields in seo-agent.md frontmatter (lines 68-69)**: "The frontmatter was missing `image`, `thumbnail`, and `imgprompt` fields"
   - Source: seo-agent.md frontmatter (lines 1-10) - confirmed missing all three
   - Status: VERIFIED

3. **Kyle's verdict (lines 32-34)**: "boring, not interesting, basically a log file of what was tried..."
   - Source: RCA wiki document, line 25-27
   - Status: VERIFIED (exact match)

4. **CMO quote (lines 43-46)**: "The core failure: the post was assembled from an artifact..."
   - Source: RCA wiki document, lines 82-84
   - Status: VERIFIED (exact match)

5. **Reviewer quote (lines 58-60)**: "A post can be well-written (style pass) and boring (editorial fail) at the same time."
   - Source: RCA wiki document, lines 98-99
   - Status: VERIFIED (exact match)

6. **Publisher quote: "I treated the pipeline as a sequence of handoffs..." (lines 55-56)**
   - Source: RCA wiki document, lines 91-92
   - Status: VERIFIED (exact match)

7. **Three substance gate questions (lines 96-103)**: Perspective, Reader value, Source substance
   - Source: publisher.md lines 49-57
   - Status: VERIFIED (content correct, minor wording variations acceptable - RCA draft abbreviates slightly but captures essence)

8. **Editorial brief requirements (lines 109-115)**: Angle, Target reader, What this post is NOT
   - Source: publisher.md lines 74-82
   - Status: VERIFIED

9. **Frontmatter required fields (lines 124-126)**: title, summary, slug, tags, status, image or imgprompt
   - Source: publisher.md lines 157-162
   - Status: VERIFIED

10. **Reviewer output format includes Substance section (lines 135-141)**
    - Source: reviewer.md lines 90-97
    - Status: VERIFIED

11. **Reviewer output format includes Frontmatter section (lines 143-149)**
    - Source: reviewer.md lines 79-81
    - Status: VERIFIED

12. **Writer INSUFFICIENT SUBSTANCE format (lines 167-173)**
    - Source: writer.md lines 40-45
    - Status: VERIFIED (exact match)

13. **Mermaid diagram accurately represents current pipeline (lines 200-222)**
    - Includes: Research → Gate → Brief → Write → FactCheck → Review → FMCheck → Done
    - Includes: Gate failure escalation path
    - Includes: NEEDS REVISION and missing fields loops back to Write
    - Source: publisher.md sections on substance gate (lines 45-67) and frontmatter checklist (lines 152-168)
    - Status: VERIFIED (accurate representation of combined pipeline)

14. **Agent files updated on 2026-03-12**
    - Source: Git history (`git log -1 --format="%ai"`)
    - publisher.md last modified: 2026-03-12 09:20:31
    - Status: VERIFIED

### ISSUE: Publisher quote presentation

Lines 48-56 present three quotes attributed to Publisher (self-assessment):

Draft says (as block quotes):
1. "My pipeline has no substance gate."
2. "There is also no editorial brief passed to the writer. The writer got a research brief and the style guide..."
3. "I treated the pipeline as a sequence of handoffs and assumed approval from each agent meant the post was ready. It does not."

RCA source document shows Publisher section as:
- Four bullet-point summaries (lines 87-90): not formatted as direct quotes
- ONE direct quote (lines 91-92): only the third quote matches exactly

Status: **PARTIALLY UNVERIFIABLE**

The draft claims "Verbatim:" (line 41) but the first two quotes do not appear as direct quotes in the authoritative RCA source. They appear to be synthesized/paraphrased from the bullet points. The third quote IS verbatim from the source.

This is a quote attribution issue. The draft should either:
- Use only the one verified verbatim quote from Publisher, OR
- Clearly indicate these are paraphrased findings rather than direct quotes, OR
- Provide sources for the fuller quote versions if they exist elsewhere

### Recommendation

Flag the Publisher quote block (lines 48-56) as UNVERIFIABLE because:
1. The first two statements are not formatted as direct quotes in the source RCA document
2. They appear to be synthesized from bullet-point summaries
3. Only the final statement is confirmed as a direct quote in the source

The post author should verify whether:
- These are intended to be paraphrases (in which case quote formatting is misleading)
- These came from a separate interview/feedback session (in which case cite the source)
- These are meant to be reconstructed from the bullet points (clarify this in the draft)

## Summary

**VERIFIED**: 14 major claims verified against authoritative sources (RCA wiki, agent definitions, git history, actual post files)

**UNVERIFIABLE**: Publisher's first two attributed quotes - they do not appear in the RCA source as direct quotes

**OVERALL**: Post is substantively accurate on all factual matters except for quote attribution integrity. The core RCA findings, agent definition changes, and pipeline description are correct.
