import type { Meta, StoryObj } from "@storybook/nextjs";
import { TagPill } from "./tag-pill";

const meta: Meta<typeof TagPill> = {
	title: "Design System/TagPill",
	component: TagPill,
	parameters: { layout: "centered" },
	args: { children: "ai-agents" },
};
export default meta;

type Story = StoryObj<typeof TagPill>;

export const Default: Story = {};
export const AsLink: Story = { args: { href: "/tag/claude.html", children: "claude" } };

export const Row: Story = {
	render: () => (
		<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
			<TagPill>ai-agents</TagPill>
			<TagPill href="/tag/claude.html">claude</TagPill>
			<TagPill>kubernetes</TagPill>
			<TagPill>automation</TagPill>
		</div>
	),
};
