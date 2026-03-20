"""Unit tests for the security improvement loop."""

import json
import os
import tempfile
import time
from pathlib import Path
from unittest import mock

import pytest

# Patch paths before importing loop so tests use temp dirs
_tmp = tempfile.mkdtemp()


@pytest.fixture(autouse=True)
def _patch_paths(monkeypatch, tmp_path):
    """Redirect all file paths to temp dirs so tests don't touch real state."""
    monkeypatch.setattr("loop.LOCKFILE", tmp_path / "sec-loop.lock")
    monkeypatch.setattr("loop.STATUS_FILE", tmp_path / "sec-loop-status.json")
    monkeypatch.setattr("loop.VERIFY_FILE", tmp_path / "sec-loop-verify.json")
    monkeypatch.setattr("loop.MCP_CONFIG", tmp_path / "sec-loop-mcp.json")
    monkeypatch.setattr("loop.COST_ANCHOR", tmp_path / "sec-loop-cost-anchor")
    monkeypatch.setattr("loop.LOGFILE", tmp_path / "sec-loop.log")
    monkeypatch.setattr("loop.REPO_DIR", tmp_path / "repo")
    monkeypatch.setattr("loop.SCRIPT_DIR", tmp_path / "script")
    (tmp_path / "repo").mkdir()
    (tmp_path / "script").mkdir()


# Import after fixture is defined (paths get patched at runtime)
import loop  # noqa: E402


# --- load_exports ---

class TestLoadExports:
    def test_parses_double_quoted(self, tmp_path, monkeypatch):
        exports = tmp_path / "repo" / "apps" / "blog" / "exports.sh"
        exports.parent.mkdir(parents=True)
        exports.write_text('export FOO="bar"\nexport BAZ="qux"\n')
        monkeypatch.delenv("FOO", raising=False)
        monkeypatch.delenv("BAZ", raising=False)
        loop.load_exports()
        assert os.environ["FOO"] == "bar"
        assert os.environ["BAZ"] == "qux"

    def test_does_not_override_existing(self, tmp_path, monkeypatch):
        exports = tmp_path / "repo" / "apps" / "blog" / "exports.sh"
        exports.parent.mkdir(parents=True)
        exports.write_text('export FOO="new"\n')
        monkeypatch.setenv("FOO", "existing")
        loop.load_exports()
        assert os.environ["FOO"] == "existing"

    def test_missing_file(self, tmp_path):
        # Should not raise
        loop.load_exports()


# --- is_pid_alive ---

class TestIsPidAlive:
    def test_current_process(self):
        assert loop.is_pid_alive(os.getpid()) is True

    def test_dead_pid(self):
        assert loop.is_pid_alive(99999999) is False


# --- Lock file ---

class TestLockFile:
    def test_acquire_and_release(self):
        assert loop.acquire_lock() is True
        assert loop.LOCKFILE.exists()
        content = loop.LOCKFILE.read_text()
        assert str(os.getpid()) in content
        loop.release_lock()
        assert not loop.LOCKFILE.exists()

    def test_stale_lock_removed(self):
        loop.LOCKFILE.write_text("99999999:1000000000")
        assert loop.acquire_lock() is True
        loop.release_lock()

    def test_own_lock_blocks(self):
        loop.LOCKFILE.write_text(f"{os.getpid()}:{int(time.time())}")
        # Our own PID is alive, elapsed < 300s, it will wait 60s then fail
        # Mock time.sleep to avoid waiting
        with mock.patch("time.sleep"):
            result = loop._check_existing_lock()
            assert result is False

    def test_race_condition(self):
        # Pre-create the lock file to simulate a race
        fd = os.open(str(loop.LOCKFILE), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, b"99999999:1000000000")
        os.close(fd)
        # The stale check should clean it, then O_EXCL should succeed
        assert loop.acquire_lock() is True
        loop.release_lock()


# --- Cost gate ---

class TestCostGate:
    def test_under_budget(self, tmp_path, monkeypatch):
        # Create a fake JSONL with small token counts
        today = time.strftime("%Y-%m-%d", time.gmtime())
        projects = tmp_path / "claude_projects"
        projects.mkdir()
        jsonl = projects / "test.jsonl"
        record = {"message": {"usage": {"output_tokens": 1000, "cache_creation_input_tokens": 500}}, "timestamp": today}
        jsonl.write_text(json.dumps(record) + "\n")
        monkeypatch.setattr("loop._sum_today_tokens", lambda _: 1500)
        assert loop.cost_gate() is True

    def test_over_budget(self, monkeypatch):
        # 200 * 100 = 20000 cents budget. Need tokens * 75 / 10000 >= 20000
        # tokens >= 20000 * 10000 / 75 = 2666667
        monkeypatch.setattr("loop._sum_today_tokens", lambda _: 3000000)
        assert loop.cost_gate() is False

    def test_zero_tokens(self, monkeypatch):
        monkeypatch.setattr("loop._sum_today_tokens", lambda _: 0)
        assert loop.cost_gate() is True


class TestSumTodayTokens:
    def test_sums_from_jsonl(self, tmp_path, monkeypatch):
        today = time.strftime("%Y-%m-%d", time.gmtime())
        claude_dir = tmp_path / ".claude" / "projects" / "test"
        claude_dir.mkdir(parents=True)
        jsonl = claude_dir / "log.jsonl"
        records = [
            {"message": {"usage": {"output_tokens": 100, "cache_creation_input_tokens": 50}}, "ts": today},
            {"message": {"usage": {"output_tokens": 200}}, "ts": today},
            {"message": {"other": True}, "ts": today},  # no usage
            {"message": {"usage": {"output_tokens": 300}}, "ts": "2020-01-01"},  # wrong day
        ]
        jsonl.write_text("\n".join(json.dumps(r) for r in records))
        monkeypatch.setattr(Path, "home", lambda: tmp_path)
        result = loop._sum_today_tokens(today)
        assert result == 350  # 100+50 + 200, skips no-usage and wrong-day

    def test_no_files(self, tmp_path, monkeypatch):
        monkeypatch.setattr(Path, "home", lambda: tmp_path)
        assert loop._sum_today_tokens("2026-03-20") == 0


# --- Discord ---

class TestDiscord:
    def test_send_noop_without_token(self, monkeypatch):
        monkeypatch.delenv("DISCORD_BOT_TOKEN", raising=False)
        # Should not raise
        loop.discord_send("12345", "test")

    def test_send_noop_dry_run(self, monkeypatch):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake")
        loop.discord_send("12345", "test", dry_run=True)

    def test_send_noop_empty_channel(self, monkeypatch):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake")
        loop.discord_send("", "test")

    @mock.patch("loop.urlopen")
    def test_send_posts(self, mock_urlopen, monkeypatch):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake-token")
        loop.discord_send("12345", "hello")
        mock_urlopen.assert_called_once()
        req = mock_urlopen.call_args[0][0]
        assert "12345" in req.full_url
        body = json.loads(req.data)
        assert body["content"] == "hello"

    @mock.patch("loop.urlopen", side_effect=Exception("network error"))
    def test_send_swallows_errors(self, mock_urlopen, monkeypatch):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake-token")
        # Should not raise
        loop.discord_send("12345", "test")


# --- Escalation ---

class TestEscalation:
    def test_attempt_1_empty(self):
        assert loop.escalation_message(1) == ""

    def test_attempt_2(self):
        msg = loop.escalation_message(2)
        assert "fundamentally different" in msg

    def test_attempt_3(self):
        msg = loop.escalation_message(3)
        assert "ABANDON" in msg

    def test_attempt_4(self):
        msg = loop.escalation_message(4)
        assert "STRONGLY RECOMMENDED" in msg

    def test_attempt_5(self):
        msg = loop.escalation_message(5)
        assert "STRONGLY RECOMMENDED" in msg
        assert "5" in msg


# --- poll_operator_directives ---

class TestPollOperatorDirectives:
    @mock.patch("loop.urlopen")
    def test_saves_human_messages(self, mock_urlopen, monkeypatch, tmp_path):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake")
        monkeypatch.setenv("DISCORD_STATUS_CHANNEL_ID", "12345")
        monkeypatch.setattr("loop.DIRECTIVES_FILE", tmp_path / "directives.md")

        mock_urlopen.return_value.__enter__ = lambda s: s
        mock_urlopen.return_value.__exit__ = mock.Mock(return_value=False)
        mock_urlopen.return_value.read.return_value = json.dumps([
            {"id": "111", "author": {"id": "human123", "username": "kyle", "bot": False},
             "content": "focus on firewall rules", "timestamp": "2026-03-20T10:00:00Z"},
            {"id": "222", "author": {"id": loop.BOT_APP_ID, "username": "Journalist", "bot": True},
             "content": "Security > doing stuff", "timestamp": "2026-03-20T10:01:00Z"},
        ]).encode()

        loop.poll_operator_directives()

        directives = (tmp_path / "directives.md").read_text()
        assert "focus on firewall rules" in directives
        assert "doing stuff" not in directives

    @mock.patch("loop.urlopen")
    def test_deduplicates(self, mock_urlopen, monkeypatch, tmp_path):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake")
        monkeypatch.setenv("DISCORD_STATUS_CHANNEL_ID", "12345")
        directives_path = tmp_path / "directives.md"
        monkeypatch.setattr("loop.DIRECTIVES_FILE", directives_path)

        directives_path.write_text("- [111] (2026-03-20T10:00:00Z) kyle: focus on firewall rules\n")

        mock_urlopen.return_value.__enter__ = lambda s: s
        mock_urlopen.return_value.__exit__ = mock.Mock(return_value=False)
        mock_urlopen.return_value.read.return_value = json.dumps([
            {"id": "111", "author": {"id": "human123", "username": "kyle", "bot": False},
             "content": "focus on firewall rules", "timestamp": "2026-03-20T10:00:00Z"},
        ]).encode()

        loop.poll_operator_directives()

        # Should not duplicate
        content = directives_path.read_text()
        assert content.count("111") == 1

    def test_noop_without_token(self, monkeypatch):
        monkeypatch.delenv("DISCORD_BOT_TOKEN", raising=False)
        # Should not raise
        loop.poll_operator_directives()

    @mock.patch("loop.urlopen", side_effect=Exception("network error"))
    def test_swallows_errors(self, mock_urlopen, monkeypatch):
        monkeypatch.setenv("DISCORD_BOT_TOKEN", "fake")
        monkeypatch.setenv("DISCORD_STATUS_CHANNEL_ID", "12345")
        # Should not raise
        loop.poll_operator_directives()


# --- read_json ---

class TestReadJson:
    def test_valid_json(self, tmp_path):
        f = tmp_path / "test.json"
        f.write_text('{"action": "improved", "finding": "test gap"}')
        assert loop.read_json(f) == {"action": "improved", "finding": "test gap"}

    def test_missing_file(self, tmp_path):
        assert loop.read_json(tmp_path / "nonexistent.json") == {}

    def test_invalid_json(self, tmp_path):
        f = tmp_path / "bad.json"
        f.write_text("not json{{{")
        assert loop.read_json(f) == {}


# --- write_mcp_config ---

class TestWriteMcpConfig:
    def test_creates_valid_json(self):
        loop.write_mcp_config()
        config = json.loads(loop.MCP_CONFIG.read_text())
        assert "mcpServers" in config
        assert "discord" in config["mcpServers"]


# --- git_restore_except_notes ---

class TestGitRestore:
    @mock.patch("subprocess.run")
    def test_restores_non_notes_files(self, mock_run):
        mock_run.return_value = mock.Mock(stdout="file1.sh\nrun-notes.md\nfile2.yml\n")
        loop.git_restore_except_notes()
        calls = mock_run.call_args_list
        # Second call should be git restore with only file1.sh and file2.yml
        restore_call = calls[1]
        assert "git" in restore_call[0][0]
        assert "run-notes.md" not in restore_call[0][0]

    @mock.patch("subprocess.run")
    def test_no_files_to_restore(self, mock_run):
        mock_run.return_value = mock.Mock(stdout="run-notes.md\n")
        loop.git_restore_except_notes()
        # Should only have the diff call, no restore call
        assert mock_run.call_count == 1


# --- run_iteration ---

class TestRunIteration:
    @mock.patch("loop.git_push")
    @mock.patch("subprocess.run")
    @mock.patch("loop.run_claude")
    def test_verified_on_first_attempt(self, mock_claude, mock_subproc, mock_push, tmp_path):
        # Setup prompt files
        (tmp_path / "script" / "prompt.md").write_text("improve")
        (tmp_path / "script" / "verify-prompt.md").write_text("verify")

        call_count = [0]

        def fake_claude(prompt, *, max_turns, max_budget):
            call_count[0] += 1
            if call_count[0] == 1:  # improvement
                loop.STATUS_FILE.write_text(json.dumps({
                    "action": "improved",
                    "finding": "test gap",
                }))
            elif call_count[0] == 2:  # verification
                loop.VERIFY_FILE.write_text(json.dumps({"result": "pass"}))
            return 0

        mock_claude.side_effect = fake_claude
        mock_subproc.return_value = mock.Mock(stdout="main\n", returncode=0)

        result = loop.run_iteration(1, dry_run=True)
        assert result == "verified"

    @mock.patch("loop.run_claude")
    def test_done_signal(self, mock_claude, tmp_path):
        (tmp_path / "script" / "prompt.md").write_text("improve")

        def fake_claude(prompt, *, max_turns, max_budget):
            loop.STATUS_FILE.write_text(json.dumps({
                "action": "done",
                "reason": "all gaps addressed",
            }))
            return 0

        mock_claude.side_effect = fake_claude

        result = loop.run_iteration(1, dry_run=True)
        assert result == "done"

    @mock.patch("loop.git_restore_except_notes")
    @mock.patch("loop.run_claude")
    def test_all_attempts_fail(self, mock_claude, mock_restore, tmp_path, monkeypatch):
        monkeypatch.setattr("loop.MAX_VERIFY_RETRIES", 2)
        (tmp_path / "script" / "prompt.md").write_text("improve")
        (tmp_path / "script" / "verify-prompt.md").write_text("verify")

        call_count = [0]

        def fake_claude(prompt, *, max_turns, max_budget):
            call_count[0] += 1
            if call_count[0] % 2 == 1:  # improvement
                loop.STATUS_FILE.write_text(json.dumps({
                    "action": "improved",
                    "finding": "hard problem",
                }))
            else:  # verification
                loop.VERIFY_FILE.write_text(json.dumps({
                    "result": "fail",
                    "failure_reason": "bypass worked",
                }))
            return 0

        mock_claude.side_effect = fake_claude

        result = loop.run_iteration(1, dry_run=True)
        assert result == "failed"
        assert mock_restore.call_count == 2  # once per failed attempt

    @mock.patch("loop.git_restore_except_notes")
    @mock.patch("loop.run_claude")
    def test_missing_status_file(self, mock_claude, mock_restore, tmp_path):
        (tmp_path / "script" / "prompt.md").write_text("improve")

        mock_claude.return_value = 0  # don't write status file

        result = loop.run_iteration(1, dry_run=True)
        assert result == "failed"
        mock_restore.assert_called_once()


# --- b64url ---

class TestB64Url:
    def test_encoding(self):
        result = loop._b64url(b'{"alg":"RS256","typ":"JWT"}')
        assert "=" not in result
        assert "+" not in result
        assert "/" not in result
