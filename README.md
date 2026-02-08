# multi

Kyle's personal monorepo for hobby projects and shared infrastructure.

## What's in here

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [blog](apps/blog/) | NextJS static site generator for [kyle.pericak.com](http://kyle.pericak.com) | JavaScript, NextJS, Google Cloud Build |
| [kytrade](apps/kytrade/) | Personal trading tools and automation CLI | Python, PostgreSQL, Kubernetes/Helm |
| [games](apps/games/) | Games built with my kids (snake, robotext-battle, kid-bot-battle-sim) | Python, Pygame, Poetry |
| [sillyapp](apps/sillyapp/) | iOS app | Swift, XCode |
| [mods](apps/mods/) | Minecraft mods | Java |
| [xmasblocks](apps/xmasblocks/) | Find funny word combos from scrambled Christmas letter blocks | Python, OpenAI API |
| [infra](infra/) | Shared infrastructure -- AWS EKS and a local K8s cluster on an Intel NUC | Terraform, Helm, Docker |
| [samples](samples/) | Step-by-step NextJS SSG tutorial code (ssg-00 through ssg-03) | JavaScript, NextJS, MUI |

## Repo structure

```
.
├── apps
│   ├── blog
│   ├── games
│   │   ├── kid-bot-battle-sim
│   │   ├── robotext-battle
│   │   ├── sillyapp
│   │   └── snake
│   ├── kytrade
│   ├── mods
│   │   └── minecraft
│   ├── sillyapp
│   └── xmasblocks
├── bin
├── infra
│   ├── aws
│   ├── containers
│   └── local-k8s
├── samples
│   ├── ssg-00-static-base
│   ├── ssg-01-multi-page-site
│   ├── ssg-02-metadata-and-style
│   └── ssg-03-mui-in-ssg
└── secrets
```

## Dev environment setup

### Secrets

Copy `secrets/export-kytrade.sh.SAMPLE`, remove the `.SAMPLE` suffix, fill in the values, then source it:

```bash
source secrets/export-kytrade.sh
```

### Pre-commit hooks

Runs [TruffleHog](https://github.com/trufflesecurity/trufflehog) via Docker on commit and push to detect secrets.

```bash
pre-commit install
```

### Per-project setup

Each project has its own README with setup instructions. The short version:

- **blog**: `cd apps/blog && npm install` -- see [apps/blog/README.md](apps/blog/README.md)
- **kytrade**: `docker-compose up` from kytrade dir -- see [apps/kytrade/README.md](apps/kytrade/README.md)
- **games/snake**: `poetry install` -- see [apps/games/snake/README.md](apps/games/snake/README.md)
- **games/robotext-battle**: `poetry install` -- see [apps/games/robotext-battle/README.md](apps/games/robotext-battle/README.md)
- **xmasblocks**: `pip install -r requirements.txt` -- see [apps/xmasblocks/README.md](apps/xmasblocks/README.md)
