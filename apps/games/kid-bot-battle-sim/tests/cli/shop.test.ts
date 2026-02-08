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
      const prompts = (stdout.match(/(Player Name:|> |Press Enter)/g) || []).length;
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

describe("CLI: shop", () => {
  it("enters shop and shows shop menu", async () => {
    // Enter name, go to shop, go back, quit
    const { stdout } = await runCli(["TestPlayer", "2", "4", "4"]);
    expect(stdout).toContain("SHOP");
    expect(stdout).toContain("1. Buy");
    expect(stdout).toContain("2. Sell");
  });

  it("buys an item from the shop", async () => {
    // Enter name, shop, buy, select Stick (item 1), press enter, back, back, inspect, quit
    const { stdout } = await runCli([
      "TestPlayer",
      "2",     // Shop
      "1",     // Buy
      "1",     // Buy Stick
      "",      // Press Enter to continue
      "b",     // Back from buy
      "4",     // Back from shop
      "3",     // Inspect robot
      "4",     // Quit
    ]);
    expect(stdout).toContain("Bought Stick!");
    expect(stdout).toContain("[W] Stick");
  });
});
