---
title: "<Tool Name> -- Evaluation"
summary: "<One-line verdict>"
keywords:
  - autolearn
  - evaluation
  - <tool-name>
evaluated: YYYY-MM-DD
verdict: adopt | watch | skip
linear_issue: PER-XXX
related:
  - wiki/evaluations
  - wiki/stack-contract
last_verified: YYYY-MM-DD
---

## What It Is

_1-2 paragraphs: what the tool does, who maintains it, license,
GitHub stars, last release date._

## Why We Looked

_Link to the news item, Linear issue, or reason for investigation.
What problem might this solve in the current stack?_

## Setup Instructions (Tested)

_Step-by-step commands that were actually executed. Every command
below was run and the output captured._

```bash
# Example: installation command
```

<details>
<summary>Setup log (raw terminal output)</summary>

```
# Paste actual stdout/stderr from installation here
```

</details>

## Test Results

_What was tested and what happened. Include actual command output._

### Feature 1: <name>

```bash
# Command that was run
```

```
# Actual output
```

_Worked / Failed. Notes._

### Feature 2: <name>

```bash
# Command that was run
```

```
# Actual output
```

_Worked / Failed. Notes._

## Stack Fit Assessment

_Scored using the [evaluation rubric](/wiki/evaluations/rubric.html)._

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| K8s native | X | ... |
| Stack overlap | X | ... |
| Operational complexity | X | ... |
| Value add | X | ... |
| Community health | X | ... |
| **Weighted score** | **X.X / 5.0** | |

## Recommendation

**Verdict: adopt / watch / skip**

_2-3 sentences explaining the verdict. What would change the
recommendation?_

## Comparison to Current Stack

_What this tool would replace or complement. Reference specific
entries in [stack-contract.md](/wiki/stack-contract.html)._
