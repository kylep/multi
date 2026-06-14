import type * as React from "react";
import { cn } from "@/lib/utils";

// Max-width content well, centered with responsive horizontal padding.
export function Container({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("mx-auto w-full max-w-3xl px-4 sm:px-6", className)}
			{...props}
		/>
	);
}
