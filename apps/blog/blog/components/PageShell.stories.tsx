import type { Meta, StoryObj } from "@storybook/nextjs";
import { PageShell } from "./PageShell";

const meta: Meta<typeof PageShell> = {
	title: "Design System/PageShell",
	component: PageShell,
	parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof PageShell>;

export const Default: Story = {
	args: {
		lastModified: "2026-06-13",
		commitHash: "cd6cb11",
		children: (
			<div>
				<h2 className="font-mono font-semibold text-2xl">Content area</h2>
				<p className="mt-2 text-muted">
					The page body renders here, inside the tokenized shell.
				</p>
			</div>
		),
	},
};
