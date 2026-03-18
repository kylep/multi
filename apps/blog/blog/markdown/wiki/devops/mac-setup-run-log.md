---
title: "Mac Setup Run Log — 2026-03-18"
summary: "Decision log from running bootstrap.sh and playbook.yml on a fresh Mac, including fixes applied."
keywords:
  - bootstrap
  - ansible
  - mac-setup
  - run-log
related:
  - wiki/devops/bootstrap
scope: "Documents the 2026-03-18 bootstrap execution, every decision made, failures encountered, and fixes committed."
last_verified: 2026-03-18
---


## Run context

- **Date:** 2026-03-18
- **Branch:** `kyle/mac-setup-local`
- **Machine state:** Repo already cloned, Xcode CLI tools and Homebrew present. No Ansible, no gh CLI, no SSH key, no git config. Rancher Desktop not running.

## Pre-playbook: bootstrap.sh prerequisites

The bootstrap script (`infra/mac-setup/bootstrap.sh`) assumes it runs on a factory-reset Mac and installs prerequisites before calling Ansible. Since the repo was already cloned, I ran the missing steps manually instead of the full script.

| Step | Status | Decision |
|------|--------|----------|
| Xcode CLI tools | Already installed | Skipped |
| Homebrew | Already installed | Skipped |
| `brew install ansible gh` | Not installed | Installed both via brew |
| `gh auth login` | Not authenticated | **Deferred** — requires interactive browser login, not automatable from this session. Noted as manual post-step. |
| Clone repo | Already at `~/gh/multi` | Skipped |

## Playbook run 1 — failure

```
ansible-playbook infra/mac-setup/playbook.yml
```

**Result:** Failed at task "Generate SSH key if missing".

**Root cause:** `community.crypto.openssh_keypair` requires the parent directory (`~/.ssh`) to exist. The playbook did not create it.

**Fix applied:** Added a new task before SSH key generation:

```yaml
- name: Create .ssh directory
  ansible.builtin.file:
    path: "{{ ansible_facts['env']['HOME'] }}/.ssh"
    state: directory
    mode: "0700"
```

### Tasks that succeeded before failure

| Task | Result |
|------|--------|
| Homebrew packages (git, gh, jq, node, python@3, helm, helmfile, pre-commit, ansible) | Installed |
| Homebrew casks (rancher) | Installed |
| npm global (@anthropic-ai/claude-code) | Installed |
| Rancher Desktop check | Not running (skipped dependent tasks) |
| Create secrets directory | Created `~/gh/multi/secrets/` (mode 0700) |
| Create .claude directory | Created `~/.claude/` (mode 0700) |
| Git config (name, email, defaultBranch) | Set |

## Playbook run 2 — success

After adding the `.ssh` directory task, full playbook passed (0 failures).

**Additional changes in this run:**

| Task | Result |
|------|--------|
| Create ~/.ssh (mode 0700) | Created |
| Generate ed25519 SSH key | Created — `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILLgFXkaTVXKCoRCn/uJ2Ccgu9HUn2+9C6U6gFwB6Lnc kyle@pericak.com` |
| Pre-commit hooks | Installed (commit + pre-push) |
| Blog npm deps | Installed |
| ~/.zprofile | Added Homebrew shellenv + Rancher PATH lines |

## Playbook run 2 — deprecation warnings

Ansible 13.x emits `INJECT_FACTS_AS_VARS` deprecation warnings for every use of `ansible_env.HOME`. This will become a hard error in ansible-core 2.24.

**Fix applied:** Replaced all `ansible_env.HOME` references with `ansible_facts['env']['HOME']` across the playbook (7 occurrences including the `lookup()` call).

## Playbook run 3 — validation

Clean run confirming deprecation fix. Zero failures, zero warnings (aside from the expected no-inventory warnings which are harmless for `localhost`).

## Skipped tasks (expected)

| Task | Why skipped |
|------|-------------|
| Symlink Rancher docker | Rancher Desktop not running |
| kubectl cluster-info | Rancher Desktop not running |
| Lima VM workspace dirs | Rancher Desktop not running |
| Show SSH public key | Key already existed (run 3) |

## Summary of changes to codebase

1. **`infra/mac-setup/playbook.yml`** — Added `Create .ssh directory` task before SSH key generation
2. **`infra/mac-setup/playbook.yml`** — Replaced all `ansible_env.HOME` with `ansible_facts['env']['HOME']` to fix Ansible 13.x deprecation warnings

## Remaining manual steps

1. **`gh auth login`** — GitHub CLI needs interactive browser authentication
2. **Add SSH public key to GitHub** — Settings → SSH keys
3. **Start Rancher Desktop** — Then re-run playbook for K8s-dependent tasks (docker symlink, Lima workspace)
4. **Transfer `exports.sh`** from old machine and source it
5. **`claude setup-token`** — Authenticate Claude Code
6. **`bash ~/gh/multi/infra/ai-agents/bin/bootstrap.sh`** — Deploy K8s stack
