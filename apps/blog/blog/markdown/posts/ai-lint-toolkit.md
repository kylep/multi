---
title: "Lint Toolkit for AI Agents"
summary: A Docker image bundling ruff, biome, hadolint, and tflint
  so AI coding agents can lint Python, JS/TS, Dockerfiles, and
  Terraform.
slug: ai-lint-toolkit
category: dev
tags: docker, linting, ruff, biome, hadolint, tflint, claude-code
date: 2026-03-07
modified: 2026-03-07
status: published
image: ai-lint-toolkit.png
thumbnail: ai-lint-toolkit-thumb.png
imgprompt: The Docker whale wearing reading glasses, holding a
  red pen, proofreading a stack of code on a desk
keywords:
  - docker linting toolkit
  - ruff biome hadolint tflint
  - ai agent code linting
  - lightweight linter docker image
  - pre-commit hook linters
  - megalinter alternative
---


After building a [security scanning toolkit](/ai-security-toolkit.html), I wanted the
same pattern for linting. Tedious rules that slow developers down are trivial for a
coding agent to stick to, and it'll help provide some baseline quality.

I also don't want the agent to ever make a mess, and knowing they love to git commit
constantly, I'm leaning again on pre-commit hooks to keep things deterministic.

# MegaLinter is SLOW

I tried [MegaLinter](https://megalinter.io/) first. It's a
popular containerized linter that bundles 100+ tools. The full
image is 17GB. The "cupcake" flavor with common languages is
10GB. Even the language-specific flavors are 5GB on disk.

The scan took over five minutes on a monorepo with a few
thousand files. That's not something I want AI agents running
on demand. So I built my own.


# Introducing kpericak/ai-lint-toolkit

Cool thing about agentic coding is you can roll your own anything with basically no
effort. I asked it to make me my own faster one, and to run it then fix up my own
project.

Ended up with an image containing four linters, each the fastest in its category:

| Language | Tool | Written in |
|----------|------|-----------|
| Python | [ruff](https://docs.astral.sh/ruff/) | Rust |
| JS / TS | [biome](https://biomejs.dev/) | Rust |
| Dockerfile | [hadolint](https://github.com/hadolint/hadolint) | Haskell |
| Terraform | [tflint](https://github.com/terraform-linters/tflint) | Go |

All four are single compiled binaries. No Python runtime, no
Node.js, no JVM. The final image is **282MB**.

Ruff replaces flake8, pylint, isort, and black in one tool.
Biome replaces eslint and prettier. Both are written in Rust
and finish in under a second on this monorepo.


# The Dockerfile

Multi-stage build. Copy hadolint and tflint from their
official images, download ruff and biome as release binaries.

```dockerfile
FROM hadolint/hadolint:v2.14.0-alpine AS hadolint
FROM ghcr.io/terraform-linters/tflint:v0.61.0 AS tflint

FROM alpine:3.21

ARG RUFF_VERSION=0.15.5
ARG BIOME_VERSION=2.4.6
ARG TARGETARCH

RUN apk upgrade --no-cache

COPY --from=hadolint /bin/hadolint /usr/local/bin/hadolint
COPY --from=tflint /usr/local/bin/tflint /usr/local/bin/tflint

# ruff: Python linter (Rust binary)
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      RUFF_ARCH="aarch64"; else RUFF_ARCH="x86_64"; fi \
    && wget -qO- \
    "https://github.com/astral-sh/ruff/releases/download/\
${RUFF_VERSION}/ruff-${RUFF_ARCH}-unknown-linux-musl.tar.gz" \
    | tar xz --strip-components=1 -C /usr/local/bin

# biome: JS/TS linter (Rust binary)
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      BIOME_ARCH="linux-arm64-musl"; \
      else BIOME_ARCH="linux-x64-musl"; fi \
    && wget -qO /usr/local/bin/biome \
    "https://github.com/biomejs/biome/releases/download/\
%40biomejs%2Fbiome%40${BIOME_VERSION}/biome-${BIOME_ARCH}" \
    && chmod +x /usr/local/bin/biome

RUN addgroup -S linter && adduser -S linter -G linter
RUN mkdir -p /workspace && chown linter:linter /workspace

WORKDIR /workspace
USER linter
ENTRYPOINT ["/bin/sh"]
```

The `TARGETARCH` arg is set automatically by Docker BuildKit,
so the same Dockerfile works on both amd64 and arm64. A
non-root `linter` user runs the tools. The image builds in
under 10 seconds because every tool is a precompiled binary.

Source:
[GitHub](https://github.com/kylep/multi/tree/main/infra/ai-lint-toolkit)


# Asking AI agents to lint

Same approach as the
[security toolkit](/ai-security-toolkit.html). A [Ruler](/ruler-cross-tool-ai-rules.html)
file provides the commands, then `ruler apply` injects them into CLAUDE.md and any
other tool config.

Note that this is nondetermistic and such not dependable.

```markdown
# Linting

The Docker image `kpericak/ai-lint-toolkit:0.1` bundles
ruff, biome, hadolint, and tflint in one Alpine container.

Run from the repo root. Mount the project directory
as /workspace.

## Python (ruff)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-lint-toolkit:0.1 \
  -c "ruff check /workspace --no-cache"

## JavaScript / TypeScript (biome)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-lint-toolkit:0.1 \
  -c "biome lint /workspace/path/to/src"

## Dockerfiles (hadolint)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-lint-toolkit:0.1 \
  -c "find /workspace -name 'Dockerfile*' \
  -not -path '*/node_modules/*' | xargs hadolint"

## Terraform (tflint)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-lint-toolkit:0.1 \
  -c "cd /workspace/path/to/tf && tflint"
```

The volume is mounted read-only. Linters don't need to write
to your source tree. Ruff needs `--no-cache` to skip writing
a cache directory since the mount is read-only.

For biome, point it at specific source directories rather
than the repo root. Otherwise it crawls `node_modules` and
takes forever.


# Running the linters

Here's what each tool found on the first scan of this
monorepo.

## ruff

```
46  F401  [*] unused-import
13  F841  [-] unused-variable
11  F541  [*] f-string-missing-placeholders
 1  F821  [ ] undefined-name
Found 71 errors.
[*] 59 fixable with the `--fix` option.
```

71 findings across all the Python in the monorepo. Most are
in older projects (kytrade, mods) that haven't been touched
in a while. The `[*]` markers mean ruff can auto-fix them.
Unused imports and f-string placeholders are the bulk of it.

Ruff scanned the entire repo in 0.5 seconds.

## biome

```
7 lint/suspicious/noDoubleEquals
6 lint/style/noNonNullAssertion
4 lint/style/useConst
1 lint/correctness/useParseIntRadix
1 lint/correctness/noUnusedImports
```

19 findings. The double-equals warnings are in the blog's
route handler (`==` instead of `===`). The non-null
assertions are in test files for a game project. All fixable.

Biome scanned the JS/TS source in 0.7 seconds.

## hadolint

Hadolint found 14 findings across 5 Dockerfiles. The
interesting ones:

- **DL3020**: Use COPY instead of ADD (2 errors in kytrade)
- **DL3018**: Pin versions in `apk add`
- **DL3013**: Pin versions in `pip install`
- **DL4006**: Set `SHELL` with `-o pipefail` before piped RUN

The security toolkit's own Dockerfile got flagged for the
pipefail issue in its `wget | tar` pipe. Fair catch.

## tflint

```
Warning: terraform "required_version" attribute is required
Warning: Missing version constraint for provider "google"
Warning: [Fixable] data "aws_caller_identity" "current"
  is declared but not used
```

4 warnings across 2 Terraform directories. Missing version
constraints and an unused data source. Standard Terraform
hygiene stuff.


# Size comparison

| Image | Size on disk | Run time |
|-------|-------------|----------|
| MegaLinter (full) | 17 GB | 5+ min |
| MegaLinter (cupcake) | 10 GB | untested |
| MegaLinter (javascript) | 5 GB | untested |
| ai-lint-toolkit | 282 MB | < 5 sec |

The custom image is 60x smaller than MegaLinter's full image
and runs in seconds. The tradeoff is that it only covers four
languages. But those are the four I need, and adding more is
one `wget` or `COPY` away.


# Pre-commit hooks as lazy CI

I already had semgrep and gitleaks running as pre-commit
hooks from the
[security toolkit](/ai-security-toolkit.html). Adding
ruff and biome follows the same pattern.

```yaml
repos:
- repo: local
  hooks:
    - id: ruff
      name: Ruff
      entry: >-
        bash -c 'docker run
        -v "$(pwd):/workspace:ro" --rm
        kpericak/ai-lint-toolkit:0.1
        -c "ruff check /workspace --no-cache"'
      language: system
      stages: ["pre-commit"]
    - id: biome
      name: Biome
      entry: >-
        bash -c 'docker run
        -v "$(pwd):/workspace:ro" --rm
        kpericak/ai-lint-toolkit:0.1
        -c "biome lint /workspace/apps/blog/blog/pages
        /workspace/apps/blog/blog/components
        /workspace/apps/blog/blog/utils"'
      language: system
      stages: ["pre-commit"]
    - id: semgrep
      name: Semgrep
      entry: >-
        bash -c 'docker run
        -v "$(pwd):/workspace:ro" --rm
        kpericak/ai-security-toolkit-1:0.2
        -c "semgrep scan --config auto
        --error /workspace"'
      language: system
      stages: ["pre-commit", "pre-push"]
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.30.0
  hooks:
    - id: gitleaks
      stages: ["pre-commit", "pre-push"]
```

Every commit now gets linted for Python and JS/TS issues,
scanned for security bugs by semgrep, and checked for
leaked secrets by gitleaks. Four tools, no CI server
required.

Hadolint and tflint aren't in the hooks. Dockerfiles and
Terraform configs change rarely enough that running them
on demand through the AI agent is fine.
