import type { Meta, StoryObj } from "@storybook/nextjs";
import { Cluster } from "./cluster";
import { Container } from "./container";
import { Grid } from "./grid";
import { Prose } from "./prose";
import { Stack } from "./stack";

const meta: Meta = {
	title: "Design System/Primitives",
	parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

const Box = ({ children }: { children: React.ReactNode }) => (
	<div
		className="bg-surface border border-border rounded-md text-default font-mono"
		style={{ padding: 12 }}
	>
		{children}
	</div>
);

export const StackAndCluster: Story = {
	render: () => (
		<Stack gap={4}>
			<Box>Stack item one</Box>
			<Box>Stack item two</Box>
			<Cluster gap={2}>
				<Box>cluster a</Box>
				<Box>cluster b</Box>
				<Box>cluster c</Box>
			</Cluster>
		</Stack>
	),
};

export const ResponsiveGrid: Story = {
	render: () => (
		<Grid min={180} gap={4}>
			{Array.from({ length: 6 }, (_, i) => (
				<Box key={i}>card {i + 1}</Box>
			))}
		</Grid>
	),
};

export const ContainedProse: Story = {
	render: () => (
		<Container>
			<Prose
				html={`
          <h1>Rendered markdown</h1>
          <p>Body copy styled by <code>.prose-ds</code>, which maps the
          typography plugin to the Terminal tokens. Here's a
          <a href="#">link</a> and some <strong>bold</strong> text.</p>
          <blockquote>A blockquote, bordered with the token border color.</blockquote>
          <ul><li>First bullet</li><li>Second bullet</li></ul>
          <pre><code>$ npm run build\n✓ 354 routes exported</code></pre>
        `}
			/>
		</Container>
	),
};
