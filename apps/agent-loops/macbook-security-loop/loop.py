#!/usr/bin/env python3
"""Autonomous Security Improvement Loop.

Spawns Claude Code iteratively to discover and fix security gaps in the
Mac workstation, with adversarial verification and cost controls.

Rewritten from bash because the script outgrew it — JSON parsing, JWT
generation, integer arithmetic on token counts, and Discord API calls
were all fighting bash's type system.
"""

import argparse
import atexit
import base64
import json
import logging
import os
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

# --- Constants ---
LOCKFILE = Path("/tmp/sec-loop.lock")
STATUS_FILE = Path("/tmp/sec-loop-status.json")
VERIFY_FILE = Path("/tmp/sec-loop-verify.json")
MCP_CONFIG = Path("/tmp/sec-loop-mcp.json")
COST_ANCHOR = Path("/tmp/sec-loop-cost-anchor")
LOGFILE = Path("/tmp/sec-loop.log")

SLEEP_INTERVAL = 600
MAX_VERIFY_RETRIES = 5
DAILY_BUDGET = 200
WORST_CASE_RATE_PER_MTOK = 75

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_DIR = SCRIPT_DIR.parent.parent.parent
DIRECTIVES_FILE = SCRIPT_DIR / "operator-directives.md"

PREFIX = "Security >"
# Bot's application ID — messages from this author are from the bot, not the operator
BOT_APP_ID = "1482826496588956034"

log = logging.getLogger("sec-loop")


# --- Env loading ---

def load_exports():
    """Parse exports.sh and set env vars (avoids sourcing in bash)."""
    exports_path = REPO_DIR / "apps" / "blog" / "exports.sh"
    if not exports_path.exists():
        log.warning("exports.sh not found at %s", exports_path)
        return
    with open(exports_path) as f:
        for line in f:
            line = line.strip()
            if not line.startswith("export "):
                continue
            rest = line[7:]
            if "=" not in rest:
                continue
            key, val = rest.split("=", 1)
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)


# --- Lock file ---

def is_pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def acquire_lock() -> bool:
    if LOCKFILE.exists():
        if not _check_existing_lock():
            return False

    try:
        fd = os.open(str(LOCKFILE), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, f"{os.getpid()}:{int(time.time())}".encode())
        os.close(fd)
        atexit.register(release_lock)
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
        signal.signal(signal.SIGHUP, lambda *_: sys.exit(0))
        return True
    except FileExistsError:
        log.error("Failed to acquire lock (race condition)")
        return False


def release_lock():
    LOCKFILE.unlink(missing_ok=True)


def _check_existing_lock() -> bool:
    """Check an existing lock. Returns True if we can proceed."""
    try:
        content = LOCKFILE.read_text().strip()
        pid_str, ts_str = content.split(":")
        pid, start_time = int(pid_str), int(ts_str)
    except (ValueError, FileNotFoundError):
        LOCKFILE.unlink(missing_ok=True)
        return True

    if not is_pid_alive(pid):
        log.warning("Stale lock from PID %d, removing", pid)
        LOCKFILE.unlink(missing_ok=True)
        return True

    elapsed = int(time.time()) - start_time

    if elapsed < 300:
        log.info("Lock held by PID %d for %ds, waiting 60s...", pid, elapsed)
        time.sleep(60)
        if not is_pid_alive(pid):
            LOCKFILE.unlink(missing_ok=True)
            return True
        log.error("Lock still held by PID %d after wait", pid)
        return False
    elif elapsed < 3600:
        log.error("Lock held by PID %d for %ds (normal operation), skipping", pid, elapsed)
        return False
    else:
        log.warning("Lock held by PID %d for %ds (>1h), killing", pid, elapsed)
        try:
            os.kill(pid, signal.SIGTERM)
            time.sleep(2)
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        LOCKFILE.unlink(missing_ok=True)
        return True


# --- Cost gate ---

def cost_gate() -> bool:
    """Check if today's estimated spend is under budget. Returns True if OK."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total_tokens = _sum_today_tokens(today)

    cost_cents = total_tokens * WORST_CASE_RATE_PER_MTOK // 10000
    budget_cents = DAILY_BUDGET * 100

    cost_str = f"${cost_cents // 100}.{cost_cents % 100:02d}"
    log.info("Today's estimated cost: %s / $%d budget (%d tokens)", cost_str, DAILY_BUDGET, total_tokens)

    if cost_cents >= budget_cents:
        log.warning("Daily budget exceeded")
        return False
    return True


def _sum_today_tokens(today: str) -> int:
    """Sum output + cache_creation tokens from today's JSONL records."""
    total = 0
    claude_dir = Path.home() / ".claude" / "projects"
    if not claude_dir.exists():
        return 0

    for jsonl_path in claude_dir.rglob("*.jsonl"):
        try:
            with open(jsonl_path) as f:
                for line in f:
                    if today not in line:
                        continue
                    try:
                        record = json.loads(line)
                        usage = record.get("message", {}).get("usage", {})
                        if usage:
                            total += usage.get("output_tokens", 0)
                            total += usage.get("cache_creation_input_tokens", 0)
                    except (json.JSONDecodeError, AttributeError):
                        continue
        except (OSError, PermissionError):
            continue

    return total


# --- Discord ---

def discord_send(channel_id: str, content: str, *, dry_run: bool = False):
    """Post a message to a Discord channel. No-op if credentials missing."""
    token = os.environ.get("DISCORD_BOT_TOKEN", "")
    if not token or not channel_id or dry_run:
        return

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    data = json.dumps({"content": content}).encode()
    req = Request(url, data=data, method="POST", headers={
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": "sec-loop/1.0",
    })
    try:
        urlopen(req)  # nosemgrep: dynamic-urllib-use-detected  # hardcoded Discord API URL
    except Exception:
        pass


def discord_status(msg: str, *, dry_run: bool = False):
    channel = os.environ.get("DISCORD_STATUS_CHANNEL_ID", "")
    discord_send(channel, f"{PREFIX} {msg}", dry_run=dry_run)


def discord_log(msg: str, *, dry_run: bool = False):
    channel = os.environ.get("DISCORD_LOG_CHANNEL_ID", "")
    discord_send(channel, f"{PREFIX} {msg}", dry_run=dry_run)


# --- Operator directives from Discord ---

def poll_operator_directives():
    """Read recent #status-updates messages and save any human (non-bot) messages as directives."""
    token = os.environ.get("DISCORD_BOT_TOKEN", "")
    channel = os.environ.get("DISCORD_STATUS_CHANNEL_ID", "")
    if not token or not channel:
        return

    url = f"https://discord.com/api/v10/channels/{channel}/messages?limit=10"
    req = Request(url, headers={
        "Authorization": f"Bot {token}",
        "User-Agent": "sec-loop/1.0",
    })
    try:
        messages = json.loads(urlopen(req).read())  # nosemgrep: dynamic-urllib-use-detected
    except Exception:
        log.warning("Failed to read Discord messages for operator directives")
        return

    # Filter to human messages (not from the bot)
    human_msgs = []
    for msg in messages:
        author = msg.get("author", {})
        if author.get("id") == BOT_APP_ID or author.get("bot", False):
            continue
        human_msgs.append({
            "id": msg["id"],
            "author": author.get("username", "unknown"),
            "content": msg.get("content", ""),
            "timestamp": msg.get("timestamp", ""),
        })

    if not human_msgs:
        return

    # Read existing directives to avoid duplicates
    existing_ids: set[str] = set()
    if DIRECTIVES_FILE.exists():
        for line in DIRECTIVES_FILE.read_text().splitlines():
            # Lines look like: "- [1234567890] message content"
            if line.startswith("- ["):
                msg_id = line.split("]")[0].removeprefix("- [")
                existing_ids.add(msg_id)

    new_msgs = [m for m in human_msgs if m["id"] not in existing_ids]
    if not new_msgs:
        return

    # Append new directives
    with open(DIRECTIVES_FILE, "a") as f:
        if not DIRECTIVES_FILE.exists() or DIRECTIVES_FILE.stat().st_size == 0:
            f.write("# Operator Directives\n\n")
            f.write("Messages from the operator in #status-updates.\n")
            f.write("These are instructions — follow them.\n\n")
        for msg in reversed(new_msgs):  # oldest first
            f.write(f"- [{msg['id']}] ({msg['timestamp']}) {msg['author']}: {msg['content']}\n")

    log.info("Added %d new operator directive(s) from Discord", len(new_msgs))

    # Ack in Discord with a summary of what we picked up
    summaries = [m["content"][:80] for m in new_msgs]
    ack = f"Picked up {len(new_msgs)} directive(s): " + "; ".join(summaries)
    discord_status(ack)


# --- Git push ---

def git_push():
    """Push using a short-lived GitHub App installation token."""
    app_id = os.environ.get("GITHUB_APP_ID", "")
    install_id = os.environ.get("GITHUB_INSTALL_ID", "")
    pem_b64 = os.environ.get("GITHUB_APP_PRIVATE_KEY_B64", "")

    if not all([app_id, install_id, pem_b64]):
        log.error("Missing GitHub App credentials, skipping push")
        return

    pem_data = base64.b64decode(pem_b64)
    with tempfile.NamedTemporaryFile(suffix=".pem", delete=False) as f:
        f.write(pem_data)
        pem_path = f.name

    try:
        now = int(time.time())
        header = _b64url(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
        payload = _b64url(json.dumps({"iss": app_id, "iat": now - 60, "exp": now + 300}).encode())
        signing_input = f"{header}.{payload}"

        sig_result = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", pem_path, "-binary"],
            input=signing_input.encode(), capture_output=True, check=True,
        )
        sig = _b64url(sig_result.stdout)
        jwt_token = f"{header}.{payload}.{sig}"
    finally:
        os.unlink(pem_path)

    req = Request(
        f"https://api.github.com/app/installations/{install_id}/access_tokens",
        method="POST",
        headers={"Authorization": f"Bearer {jwt_token}", "Accept": "application/vnd.github+json"},
    )
    resp = json.loads(urlopen(req).read())  # nosemgrep: dynamic-urllib-use-detected  # hardcoded GitHub API URL
    token = resp["token"]

    try:
        subprocess.run(
            ["git", "remote", "set-url", "origin", f"https://x-access-token:{token}@github.com/kylep/multi.git"],
            check=True, cwd=REPO_DIR,
        )
        subprocess.run(["git", "push", "-u", "origin", "HEAD"], check=True, cwd=REPO_DIR)
    finally:
        subprocess.run(
            ["git", "remote", "set-url", "origin", "https://github.com/kylep/multi.git"],
            cwd=REPO_DIR,
        )


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


# --- Helpers ---

def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def git_restore_except_notes():
    """Restore all changed files except run-notes.md."""
    result = subprocess.run(
        ["git", "diff", "--name-only"], capture_output=True, text=True, cwd=REPO_DIR,
    )
    files = [f for f in result.stdout.strip().split("\n") if f and "run-notes.md" not in f]
    if files:
        subprocess.run(["git", "restore"] + files, cwd=REPO_DIR, check=False)


def write_mcp_config():
    """Write a minimal Discord-only MCP config."""
    config = {
        "mcpServers": {
            "discord": {
                "command": str(REPO_DIR / "apps" / "mcp-servers" / "discord" / ".venv" / "bin" / "python"),
                "args": [str(REPO_DIR / "apps" / "mcp-servers" / "discord" / "server.py")],
            }
        }
    }
    MCP_CONFIG.write_text(json.dumps(config, indent=2))


def escalation_message(attempt: int) -> str:
    if attempt == 2:
        return (
            "Try a fundamentally different implementation approach to the same "
            "finding. Do NOT just patch the previous attempt — rethink the mechanism."
        )
    elif attempt == 3:
        return (
            "Two attempts at this finding have failed. Consider whether this "
            "finding is even fixable with the tools available. If you can make "
            "it work with a completely different mechanism, do so. Otherwise, "
            "ABANDON this finding and pick a different security gap entirely — "
            "there are many other areas to improve."
        )
    elif attempt >= 4:
        return (
            f"STRONGLY RECOMMENDED: Abandon this finding. Pick a completely "
            f"different security improvement in a different area (SSH, firewall, "
            f"macOS settings, file permissions, etc.). The verifier has beaten "
            f"{attempt} approaches to this problem — continuing to iterate on "
            f"the same finding is wasting budget. Move on to something the "
            f"verifier can't easily bypass."
        )
    return ""


def run_claude(prompt: str, *, max_turns: int, max_budget: float):
    """Run claude -p with the given prompt. Returns the exit code."""
    cmd = [
        "claude", "-p", prompt,
        "--model", "sonnet",
        "--output-format", "json",
        "--max-turns", str(max_turns),
        "--max-budget-usd", f"{max_budget:.2f}",
        "--mcp-config", str(MCP_CONFIG),
        "--no-session-persistence",
        "--dangerously-skip-permissions",
    ]
    env = {
        **os.environ,
        "SEC_LOOP_ITERATION": os.environ.get("SEC_LOOP_ITERATION", "0"),
        "SEC_LOOP_STATUS_CHANNEL": os.environ.get("DISCORD_STATUS_CHANNEL_ID", ""),
        "SEC_LOOP_LOG_CHANNEL": os.environ.get("DISCORD_LOG_CHANNEL_ID", ""),
    }
    result = subprocess.run(cmd, cwd=REPO_DIR, env=env, check=False)
    return result.returncode


def cleanup():
    for f in [STATUS_FILE, VERIFY_FILE, COST_ANCHOR, MCP_CONFIG]:
        f.unlink(missing_ok=True)
    # Don't delete DIRECTIVES_FILE — it persists across runs


# --- Main loop ---

def run_iteration(iteration: int, *, dry_run: bool) -> str:
    """Run one improve→verify cycle. Returns 'verified', 'done', or 'failed'."""
    finding = ""
    prior_failure = ""

    for attempt in range(1, MAX_VERIFY_RETRIES + 1):
        log.info("--- Attempt %d/%d ---", attempt, MAX_VERIFY_RETRIES)
        if attempt > 1:
            discord_log(f"{finding or 'unknown'}: attempt {attempt}", dry_run=dry_run)

        STATUS_FILE.unlink(missing_ok=True)
        VERIFY_FILE.unlink(missing_ok=True)

        # --- Improvement phase ---
        prompt = (SCRIPT_DIR / "prompt.md").read_text()
        if prior_failure:
            esc = escalation_message(attempt)
            prompt += (
                f"\n\n## Previous attempt failed verification "
                f"(attempt {attempt - 1}/{MAX_VERIFY_RETRIES})\n\n"
                f"**Bypass that succeeded:** {prior_failure}\n\n{esc}"
            )

        log.info("Running improvement agent...")
        run_claude(prompt, max_turns=30, max_budget=5.00)

        # Read status
        if not STATUS_FILE.exists():
            log.warning("Status file missing (agent may have hit budget)")
            discord_log(f"{finding or f'iteration {iteration}'}: status file missing, restoring", dry_run=dry_run)
            git_restore_except_notes()
            break

        status = read_json(STATUS_FILE)
        action = status.get("action", "unknown")

        if action == "done":
            reason = status.get("reason", "no reason given")
            log.info("Agent reports no more improvements: %s", reason)
            discord_status(f"Nothing left to improve — {reason}", dry_run=dry_run)
            return "done"
        elif action != "improved":
            log.warning("Unexpected action '%s' in status file", action)
            discord_log(f"{finding or f'iteration {iteration}'}: unexpected status '{action}', restoring", dry_run=dry_run)
            git_restore_except_notes()
            break

        finding = status.get("finding", "unknown")
        log.info("Finding: %s", finding)

        # --- Verification phase ---
        log.info("Running verification agent...")
        verify_prompt = (SCRIPT_DIR / "verify-prompt.md").read_text()
        if attempt == MAX_VERIFY_RETRIES:
            verify_prompt += (
                f"\n\n## Final attempt ({attempt}/{MAX_VERIFY_RETRIES})\n\n"
                "This is the last retry. Focus on whether the security measure "
                "provides **meaningful protection** against realistic threats. "
                "Do not fail the verification for edge cases that require exotic "
                "tooling, unlikely attack chains, or theoretical bypasses that no "
                "real attacker would use. Pass if the improvement is a net positive "
                "for security, even if imperfect."
            )

        run_claude(verify_prompt, max_turns=12, max_budget=3.00)

        verify = read_json(VERIFY_FILE)
        verify_result = verify.get("result", "unknown")

        if verify_result == "pass":
            log.info("Verification passed (attempt %d)", attempt)

            if not dry_run:
                subprocess.run(["git", "add", "-A"], cwd=REPO_DIR, check=True)
                msg = (
                    f"sec-loop: fix — {finding}\n\n"
                    f"Iteration: {iteration} (verified on attempt {attempt})\n"
                    f"Automated by: apps/agent-loops/macbook-security-loop/loop.py\n\n"
                    f"Co-Authored-By: Claude Sonnet <noreply@anthropic.com>"
                )
                subprocess.run(["git", "commit", "-m", msg], cwd=REPO_DIR, check=True)
                git_push()
                branch = subprocess.run(
                    ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                    capture_output=True, text=True, cwd=REPO_DIR,
                ).stdout.strip()
                discord_status(f"Done, pushed to {branch} — {finding}", dry_run=dry_run)
                discord_log(f"{finding}: verified, committed and pushed", dry_run=dry_run)
            else:
                log.info("DRY-RUN: Skipping git commit and discord notification")

            return "verified"

        # Verification failed
        prior_failure = verify.get("failure_reason", "unknown")
        log.info("Verification FAILED (attempt %d/%d): %s", attempt, MAX_VERIFY_RETRIES, prior_failure)
        discord_log(f"{finding}: {prior_failure}", dry_run=dry_run)
        git_restore_except_notes()

    # All attempts exhausted
    log.info("All %d attempts failed for iteration %d", MAX_VERIFY_RETRIES, iteration)
    if not dry_run:
        discord_status(f"Couldn't make that work after {MAX_VERIFY_RETRIES} attempts, moving on", dry_run=dry_run)
        discord_log(f"{finding}: failed all {MAX_VERIFY_RETRIES} attempts, rolling back and moving on", dry_run=dry_run)
    return "failed"


def main():
    parser = argparse.ArgumentParser(description="Autonomous Security Improvement Loop")
    parser.add_argument("--dry-run", action="store_true", help="Single iteration, no commits or Discord")
    parser.add_argument("--one-shot", action="store_true", help="Run one iteration then exit")
    args = parser.parse_args()

    # Setup logging to stdout + file
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(LOGFILE, mode="a"),
        ],
    )

    load_exports()

    # Cost anchor for find -newer equivalent (not needed in Python, but keep for compat)
    COST_ANCHOR.touch()

    if not acquire_lock():
        sys.exit(1)

    write_mcp_config()
    os.chdir(REPO_DIR)

    log.info("=== Security Improvement Loop started (PID %d, dry_run=%s) ===", os.getpid(), args.dry_run)

    iteration = 0
    try:
        while True:
            iteration += 1
            log.info("")
            log.info("--- Iteration %d ---", iteration)

            if not cost_gate():
                discord_status(f"Stopping — daily budget of ${DAILY_BUDGET} exceeded", dry_run=args.dry_run)
                log.info("Exiting: budget exceeded")
                break

            discord_log(f"Starting iteration {iteration}", dry_run=args.dry_run)

            # Check for operator messages in #status-updates
            if not args.dry_run:
                poll_operator_directives()

            os.environ["SEC_LOOP_ITERATION"] = str(iteration)

            result = run_iteration(iteration, dry_run=args.dry_run)

            if result == "done":
                break

            if args.dry_run:
                log.info("DRY-RUN: Exiting after one iteration")
                break
            if args.one_shot:
                log.info("ONE-SHOT: Exiting after one iteration")
                break

            log.info("Sleeping %ds before next iteration...", SLEEP_INTERVAL)
            time.sleep(SLEEP_INTERVAL)
    finally:
        cleanup()
        log.info("=== Security Improvement Loop finished ===")


if __name__ == "__main__":
    main()
