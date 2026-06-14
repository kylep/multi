import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Rendered markdown HTML (remark output). If omitted, renders children. */
	html?: string;
}

// Token-driven typography wrapper for rendered markdown. Replaces MUI
// <Typography> for post/wiki bodies; follows the active theme via .prose-ds.
export function Prose({ html, className, children, ...props }: ProseProps) {
	const cls = cn("prose prose-ds max-w-none", className);
	if (html != null) {
		return (
			<div
				className={cls}
				// The rendered markdown HTML is server-authoritative; the browser
				// can normalize it slightly differently than React's client parse
				// (e.g. TOC lists), so suppress the benign hydration-mismatch warning.
				suppressHydrationWarning
				// `html` is build-time-rendered markdown from the repo's own .md
				// files (never user input), and remark-html intentionally allows
				// raw HTML in posts — sanitizing would strip authored content.
				// Same trust model as the existing post/wiki .js components.
				// nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
				dangerouslySetInnerHTML={{ __html: html }}
				{...props}
			/>
		);
	}
	return (
		<div className={cls} {...props}>
			{children}
		</div>
	);
}
