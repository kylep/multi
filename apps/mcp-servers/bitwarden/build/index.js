import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
function getSession() {
    const session = process.env.BW_SESSION;
    if (!session) {
        throw new Error("BW_SESSION environment variable is not set");
    }
    return session;
}
async function bw(...args) {
    const { stdout, stderr } = await exec("bw", [...args, "--session", getSession()], {
        timeout: 30_000,
        env: { ...process.env, BW_SESSION: getSession() },
    });
    if (stderr && !stdout) {
        throw new Error(`bw error: ${stderr}`);
    }
    return stdout.trim();
}
const TYPE_NAMES = {
    1: "login",
    2: "secure_note",
    3: "card",
    4: "identity",
};
function formatItem(item, includePassword = false) {
    const lines = [];
    lines.push(`**${item.name}** (${TYPE_NAMES[item.type] || "unknown"}) [id: ${item.id}]`);
    if (item.login?.username)
        lines.push(`  Username: ${item.login.username}`);
    if (includePassword && item.login?.password)
        lines.push(`  Password: ${item.login.password}`);
    if (item.login?.uris?.length) {
        lines.push(`  URLs: ${item.login.uris.map((u) => u.uri).join(", ")}`);
    }
    if (item.notes)
        lines.push(`  Notes: ${item.notes.slice(0, 200)}`);
    if (item.folderId)
        lines.push(`  Folder: ${item.folderId}`);
    return lines.join("\n");
}
const server = new McpServer({
    name: "bitwarden",
    version: "1.0.0",
    description: "IMPORTANT: Always call sync after creating or editing items, and before listing/searching if you expect recent changes from another machine. The local cache is not automatically updated.",
});
// --- List items ---
server.tool("list_items", "List vault items. Optionally filter by search term, folder, or collection.", {
    search: z.string().optional().describe("Search term to filter items"),
    folderId: z.string().optional().describe("Filter by folder ID"),
    collectionId: z.string().optional().describe("Filter by collection ID"),
}, async ({ search, folderId, collectionId }) => {
    const args = ["list", "items"];
    if (search)
        args.push("--search", search);
    if (folderId)
        args.push("--folderid", folderId);
    if (collectionId)
        args.push("--collectionid", collectionId);
    const raw = await bw(...args);
    const items = JSON.parse(raw);
    const text = items.length === 0
        ? "No items found."
        : items.map((i) => formatItem(i, false)).join("\n\n");
    return { content: [{ type: "text", text: `Found ${items.length} item(s):\n\n${text}` }] };
});
// --- Get item ---
server.tool("get_item", "Get a single vault item by ID or name, including its password.", {
    identifier: z.string().describe("Item ID or exact name"),
}, async ({ identifier }) => {
    const raw = await bw("get", "item", identifier);
    const item = JSON.parse(raw);
    return { content: [{ type: "text", text: formatItem(item, true) }] };
});
// --- Create item ---
server.tool("create_item", "Create a new login item in the vault.", {
    name: z.string().describe("Name of the item"),
    username: z.string().optional().describe("Login username"),
    password: z.string().optional().describe("Login password"),
    uri: z.string().optional().describe("Login URL"),
    notes: z.string().optional().describe("Notes"),
    folderId: z.string().optional().describe("Folder ID to place the item in"),
}, async ({ name, username, password, uri, notes, folderId }) => {
    const template = JSON.parse(await bw("get", "template", "item"));
    template.name = name;
    template.type = 1; // login
    template.notes = notes || null;
    template.folderId = folderId || null;
    const loginTemplate = JSON.parse(await bw("get", "template", "item.login"));
    loginTemplate.username = username || null;
    loginTemplate.password = password || null;
    loginTemplate.uris = uri ? [{ match: null, uri }] : [];
    template.login = loginTemplate;
    const encoded = Buffer.from(JSON.stringify(template)).toString("base64");
    const raw = await bw("create", "item", encoded);
    const created = JSON.parse(raw);
    return {
        content: [{ type: "text", text: `Created item: ${formatItem(created, false)}` }],
    };
});
// --- Edit item ---
server.tool("edit_item", "Edit an existing vault item. Fetches the item, applies changes, and saves.", {
    id: z.string().describe("Item ID to edit"),
    name: z.string().optional().describe("New name"),
    username: z.string().optional().describe("New username"),
    password: z.string().optional().describe("New password"),
    uri: z.string().optional().describe("New URL (replaces existing URIs)"),
    notes: z.string().optional().describe("New notes"),
}, async ({ id, name, username, password, uri, notes }) => {
    const raw = await bw("get", "item", id);
    const item = JSON.parse(raw);
    const hasLoginChanges = username !== undefined || password !== undefined || uri !== undefined;
    if (hasLoginChanges && item.type !== 1) {
        throw new Error("Cannot set login fields on non-login items");
    }
    if (name !== undefined)
        item.name = name;
    if (notes !== undefined)
        item.notes = notes;
    if (hasLoginChanges) {
        if (!item.login)
            item.login = {};
        if (username !== undefined)
            item.login.username = username;
        if (password !== undefined)
            item.login.password = password;
        if (uri !== undefined)
            item.login.uris = [{ match: null, uri }];
    }
    const encoded = Buffer.from(JSON.stringify(item)).toString("base64");
    const updated = JSON.parse(await bw("edit", "item", id, encoded));
    return {
        content: [{ type: "text", text: `Updated item: ${formatItem(updated, false)}` }],
    };
});
// --- Delete item ---
server.tool("delete_item", "Delete a vault item by ID (moves to trash).", {
    id: z.string().describe("Item ID to delete"),
}, async ({ id }) => {
    await bw("delete", "item", id);
    return { content: [{ type: "text", text: `Deleted item ${id}` }] };
});
// --- Generate password ---
server.tool("generate_password", "Generate a secure password using Bitwarden's generator.", {
    length: z.coerce.number().optional().default(20).describe("Password length"),
    uppercase: z.boolean().optional().default(true),
    lowercase: z.boolean().optional().default(true),
    numbers: z.boolean().optional().default(true),
    special: z.boolean().optional().default(true),
}, async ({ length, uppercase, lowercase, numbers, special }) => {
    const args = ["generate", "--length", String(length)];
    if (uppercase)
        args.push("--uppercase");
    if (lowercase)
        args.push("--lowercase");
    if (numbers)
        args.push("--number");
    if (special)
        args.push("--special");
    const pw = await bw(...args);
    return { content: [{ type: "text", text: pw }] };
});
// --- List folders ---
server.tool("list_folders", "List all folders in the vault.", {}, async () => {
    const raw = await bw("list", "folders");
    const folders = JSON.parse(raw);
    const text = folders.map((f) => `- **${f.name}** [${f.id}]`).join("\n");
    return { content: [{ type: "text", text: text || "No folders." }] };
});
// --- Sync vault ---
server.tool("sync", "Sync the local vault cache with the Bitwarden server.", {}, async () => {
    await bw("sync");
    return { content: [{ type: "text", text: "Vault synced." }] };
});
// --- Vault status ---
server.tool("status", "Check the vault status (locked/unlocked, last sync, user email).", {}, async () => {
    const raw = await bw("status");
    return { content: [{ type: "text", text: raw }] };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Bitwarden MCP Server running on stdio");
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
