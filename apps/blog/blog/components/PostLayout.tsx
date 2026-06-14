import { Cluster } from "@/components/primitives/cluster";
import { Prose } from "@/components/primitives/prose";
import { TagPill } from "@/components/ui/tag-pill";
import { cn } from "@/lib/utils";

export interface PostLayoutProps {
	title: string;
	date?: string;
	modified?: string;
	tags?: string[];
	/** Rendered markdown HTML (remark output). */
	html: string;
	className?: string;
}

// Article shell for posts and wiki pages: title + meta + tags + Prose body.
// Replaces the MUI BlogPostContentPage / WikiPage body wrappers.
export function PostLayout({
	title,
	date,
	modified,
	tags,
	html,
	className,
}: PostLayoutProps) {
	return (
		<article className={cn("py-2", className)}>
			<header className="mb-6">
				<h1 className="font-mono font-semibold text-3xl text-default">{title}</h1>
				{date || modified ? (
					<p className="mt-2 font-mono text-subtle text-sm">
						{date ? <>Created: {date}</> : null}
						{modified ? <> · Modified: {modified}</> : null}
					</p>
				) : null}
				{tags && tags.length > 0 ? (
					<Cluster gap={2} className="mt-3">
						{tags.map((t) => (
							<TagPill key={t} href={`/tag/${t}.html`}>
								{t}
							</TagPill>
						))}
					</Cluster>
				) : null}
			</header>
			<Prose html={html} />
		</article>
	);
}
