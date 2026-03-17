# Export Files
These files are used to set environment variables during local development and deployment

## Available samples

| Sample file | Purpose |
|-------------|---------|
| `export-kytrade.sh.SAMPLE` | KyTrade local dev secrets |
| `export-agent-controller.sh.SAMPLE` | Agent controller K8s secrets (OpenRouter, Discord, OAuth, GitHub App) |

Copy a sample to its non-SAMPLE name, populate values, then `source` it.
The `.gitignore` excludes `export-*.sh` so real values are never committed.
