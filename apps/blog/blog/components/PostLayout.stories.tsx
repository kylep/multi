import type { Meta, StoryObj } from "@storybook/nextjs";
import { Container } from "@/components/primitives/container";
import { PostLayout } from "./PostLayout";

const meta: Meta<typeof PostLayout> = {
	title: "Design System/PostLayout",
	component: PostLayout,
	parameters: { layout: "padded" },
	decorators: [
		(Story) => (
			<Container>
				<Story />
			</Container>
		),
	],
};
export default meta;

type Story = StoryObj<typeof PostLayout>;

export const Default: Story = {
	args: {
		title: "Building an AI agent org chart",
		date: "2026-03-18",
		modified: "2026-04-02",
		tags: ["ai-agents", "claude", "automation"],
		html: `
			<p>I broke a content pipeline into specialized Claude agents — a
			researcher, a writer, a reviewer — orchestrated by a publisher.</p>
			<h2>Why an org chart</h2>
			<p>Each agent gets focused tools and instructions. Here's the build
			command they all converge on:</p>
			<pre><code>$ npm run build\n✓ 354 routes exported</code></pre>
			<blockquote>A design system isn't a project. It's a product.</blockquote>
			<ul><li>Researcher gathers sourced facts</li><li>Reviewer checks style + substance</li></ul>
		`,
	},
};
