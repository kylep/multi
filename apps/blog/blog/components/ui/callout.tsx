import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const calloutVariants = cva(
	"rounded-md border border-border border-l-4 bg-surface px-4 py-3 text-default [&_:last-child]:mb-0",
	{
		variants: {
			variant: {
				info: "border-l-accent",
				tip: "border-l-success",
				warn: "border-l-warning",
				danger: "border-l-danger",
			},
		},
		defaultVariants: { variant: "info" },
	},
);

export interface CalloutProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof calloutVariants> {}

// Info/tip/warn/danger callout for blog posts. Left border carries the
// semantic token color.
export function Callout({ className, variant, ...props }: CalloutProps) {
	return <div className={cn(calloutVariants({ variant }), className)} {...props} />;
}
