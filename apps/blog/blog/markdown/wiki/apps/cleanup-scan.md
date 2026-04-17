---
title: "cleanup-scan"
summary: "macOS storage cleanup scanner. Reports reclaimable space across caches, Docker, Xcode, node_modules, venvs, and large files. Report-only — never deletes."
keywords:
  - cleanup-scan
  - macos
  - disk-usage
  - python
scope: "cleanup-scan CLI: what it checks and how to run it."
last_verified: 2026-04-17
---

## What it is

A single-file Python script that walks a macOS home directory and reports
where disk space is going. It prints a report; it never deletes anything.

Source: `apps/macos-utils/cleanup-scan.py`.

## Run it

```bash
python3 apps/macos-utils/cleanup-scan.py
```

No dependencies beyond the stdlib. Colors are auto-disabled when stdout
is not a TTY.

## What it scans

- System and user caches (`~/Library/Caches`, `/Library/Caches`)
- Homebrew cache
- npm / yarn / pnpm stores
- pip caches and wheel cache
- Docker images, containers, volumes, build cache
- Xcode DerivedData, CoreSimulator devices, archives
- Downloads older than 30 days
- Trash
- Log files
- 20 largest files under `$HOME` (skipping `.git`, `node_modules`, `.venv`, `Library`, etc.)
- `node_modules` directories
- Python virtualenvs (`.venv`, `venv`)
- `~/Library/Application Support` subdirs

Each section shows reclaimable size and the command you would run to
clear it — but running that command is left to you.

## Safety

`cleanup-scan.py` has no delete path. It runs `du`, `os.walk`, and
`shutil.disk_usage`; it invokes external tools (`docker system df`,
`brew --cache`) only in read-only mode. Re-running it is free.
