import type { Meta, StoryObj } from "@storybook/nextjs";
import { PostCard } from "./PostCard";

const meta: Meta<typeof PostCard> = {
	title: "Design System/PostCard",
	component: PostCard,
	parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
	args: {
		title: "Building an AI agent org chart",
		href: "/agent-org-chart.html",
		date: "2026-03-18",
		excerpt:
			"How I broke a content pipeline into specialized Claude agents — researcher, writer, reviewer — orchestrated by a publisher.",
		tags: ["ai-agents", "claude", "automation"],
	},
};

const POSTS: React.ComponentProps<typeof PostCard>[] = [
	{
		title: "Building an AI agent org chart",
		href: "/agent-org-chart.html",
		date: "2026-03-18",
		excerpt: "Specialized Claude agents orchestrated by a publisher.",
		tags: ["ai-agents", "claude"],
	},
	{
		title: "Securing my laptop with an AI loop",
		href: "/secure-my-laptop.html",
		date: "2026-05-02",
		excerpt: "An autonomous hardening loop with adversarial verification.",
		tags: ["security", "automation"],
	},
	{
		title: "An AI-native SDLC, first try",
		href: "/ai-native-sdlc-first-try.html",
		date: "2026-04-10",
		excerpt: "PRD and design-doc agents feeding Claude Code's plan mode.",
		tags: ["sdlc", "claude"],
	},
];

export const Grid: Story = {
	render: () => (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
				gap: 16,
			}}
		>
			{POSTS.map((p) => (
				<PostCard key={p.href} {...p} />
			))}
		</div>
	),
};
