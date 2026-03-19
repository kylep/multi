import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} failed: ${stderr || err.message}`));
      else resolve(stdout);
    });
  });
}

const server = new McpServer({
  name: "screenshot",
  version: "2.0.0",
});

server.tool(
  "take_screenshot",
  "Capture a screenshot of the macOS desktop. Returns the image as base64-encoded PNG.",
  {},
  async () => {
    const path = join(tmpdir(), `screenshot-${Date.now()}.png`);
    try {
      await run("screencapture", ["-x", path]);
      const data = await readFile(path);
      return {
        content: [
          {
            type: "image",
            data: data.toString("base64"),
            mimeType: "image/png",
          },
        ],
      };
    } finally {
      await unlink(path).catch(() => {});
    }
  }
);

server.tool(
  "click",
  "Click at a specific x,y coordinate on the macOS desktop. Use take_screenshot first to identify coordinates.",
  {
    x: z.number().describe("X coordinate (pixels from left edge)"),
    y: z.number().describe("Y coordinate (pixels from top edge)"),
  },
  async ({ x, y }) => {
    await run("cliclick", [`c:${x},${y}`]);
    return {
      content: [{ type: "text", text: `Clicked at (${x}, ${y})` }],
    };
  }
);

server.tool(
  "double_click",
  "Double-click at a specific x,y coordinate on the macOS desktop.",
  {
    x: z.number().describe("X coordinate (pixels from left edge)"),
    y: z.number().describe("Y coordinate (pixels from top edge)"),
  },
  async ({ x, y }) => {
    await run("cliclick", [`dc:${x},${y}`]);
    return {
      content: [{ type: "text", text: `Double-clicked at (${x}, ${y})` }],
    };
  }
);

server.tool(
  "type_text",
  "Type text using the keyboard. Useful for filling in native macOS dialogs.",
  {
    text: z.string().describe("Text to type"),
  },
  async ({ text }) => {
    await run("cliclick", [`t:${text}`]);
    return {
      content: [{ type: "text", text: `Typed: ${text}` }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
