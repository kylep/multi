import type * as React from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "./spacing";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
	gap?: Gap;
	/** Minimum column width in px; columns auto-fill responsively. */
	min?: number;
}

// Responsive grid via auto-fill + minmax — no breakpoint classes needed.
export function Grid({
	className,
	gap = 6,
	min = 280,
	style,
	...props
}: GridProps) {
	return (
		<div
			className={cn("grid", GAP[gap], className)}
			style={{
				gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`,
				...style,
			}}
			{...props}
		/>
	);
}
