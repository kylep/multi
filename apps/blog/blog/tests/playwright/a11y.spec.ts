import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// One representative page per migrated type. Asserts zero serious/critical
// axe violations (PER-135 done-criterion #4).
const PAGES = [
	{ name: "home", url: "/" },
	{ name: "post", url: "/playwright-mcp.html" },
	{ name: "wiki", url: "/wiki.html" },
	{ name: "about", url: "/about.html" },
];

for (const pageDef of PAGES) {
	test(`a11y: ${pageDef.name} has no serious/critical violations`, async ({
		page,
	}) => {
		const response = await page.goto(pageDef.url);
		expect(
			response?.ok(),
			`navigation to ${pageDef.url} failed (status ${response?.status()})`,
		).toBeTruthy();
		const results = await new AxeBuilder({ page }).analyze();
		const seriousOrCritical = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		);
		if (seriousOrCritical.length > 0) {
			console.log(
				JSON.stringify(
					seriousOrCritical.map((v) => ({
						id: v.id,
						impact: v.impact,
						help: v.help,
						nodes: v.nodes.slice(0, 3).map((n) => n.target),
					})),
					null,
					2,
				),
			);
		}
		expect(seriousOrCritical).toEqual([]);
	});
}
