import type * as React from "react";
import { cn } from "@/lib/utils";

export interface TagPillProps extends React.HTMLAttributes<HTMLElement> {
	/** If set, renders an <a>; otherwise a <span>. */
	href?: string;
}

// Small mono tag/category chip wired to the Terminal tokens.
export function TagPill({ className, href, children, ...props }: TagPillProps) {
	const cls = cn(
		"inline-flex items-center rounded-sm border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted no-underline transition-colors hover:border-accent hover:text-accent",
		className,
	);
	if (href) {
		return (
			<a href={href} className={cls} {...props}>
				{children}
			</a>
		);
	}
	return (
		<span className={cls} {...props}>
			{children}
		</span>
	);
}
