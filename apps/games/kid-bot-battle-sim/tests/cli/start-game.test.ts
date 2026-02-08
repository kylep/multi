import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import path from "node:path";

const CLI_ENTRY = path.resolve(
  import.meta.dirname,
  "../../packages/cli/src/index.ts"
);

function runCli(
  lines: string[]
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn("node", ["--import", "tsx/esm", CLI_ENTRY], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });

    let stdout = "";
    let stderr = "";
    let lineIndex = 0;
    let promptsSeen = 0;

    function tryWrite() {
      // Count prompts ("> " or "Player Name:")
      const prompts = (stdout.match(/(Player Name:|> )/g) || []).length;
      if (prompts > promptsSeen && lineIndex < lines.length) {
        promptsSeen = prompts;
        child.stdin.write(lines[lineIndex] + "\n");
        lineIndex++;
      }
      if (lineIndex >= lines.length) {
        child.stdin.end();
      }
    }

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      tryWrite();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}

describe("CLI: start game", () => {
  it("displays ASCII art title on launch", async () => {
    const { stdout } = await runCli(["TestPlayer", "4"]);
    expect(stdout).toContain("| __ )");
    expect(stdout).toContain("/ ___|");
  });

  it("prompts for player name", async () => {
    const { stdout } = await runCli(["TestPlayer", "4"]);
    expect(stdout).toContain("Player Name:");
  });

  it("shows robot stats after entering name", async () => {
    const { stdout } = await runCli(["TestPlayer", "4"]);
    expect(stdout).toContain("=== TestPlayer ===");
    expect(stdout).toContain("Health:");
    expect(stdout).toContain("Energy:");
    expect(stdout).toContain("Money: $100");
  });

  it("rejects empty name and re-prompts", async () => {
    const { stdout } = await runCli(["", "ActualPlayer", "4"]);
    expect(stdout).toContain("Name cannot be empty");
    expect(stdout).toContain("=== ActualPlayer ===");
  });
});

describe("CLI: main menu", () => {
  it("displays main menu options", async () => {
    const { stdout } = await runCli(["TestPlayer", "4"]);
    expect(stdout).toContain("1. Fight");
    expect(stdout).toContain("2. Shop");
    expect(stdout).toContain("3. Inspect Robot");
    expect(stdout).toContain("4. Quit");
  });

  it("quits gracefully", async () => {
    const { stdout, code } = await runCli(["TestPlayer", "4"]);
    expect(stdout).toContain("Thanks for playing!");
    expect(code).toBe(0);
  });
});

describe("CLI: inspect robot", () => {
  it("shows robot stats on inspect", async () => {
    const { stdout } = await runCli(["TestPlayer", "3", "4"]);
    expect(stdout).toContain("Level: 0");
    expect(stdout).toContain("Wins: 0");
  });
});
