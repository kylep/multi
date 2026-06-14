import type * as React from "react";
import { BrowseBar } from "./BrowseBar";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader, SiteTitle } from "./SiteHeader";

export interface PageShellProps {
	children: React.ReactNode;
	/** Optional sidebar column (e.g. category/tag nav on listing/post pages). */
	sidebar?: React.ReactNode;
	lastModified?: string;
	commitHash?: string;
}

// The tokenized page shell that replaces MUI SiteLayout for migrated pages:
// header + title + content (optional sidebar) + footer, all on the canvas
// background. Applied per-page, so pages migrate one at a time.
export function PageShell({
	children,
	sidebar,
	lastModified,
	commitHash,
}: PageShellProps) {
	return (
		<div
			className="flex min-h-screen flex-col bg-canvas font-sans text-default"
			suppressHydrationWarning
		>
			<SiteHeader />
			<SiteTitle />
			<BrowseBar />
			<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
				{sidebar ? (
					<div className="flex flex-col gap-8 md:flex-row">
						<div className="min-w-0 md:flex-1">{children}</div>
						<aside className="w-full md:w-64">{sidebar}</aside>
					</div>
				) : (
					children
				)}
			</main>
			<SiteFooter lastModified={lastModified} commitHash={commitHash} />
		</div>
	);
}
