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
      const prompts = (stdout.match(/(Player Name:|> |Press Enter|\(y\/n\))/g) || []).length;
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

describe("CLI: battle", () => {
  it("shows opponent selection", async () => {
    const { stdout } = await runCli([
      "TestPlayer",
      "2", "1", "1", "", "b", "4", // Shop: buy a stick
      "1",    // Fight
      "b",    // Back
      "4",    // Quit
    ]);
    expect(stdout).toContain("CHOOSE OPPONENT");
    expect(stdout).toContain("MiniBot");
  });

  it("shows first battle tip", async () => {
    const { stdout } = await runCli([
      "TestPlayer",
      "2", "1", "1", "", "b", "4", // Shop: buy a stick
      "1",    // Fight
      "1",    // Select MiniBot
      "4",    // Surrender
      "y",    // Confirm
      "",     // Press Enter
      "4",    // Quit
    ]);
    expect(stdout).toContain("TIP");
  });

  it("can surrender from battle", async () => {
    const { stdout } = await runCli([
      "TestPlayer",
      "2", "1", "1", "", "b", "4", // Shop: buy a stick
      "1",    // Fight
      "1",    // Select MiniBot
      "4",    // Surrender
      "y",    // Confirm
      "",     // Press Enter
      "4",    // Quit
    ]);
    expect(stdout).toContain("DEFEATED");
  });

  it("can fight using AI defaults (Enter key)", async () => {
    // Just keep hitting enter to use AI suggestions until battle ends
    const enters = Array(30).fill("");
    const { stdout } = await runCli([
      "TestPlayer",
      "2", "1", "1", "", "b", "4", // Shop: buy a stick
      "1",    // Fight
      "1",    // Select MiniBot
      ...enters, // Keep hitting enter for AI defaults + post-battle continue
      "4",       // Quit
    ]);
    // Battle should eventually end in victory or defeat
    const hasOutcome = stdout.includes("VICTORY") || stdout.includes("DEFEATED");
    expect(hasOutcome).toBe(true);
  });
});
