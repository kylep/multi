export interface SiteFooterProps {
	/** From GlobalContext at wire-up time; optional so the component is pure. */
	lastModified?: string;
	commitHash?: string;
}

// Tokenized site footer. Takes the "last updated" data as props (the page
// wiring passes GlobalContext values) so the component stays pure/testable.
export function SiteFooter({ lastModified, commitHash }: SiteFooterProps) {
	return (
		<footer className="border-border border-t bg-surface">
			<div className="mx-auto max-w-5xl px-4 py-4 text-center font-mono text-subtle text-xs sm:px-6">
				{lastModified ? <>Blog code last updated on {lastModified}: </> : null}
				{commitHash ? (
					<a
						href={`https://github.com/kylep/multi/commit/${commitHash}`}
						className="text-link no-underline hover:underline"
					>
						{commitHash}
					</a>
				) : null}
			</div>
		</footer>
	);
}
