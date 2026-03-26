---
title: "OpenObserve MCP Server"
summary: "MCP server for querying OpenObserve logs, streams, and alerts from Claude Code and agent workflows."
keywords:
  - mcp
  - openobserve
  - logs
  - observability
  - health-check
related:
  - wiki/devops/openobserve.html
  - wiki/mcp-servers/index.html
scope: "Setup, configuration, and tool reference for the OpenObserve MCP server."
last_verified: 2026-03-25
---

## Overview

Python MCP server using FastMCP that queries the OpenObserve REST API.
Primary use case: checking for errors during health checks. Also supports
ad-hoc log queries, stream discovery, and alert inspection.

Source: `apps/mcp-servers/openobserve/server.py`

## Prerequisites

- OpenObserve instance accessible via HTTP (in-cluster or port-forwarded)
- Basic auth credentials (base64-encoded `user:password`)
- Port-forward if accessing from local machine:
  ```bash
  kubectl port-forward -n openobserve svc/openobserve-openobserve-standalone 5080:5080
  ```

## Configuration

Environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `O2_URL` | Yes | — | OpenObserve base URL (e.g. `http://localhost:5080/obs`) |
| `O2_TOKEN` | Yes | — | Base64-encoded `email:password` |
| `O2_ORG` | No | `default` | OpenObserve organization |

`.mcp.json` entry:
```json
"openobserve": {
  "command": "/Users/pai/gh/multi/apps/mcp-servers/openobserve/.venv/bin/python",
  "args": ["/Users/pai/gh/multi/apps/mcp-servers/openobserve/server.py"],
  "env": {
    "O2_URL": "http://localhost:5080/obs",
    "O2_TOKEN": "<base64 token>",
    "O2_ORG": "default"
  }
}
```

## Tools

### Core — Health Checks

**`o2_error_summary`** — Count errors/warnings grouped by namespace and pod.
- `period`: Time window (default: `1h`). Examples: `30m`, `6h`, `24h`, `7d`.

**`o2_recent_errors`** — Fetch the N most recent error log lines.
- `limit`: Number of lines (default: 20).
- `namespace`: Optional K8s namespace filter.
- `period`: Time window (default: `1h`).

**`o2_search_logs`** — Run a custom SQL query.
- `sql`: PostgreSQL-compatible SQL. Use stream name as table.
- `start_time` / `end_time`: ISO 8601, Unix ms, or relative (`1h`, `24h`).
- `limit`: Max results (default: 100).

### Discovery

**`o2_list_streams`** — List all streams with doc count and storage size.
- `stream_type`: Filter by `logs`, `metrics`, or `traces`.

**`o2_stream_schema`** — Get field names and types for a stream.
- `stream`: Stream name (default: `k8s_logs`).

### Alerts

**`o2_list_alerts`** — List all configured alerts.

**`o2_get_alert`** — Get alert details by ID.

## Time Formats

All time parameters accept:
- **Relative**: `30m`, `1h`, `24h`, `7d` (ago from now)
- **ISO 8601**: `2026-03-25T12:00:00Z`
- **Unix milliseconds**: `1774486400000`
- **`now`**: Current time (for `end_time`)

## Example Usage

Check for errors in the last hour:
```
Use o2_error_summary with period "1h"
```

Find recent errors in a specific namespace:
```
Use o2_recent_errors with namespace "ai-agents" and period "24h"
```

Custom SQL query:
```
Use o2_search_logs with sql "SELECT k8s_pod, COUNT(*) as cnt FROM k8s_logs WHERE log_level = 'error' GROUP BY k8s_pod ORDER BY cnt DESC LIMIT 10"
```

## Available Fields (k8s_logs stream)

| Field | Type | Description |
|-------|------|-------------|
| `_timestamp` | Int64 | Microseconds since epoch |
| `message` | Utf8 | Log message text |
| `log_level` | Utf8 | Extracted level: info, warning, error, etc. |
| `k8s_namespace` | Utf8 | Kubernetes namespace |
| `k8s_pod` | Utf8 | Pod name |
| `k8s_container` | Utf8 | Container name |
| `k8s_node` | Utf8 | Node name |
| `source_type` | Utf8 | Vector source type |
