"""MCP server for querying OpenObserve — logs, streams, and alerts."""

import json
import os
import re
import time

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("openobserve")

O2_URL = os.environ["O2_URL"]  # e.g. http://localhost:5080/obs
O2_ORG = os.environ.get("O2_ORG", "default")
O2_TOKEN = os.environ["O2_TOKEN"]  # base64(user:pass)
HEADERS = {
    "Authorization": f"Basic {O2_TOKEN}",
    "Content-Type": "application/json",
}
DEFAULT_STREAM = "k8s_logs"
DEFAULT_TIMEOUT = 30


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_relative(s: str) -> int:
    """Parse relative time like '1h', '24h', '7d', '30m' to seconds."""
    m = re.fullmatch(r"(\d+)([mhdw])", s.strip().lower())
    if not m:
        raise ValueError(f"Invalid relative time: {s!r}. Use e.g. '1h', '24h', '7d', '30m'.")
    val, unit = int(m.group(1)), m.group(2)
    multipliers = {"m": 60, "h": 3600, "d": 86400, "w": 604800}
    return val * multipliers[unit]


def _to_microseconds(t: str | None, default_ago: str = "1h") -> int:
    """Convert time string to microseconds since epoch.

    Accepts: ISO 8601, Unix milliseconds, or relative ('1h', '24h', '7d').
    If None, defaults to `default_ago` before now.
    """
    now_us = int(time.time() * 1_000_000)
    if t is None:
        return now_us - _parse_relative(default_ago) * 1_000_000

    t = t.strip()

    # Relative time
    if re.fullmatch(r"\d+[mhdw]", t, re.IGNORECASE):
        return now_us - _parse_relative(t) * 1_000_000

    # Unix milliseconds
    if t.isdigit() and len(t) >= 13:
        return int(t) * 1_000

    # ISO 8601
    from datetime import datetime, timezone

    try:
        if t.endswith("Z"):
            t = t[:-1] + "+00:00"
        dt = datetime.fromisoformat(t)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1_000_000)
    except ValueError:
        pass

    raise ValueError(f"Cannot parse time: {t!r}. Use ISO 8601, Unix ms, or relative (e.g. '1h').")


async def _get(path: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        resp = await client.get(f"{O2_URL}{path}", headers=HEADERS, params=params)
        if not resp.is_success:
            raise RuntimeError(f"OpenObserve API error {resp.status_code}: {resp.text}")
        return resp.json()


async def _post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        resp = await client.post(f"{O2_URL}{path}", headers=HEADERS, json=body)
        if not resp.is_success:
            raise RuntimeError(f"OpenObserve API error {resp.status_code}: {resp.text}")
        return resp.json()


async def _search(sql: str, start_time: int, end_time: int, size: int = 100) -> dict:
    body = {
        "query": {
            "sql": sql,
            "start_time": start_time,
            "end_time": end_time,
            "from": 0,
            "size": size,
        }
    }
    return await _post(f"/api/{O2_ORG}/_search", body)


# ---------------------------------------------------------------------------
# Tools — Core
# ---------------------------------------------------------------------------


@mcp.tool()
async def o2_search_logs(
    sql: str,
    start_time: str = "1h",
    end_time: str = "now",
    limit: int = 100,
) -> str:
    """Run a SQL query against OpenObserve logs.

    Args:
        sql: PostgreSQL-compatible SQL query. Use stream name as table (e.g. 'SELECT * FROM k8s_logs WHERE ...').
        start_time: Start time — ISO 8601, Unix ms, or relative like '1h', '24h', '7d'. Default: 1h ago.
        end_time: End time — same formats, or 'now'. Default: now.
        limit: Max results to return. Default: 100.
    """
    now_us = int(time.time() * 1_000_000)
    st = _to_microseconds(start_time)
    et = now_us if end_time.strip().lower() == "now" else _to_microseconds(end_time)

    result = await _search(sql, st, et, limit)
    took = result.get("took", 0)
    total = result.get("total", 0)
    hits = result.get("hits", [])

    lines = [f"Query took {took}ms. {total} total matches, returning {len(hits)}."]
    for h in hits:
        lines.append(json.dumps(h, default=str))
    return "\n".join(lines)


@mcp.tool()
async def o2_error_summary(period: str = "1h") -> str:
    """Get a summary of errors and warnings grouped by namespace and pod.

    Args:
        period: Time window to look back. Default: '1h'. Examples: '30m', '6h', '24h', '7d'.
    """
    now_us = int(time.time() * 1_000_000)
    st = _to_microseconds(period)

    sql = (
        "SELECT log_level, k8s_namespace, k8s_pod, COUNT(*) as count "
        f"FROM {DEFAULT_STREAM} "
        "WHERE log_level IN ('error', 'ERROR', 'warning', 'WARNING', 'warn', 'WARN', 'critical', 'CRITICAL', 'fatal', 'FATAL') "
        "GROUP BY log_level, k8s_namespace, k8s_pod "
        "ORDER BY count DESC"
    )
    result = await _search(sql, st, now_us, 1000)
    hits = result.get("hits", [])

    if not hits:
        return f"No errors or warnings in the last {period}."

    lines = [f"Error/warning summary for the last {period}:"]
    lines.append(f"{'Level':<10} {'Namespace':<25} {'Pod':<45} {'Count':>6}")
    lines.append("-" * 90)
    for h in hits:
        level = h.get("log_level", "?")
        ns = h.get("k8s_namespace", "?")
        pod = h.get("k8s_pod", "?")
        count = h.get("count", 0)
        lines.append(f"{level:<10} {ns:<25} {pod:<45} {count:>6}")
    return "\n".join(lines)


@mcp.tool()
async def o2_recent_errors(
    limit: int = 20,
    namespace: str = "",
    period: str = "1h",
) -> str:
    """Fetch the most recent error-level log lines.

    Args:
        limit: Number of log lines to return. Default: 20.
        namespace: Filter by Kubernetes namespace. Leave empty for all.
        period: Time window to look back. Default: '1h'.
    """
    now_us = int(time.time() * 1_000_000)
    st = _to_microseconds(period)

    where = "WHERE log_level IN ('error', 'ERROR', 'critical', 'CRITICAL', 'fatal', 'FATAL')"
    if namespace:
        where += f" AND k8s_namespace = '{namespace}'"

    sql = (
        f"SELECT _timestamp, k8s_namespace, k8s_pod, k8s_container, message "
        f"FROM {DEFAULT_STREAM} {where} "
        f"ORDER BY _timestamp DESC LIMIT {limit}"
    )
    result = await _search(sql, st, now_us, limit)
    hits = result.get("hits", [])

    if not hits:
        return f"No errors in the last {period}."

    lines = [f"{len(hits)} recent errors (last {period}):"]
    for h in hits:
        ts = h.get("_timestamp", "")
        ns = h.get("k8s_namespace", "?")
        pod = h.get("k8s_pod", "?")
        msg = h.get("message", "")
        if len(msg) > 300:
            msg = msg[:300] + "..."
        lines.append(f"\n[{ts}] {ns}/{pod}")
        lines.append(f"  {msg}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Tools — Discovery
# ---------------------------------------------------------------------------


@mcp.tool()
async def o2_list_streams(stream_type: str = "") -> str:
    """List all OpenObserve streams with doc count and storage size.

    Args:
        stream_type: Filter by type: 'logs', 'metrics', or 'traces'. Empty for all.
    """
    params = {}
    if stream_type:
        params["type"] = stream_type

    data = await _get(f"/api/{O2_ORG}/streams", params)
    streams = data.get("list", [])

    if not streams:
        return "No streams found."

    lines = [f"{'Name':<30} {'Type':<10} {'Docs':>10} {'Size (MB)':>10}"]
    lines.append("-" * 65)
    for s in streams:
        name = s.get("name", "?")
        stype = s.get("stream_type", "?")
        stats = s.get("stats", {})
        docs = stats.get("doc_num", 0)
        size_mb = stats.get("storage_size", 0)
        lines.append(f"{name:<30} {stype:<10} {docs:>10} {size_mb:>10.1f}")
    return "\n".join(lines)


@mcp.tool()
async def o2_stream_schema(stream: str = DEFAULT_STREAM) -> str:
    """Get field names and types for a stream.

    Args:
        stream: Stream name. Default: k8s_logs.
    """
    data = await _get(f"/api/{O2_ORG}/streams", {"type": "logs", "fetchSchema": "true"})
    streams = data.get("list", [])

    target = next((s for s in streams if s.get("name") == stream), None)
    if not target:
        return f"Stream '{stream}' not found."

    schema = target.get("schema", [])
    if not schema:
        return f"No schema available for '{stream}'."

    lines = [f"Schema for '{stream}' ({len(schema)} fields):"]
    lines.append(f"{'Field':<30} {'Type':<15}")
    lines.append("-" * 45)
    for field in sorted(schema, key=lambda f: f.get("name", "")):
        lines.append(f"{field.get('name', '?'):<30} {field.get('type', '?'):<15}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Tools — Alerts
# ---------------------------------------------------------------------------


@mcp.tool()
async def o2_list_alerts() -> str:
    """List all configured alerts."""
    data = await _get(f"/api/v2/{O2_ORG}/alerts")
    alerts = data.get("list", [])

    if not alerts:
        return "No alerts configured."

    lines = [f"{len(alerts)} alerts:"]
    for a in alerts:
        aid = a.get("id", "?")
        name = a.get("name", "?")
        enabled = a.get("enabled", False)
        status = "enabled" if enabled else "disabled"
        lines.append(f"  [{aid}] {name} ({status})")
    return "\n".join(lines)


@mcp.tool()
async def o2_get_alert(alert_id: str) -> str:
    """Get details of a specific alert.

    Args:
        alert_id: The alert ID.
    """
    data = await _get(f"/api/v2/{O2_ORG}/alerts/{alert_id}")
    return json.dumps(data, indent=2, default=str)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    mcp.run()
