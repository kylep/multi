#!/usr/bin/env node
/*
 * Guard: no raw hex colors in design-system component code (.tsx).
 * Components must reference Terminal tokens (bg-accent, text-default, ...),
 * not literal hex. Legacy .js components are exempt until migrated;
 * design-system/tokens.css legitimately defines the hex primitives, so it is
 * not scanned. *.stories.tsx are demo-only and also skipped.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "components");
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const violations = [];

function walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) {
			walk(p);
			continue;
		}
		if (!p.endsWith(".tsx") || p.endsWith(".stories.tsx")) continue;
		const lines = readFileSync(p, "utf8").split("\n");
		lines.forEach((line, i) => {
			const m = line.match(HEX);
			if (m) violations.push(`${p}:${i + 1}  ${m[0]}  ${line.trim()}`);
		});
	}
}

walk(ROOT);

if (violations.length) {
	console.error("✗ raw hex found in design-system components (use tokens):");
	for (const v of violations) console.error(`  ${v}`);
	process.exit(1);
}
console.log("✓ no raw hex in design-system components");
