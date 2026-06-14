import type { Meta, StoryObj } from "@storybook/nextjs";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader, SiteTitle } from "./SiteHeader";

const meta: Meta = {
	title: "Design System/Site Chrome",
	parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

export const Header: Story = { render: () => <SiteHeader /> };
export const TitleBar: Story = { render: () => <SiteTitle /> };
export const Footer: Story = {
	render: () => <SiteFooter lastModified="2026-06-13" commitHash="cd6cb11" />,
};

export const FullShell: Story = {
	render: () => (
		<div className="min-h-screen bg-canvas font-sans text-default">
			<SiteHeader />
			<SiteTitle />
			<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
				<h2 className="font-mono font-semibold text-2xl">A page heading</h2>
				<p className="mt-3 text-muted">
					Body content lives here. The chrome above and below is the tokenized
					Terminal shell that replaces the MUI SiteLayout.
				</p>
			</div>
			<SiteFooter lastModified="2026-06-13" commitHash="cd6cb11" />
		</div>
	),
};
