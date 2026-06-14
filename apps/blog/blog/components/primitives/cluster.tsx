import type * as React from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "./spacing";

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
	gap?: Gap;
}

// Horizontal flex that wraps, vertically centered — for tag rows, meta, nav.
export function Cluster({ className, gap = 3, ...props }: ClusterProps) {
	return (
		<div
			className={cn("flex flex-wrap items-center", GAP[gap], className)}
			{...props}
		/>
	);
}
