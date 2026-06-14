import type { Meta, StoryObj } from "@storybook/nextjs";
import { Pagination } from "./pagination";

const meta: Meta<typeof Pagination> = {
	title: "Design System/Pagination",
	component: Pagination,
	parameters: { layout: "centered" },
	args: { currentPage: 2, totalPages: 5 },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};
export const FirstPage: Story = { args: { currentPage: 1, totalPages: 5 } };
export const LastPage: Story = { args: { currentPage: 5, totalPages: 5 } };
