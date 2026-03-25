#!/usr/bin/env python3
"""Pai Discord responder — WebSocket gateway with session serialization."""

import asyncio
import json
import logging
import os
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

import discord
from aiohttp import web
from transcript import TranscriptStore
from thread_manager import ThreadManager

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format=json.dumps({
        "ts": "%(asctime)s",
        "level": "%(levelname)s",
        "logger": "%(name)s",
        "msg": "%(message)s",
    }),
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("pai-gateway")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

STATE_PATH = Path(os.environ.get("STATE_PATH", "/data/state.json"))
MCP_CONFIG_PATH = Path("/tmp/mcp.json")
GUILD_ID = int(os.environ["DISCORD_GUILD_ID"])
BOT_TOKEN = os.environ["PAI_DISCORD_BOT_TOKEN"]

CLAUDE_TIMEOUT = int(os.environ.get("CLAUDE_TIMEOUT", "300"))
REVIEW_INTERVAL = int(os.environ.get("REVIEW_INTERVAL", "900"))
IDLE_TIMEOUT = int(os.environ.get("IDLE_TIMEOUT", "3600"))
MAX_THREAD_AGE = int(os.environ.get("MAX_THREAD_AGE", "86400"))
REVIEW_ENABLED = os.environ.get("REVIEW_ENABLED", "true").lower() == "true"
HEALTH_PORT = int(os.environ.get("HEALTH_PORT", "8080"))
THINKING_DELAY = 60  # seconds before "still thinking..." message
MAX_PROCESSED_IDS = 1000

# ---------------------------------------------------------------------------
# State persistence
# ---------------------------------------------------------------------------


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except json.JSONDecodeError:
            pass
    return {
        "channels": {},
        "last_review_time": datetime.now(timezone.utc).isoformat(),
    }


def save_state(state: dict):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.replace(STATE_PATH)


# ---------------------------------------------------------------------------
# MCP config
# ---------------------------------------------------------------------------


def write_mcp_config():
    config = {
        "mcpServers": {
            "pai-discord": {
                "type": "stdio",
                "command": "python3",
                "args": ["/opt/discord-mcp/server.py"],
                "env": {
                    "DISCORD_BOT_TOKEN": BOT_TOKEN,
                    "DISCORD_GUILD_ID": str(GUILD_ID),
                },
            },
            "linear-server": {
                "type": "stdio",
                "command": "npx",
                "args": ["-y", "@hatcloud/linear-mcp"],
                "env": {
                    "LINEAR_API_KEY": os.environ.get("LINEAR_API_KEY", ""),
                },
            },
            "pai-memory": {
                "type": "stdio",
                "command": "python3",
                "args": ["/opt/pai/memory_mcp.py"],
                "env": {
                    "MEMORY_PATH": "/data/memory.json",
                },
            },
        }
    }
    fd = os.open(str(MCP_CONFIG_PATH), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(config, f)


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------


class SessionQueue:
    """Per-session serialized queue. Only one Claude invocation at a time."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.lock = asyncio.Lock()
        self.pending: list[discord.Message] = []
        self.last_active = time.monotonic()

    def enqueue(self, msg: discord.Message):
        self.pending.append(msg)
        self.last_active = time.monotonic()

    def drain(self) -> list[discord.Message]:
        msgs = self.pending[:]
        self.pending.clear()
        return msgs


class SessionManager:
    """Maps channel/thread IDs to session queues with dedup."""

    def __init__(self):
        self.sessions: dict[str, SessionQueue] = {}
        self.processed_ids: deque[int] = deque(maxlen=MAX_PROCESSED_IDS)

    def is_processed(self, msg_id: int) -> bool:
        return msg_id in self.processed_ids

    def mark_processed(self, msg_id: int):
        self.processed_ids.append(msg_id)

    def get_or_create(self, session_id: str) -> SessionQueue:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionQueue(session_id)
        return self.sessions[session_id]

    def cleanup_idle(self, max_idle: float = 7200):
        now = time.monotonic()
        expired = [
            sid for sid, sq in self.sessions.items()
            if now - sq.last_active > max_idle and not sq.lock.locked()
        ]
        for sid in expired:
            del self.sessions[sid]
        if expired:
            log.info("Cleaned up %d idle sessions", len(expired))


# ---------------------------------------------------------------------------
# Claude invocation
# ---------------------------------------------------------------------------


async def invoke_claude(prompt: str, trigger_type: str, channel: discord.abc.Messageable) -> bool:
    """Invoke claude --agent pai. Returns True on success.

    Shows typing indicator and sends 'still thinking' if processing is slow.
    """
    log.info("invoke_claude trigger=%s prompt_len=%d", trigger_type, len(prompt))
    start = time.monotonic()

    cmd = [
        "claude",
        "--agent", "pai",
        "-p", prompt,
        "--allowedTools", "mcp__pai-discord__*",
        "--allowedTools", "mcp__linear-server__*",
        "--allowedTools", "mcp__pai-memory__*",
        "--mcp-config", str(MCP_CONFIG_PATH),
        "--output-format", "text",
    ]

    thinking_sent = False

    async def run_subprocess():
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=CLAUDE_TIMEOUT)
        return proc.returncode, stdout, stderr

    async def send_thinking():
        nonlocal thinking_sent
        await asyncio.sleep(THINKING_DELAY)
        if not thinking_sent:
            thinking_sent = True
            try:
                await channel.send("Still thinking...")
            except discord.HTTPException:
                pass

    try:
        async with channel.typing():
            thinking_task = asyncio.create_task(send_thinking())
            try:
                returncode, stdout, stderr = await run_subprocess()
            finally:
                thinking_task.cancel()
                try:
                    await thinking_task
                except asyncio.CancelledError:
                    pass

        elapsed = time.monotonic() - start
        if returncode != 0:
            log.error(
                "claude failed rc=%d trigger=%s elapsed=%.1fs stderr=%s",
                returncode, trigger_type, elapsed,
                (stderr or b"")[:500].decode(errors="replace"),
            )
            return False
        log.info("claude completed trigger=%s elapsed=%.1fs", trigger_type, elapsed)
        return True

    except asyncio.TimeoutError:
        elapsed = time.monotonic() - start
        log.error("claude timed out after %.1fs trigger=%s", elapsed, trigger_type)
        try:
            await channel.send("Sorry, I timed out processing that request.")
        except discord.HTTPException:
            pass
        return False

    except Exception:
        log.error("claude invocation error", exc_info=True)
        return False


# ---------------------------------------------------------------------------
# Prompt building
# ---------------------------------------------------------------------------


def build_mention_prompt(
    msg: discord.Message,
    transcript_text: str,
    channel_name: str,
    channel_id: int,
    batched_msgs: list[discord.Message] | None = None,
) -> str:
    author = msg.author.display_name
    content = msg.content or "[embed/attachment]"
    parts = [
        f"You were mentioned in #{channel_name} (channel ID: {channel_id}).",
    ]
    if transcript_text:
        parts.append(f"\nConversation transcript (oldest to newest):\n---\n{transcript_text}\n---")
    if batched_msgs:
        extra = "\n".join(
            f"  {m.author.display_name}: {m.content or '[embed/attachment]'}"
            for m in batched_msgs
        )
        parts.append(f"\nAdditional messages that arrived while you were processing:\n{extra}")
    parts.append(f"\nThe latest message directed at you is from {author}: {content}")
    parts.append(f"\nRespond in #{channel_name} using the Discord MCP tools.")
    return "\n".join(parts)


def build_review_prompt(unreviewed: list[dict]) -> str:
    grouped: dict[str, list[dict]] = {}
    for msg in unreviewed:
        ch = msg["channel_name"]
        grouped.setdefault(ch, []).append(msg)

    sections = []
    for ch_name, msgs in grouped.items():
        lines = [f"  {m['author']}: {m['content']}" for m in msgs]
        channel_id = msgs[0]["channel_id"]
        sections.append(f"#{ch_name} (channel ID: {channel_id}):\n" + "\n".join(lines))

    summary = "\n\n".join(sections)
    return (
        "Here are recent messages across Discord channels that were not directed at you. "
        "Review them and decide if any warrant a response from you. "
        "If none need a response, do nothing — do not send any messages. "
        "Only respond if you have something genuinely useful to add.\n\n"
        f"{summary}"
    )


# ---------------------------------------------------------------------------
# Health check server
# ---------------------------------------------------------------------------


class HealthServer:
    def __init__(self, bot: "PaiBot"):
        self.bot = bot
        self.app = web.Application()
        self.app.router.add_get("/healthz", self.healthz)
        self.runner: web.AppRunner | None = None

    async def healthz(self, _request: web.Request) -> web.Response:
        if self.bot.is_ready() and not self.bot.is_closed():
            return web.Response(text="ok")
        return web.Response(status=503, text="not ready")

    async def start(self):
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "0.0.0.0", HEALTH_PORT)
        await site.start()
        log.info("Health server listening on :%d", HEALTH_PORT)

    async def stop(self):
        if self.runner:
            await self.runner.cleanup()


# ---------------------------------------------------------------------------
# Discord bot
# ---------------------------------------------------------------------------


class PaiBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        super().__init__(intents=intents)

        self.state = load_state()
        self.session_mgr = SessionManager()
        self.transcripts = TranscriptStore()
        self.thread_mgr = ThreadManager(
            idle_timeout=IDLE_TIMEOUT,
            max_age=MAX_THREAD_AGE,
        )
        self.unreviewed: list[dict] = []
        self.review_lock = asyncio.Lock()
        self.bot_user_id: int = 0
        self.health = HealthServer(self)

    async def on_ready(self):
        self.bot_user_id = self.user.id
        log.info("Pai bot ready as %s (id=%d)", self.user, self.bot_user_id)

        # Seed processed IDs from state watermarks to avoid replaying old messages
        await self._catchup()

        write_mcp_config()
        await self.health.start()

        # Start background tasks
        self.loop.create_task(self._periodic_review())
        self.loop.create_task(self._periodic_sweep())
        self.loop.create_task(self._periodic_cleanup())

    async def _catchup(self):
        """On startup/reconnect, mark recent messages as processed to avoid replays."""
        guild = self.get_guild(GUILD_ID)
        if not guild:
            log.warning("Guild %d not found, skipping catchup", GUILD_ID)
            return
        for channel in guild.text_channels:
            try:
                async for msg in channel.history(limit=20):
                    self.session_mgr.mark_processed(msg.id)
            except discord.Forbidden:
                continue
            except Exception:
                log.warning("Catchup failed for #%s", channel.name, exc_info=True)
        log.info("Catchup complete, seeded %d message IDs", len(self.session_mgr.processed_ids))

    async def on_message(self, msg: discord.Message):
        # Ignore bots and DMs
        if msg.author.bot or not msg.guild:
            return
        if msg.guild.id != GUILD_ID:
            return
        if self.session_mgr.is_processed(msg.id):
            return
        self.session_mgr.mark_processed(msg.id)

        is_mention = self._is_mention(msg)
        is_bound_thread = self._is_in_bound_thread(msg)

        if is_mention or is_bound_thread:
            trigger = "mention" if is_mention else "thread"
            session_id = self._session_id(msg)

            # Bind thread if this is a mention in a thread
            if is_mention and isinstance(msg.channel, discord.Thread):
                self.thread_mgr.bind(str(msg.channel.id), str(msg.channel.parent_id or ""))
            if is_bound_thread:
                self.thread_mgr.touch(str(msg.channel.id))

            # Record in transcript
            self.transcripts.append(
                session_id, "user", msg.author.display_name,
                msg.content or "[embed/attachment]", str(msg.id),
            )

            # Enqueue and process
            session = self.session_mgr.get_or_create(session_id)
            session.enqueue(msg)
            asyncio.create_task(self._process_session(session, msg, trigger))
        else:
            # Buffer for periodic review
            self.unreviewed.append({
                "channel_id": msg.channel.id,
                "channel_name": getattr(msg.channel, "name", str(msg.channel.id)),
                "message_id": msg.id,
                "author": msg.author.display_name,
                "content": msg.content or "[embed/attachment]",
                "timestamp": msg.created_at.isoformat(),
            })
            # Cap buffer
            if len(self.unreviewed) > 100:
                self.unreviewed = self.unreviewed[-100:]

    def _is_mention(self, msg: discord.Message) -> bool:
        if self.user in msg.mentions:
            return True
        if f"<@{self.bot_user_id}>" in (msg.content or ""):
            return True
        return False

    def _is_in_bound_thread(self, msg: discord.Message) -> bool:
        if isinstance(msg.channel, discord.Thread):
            return self.thread_mgr.is_bound(str(msg.channel.id))
        return False

    def _session_id(self, msg: discord.Message) -> str:
        return f"channel:{msg.channel.id}"

    async def _process_session(
        self, session: SessionQueue, trigger_msg: discord.Message, trigger_type: str,
    ):
        """Process enqueued messages for a session, serialized by lock."""
        async with session.lock:
            # Drain any messages that arrived while we were waiting for the lock
            all_msgs = session.drain()
            # The trigger_msg is already in the queue, but grab any extras
            batched = [m for m in all_msgs if m.id != trigger_msg.id]

            # Record batched messages in transcript
            session_id = self._session_id(trigger_msg)
            for m in batched:
                self.transcripts.append(
                    session_id, "user", m.author.display_name,
                    m.content or "[embed/attachment]", str(m.id),
                )

            # Build prompt with transcript context
            transcript_text = self.transcripts.format_for_prompt(session_id)
            channel_name = getattr(trigger_msg.channel, "name", str(trigger_msg.channel.id))
            prompt = build_mention_prompt(
                trigger_msg, transcript_text, channel_name,
                trigger_msg.channel.id, batched or None,
            )

            # Invoke Claude
            success = await invoke_claude(prompt, trigger_type, trigger_msg.channel)

            if not success:
                # Single retry with backoff
                await asyncio.sleep(5)
                success = await invoke_claude(prompt, trigger_type, trigger_msg.channel)
                if not success:
                    try:
                        await trigger_msg.channel.send(
                            "Sorry, something went wrong on my end. Try mentioning me again."
                        )
                    except discord.HTTPException:
                        pass

            # Try to capture bot's response in transcript
            await self._record_bot_reply(session_id, trigger_msg.channel)

            # Compact transcript if needed
            self.transcripts.compact(session_id)

            # Update channel watermark
            self.state["channels"][str(trigger_msg.channel.id)] = {
                "last_message_id": str(trigger_msg.id),
                "name": channel_name,
            }
            save_state(self.state)

    async def _record_bot_reply(self, session_id: str, channel: discord.abc.Messageable):
        """Read recent messages to find bot's reply and record in transcript."""
        try:
            await asyncio.sleep(1)  # brief delay for message to land
            async for msg in channel.history(limit=5):
                if msg.author.id == self.bot_user_id and msg.content:
                    self.transcripts.append(
                        session_id, "assistant", "Pai",
                        msg.content, str(msg.id),
                    )
                    break
        except Exception:
            log.debug("Could not record bot reply", exc_info=True)

    # ------------------------------------------------------------------
    # Periodic tasks
    # ------------------------------------------------------------------

    async def _periodic_review(self):
        """Review unmentioned messages periodically."""
        await self.wait_until_ready()
        while not self.is_closed():
            await asyncio.sleep(REVIEW_INTERVAL)
            if not REVIEW_ENABLED or not self.unreviewed:
                continue
            async with self.review_lock:
                msgs = self.unreviewed[:]
                self.unreviewed.clear()
                if not msgs:
                    continue
                log.info("Periodic review: %d messages", len(msgs))
                # Find a channel to report to (use first message's channel)
                ch = self.get_channel(msgs[0]["channel_id"])
                if ch:
                    prompt = build_review_prompt(msgs)
                    await invoke_claude(prompt, "review", ch)
                self.state["last_review_time"] = datetime.now(timezone.utc).isoformat()
                save_state(self.state)

    async def _periodic_sweep(self):
        """Sweep expired thread bindings."""
        await self.wait_until_ready()
        while not self.is_closed():
            await asyncio.sleep(300)  # every 5 minutes
            expired = self.thread_mgr.sweep()
            for tid in expired:
                # Send farewell
                thread = self.get_channel(int(tid))
                if thread:
                    try:
                        await thread.send(
                            "Signing off from this thread. Mention me again if you need me!"
                        )
                    except discord.HTTPException:
                        pass
                # Clean up
                binding = self.thread_mgr.bindings.get(tid)
                if binding:
                    self.transcripts.delete(binding.session_id)
                self.thread_mgr.unbind(tid)
            if expired:
                log.info("Swept %d expired thread bindings", len(expired))

    async def _periodic_cleanup(self):
        """Clean up idle session queues."""
        await self.wait_until_ready()
        while not self.is_closed():
            await asyncio.sleep(3600)
            self.session_mgr.cleanup_idle()

    async def close(self):
        await self.health.stop()
        save_state(self.state)
        self.thread_mgr.save()
        await super().close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    write_mcp_config()
    bot = PaiBot()
    bot.run(BOT_TOKEN, log_handler=None)


if __name__ == "__main__":
    main()
