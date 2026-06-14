import type * as React from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "./spacing";

const ALIGN = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
} as const;

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
	gap?: Gap;
	align?: keyof typeof ALIGN;
}

// Vertical flex with token-driven gap.
export function Stack({
	className,
	gap = 4,
	align = "stretch",
	...props
}: StackProps) {
	return (
		<div
			className={cn("flex flex-col", GAP[gap], ALIGN[align], className)}
			{...props}
		/>
	);
}
