import type { Meta, StoryObj } from "@storybook/nextjs";
import { Callout } from "./callout";

const meta: Meta<typeof Callout> = {
	title: "Design System/Callout",
	component: Callout,
	parameters: { layout: "padded" },
	argTypes: {
		variant: { control: "select", options: ["info", "tip", "warn", "danger"] },
	},
};
export default meta;

type Story = StoryObj<typeof Callout>;

export const Info: Story = {
	args: { variant: "info", children: <p>Heads up — this is an info callout.</p> },
};

export const AllVariants: Story = {
	render: () => (
		<div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
			<Callout variant="info">
				<p>Info — neutral context for the reader.</p>
			</Callout>
			<Callout variant="tip">
				<p>Tip — a helpful suggestion.</p>
			</Callout>
			<Callout variant="warn">
				<p>Warning — proceed with care.</p>
			</Callout>
			<Callout variant="danger">
				<p>Danger — this can break things.</p>
			</Callout>
		</div>
	),
};
