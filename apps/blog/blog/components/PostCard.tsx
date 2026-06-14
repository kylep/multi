import { Cluster } from "@/components/primitives/cluster";
import { TagPill } from "@/components/ui/tag-pill";
import { cn } from "@/lib/utils";

export interface PostCardProps {
	title: string;
	href: string;
	date?: string;
	excerpt?: string;
	tags?: string[];
	thumbnail?: string;
	className?: string;
}

// Homepage / archive post card: thumbnail + date + title + excerpt + tags,
// all token-driven. The whole card is the link (tags render as plain spans
// to avoid nested anchors).
export function PostCard({
	title,
	href,
	date,
	excerpt,
	tags,
	thumbnail,
	className,
}: PostCardProps) {
	return (
		<a
			href={href}
			className={cn(
				// no-underline: preflight is omitted, so the native <a> would
				// otherwise underline (and link-color) all child text.
				"group block rounded-lg border border-border bg-surface p-5 no-underline transition-colors hover:border-accent",
				className,
			)}
		>
			{thumbnail ? (
				<img
					src={thumbnail}
					alt=""
					className="mb-3 h-40 w-full rounded-md border border-border object-cover"
				/>
			) : null}
			{date ? (
				<span className="font-mono text-subtle text-xs">{date}</span>
			) : null}
			<h3 className="mt-1 font-mono font-semibold text-default text-lg group-hover:text-accent">
				{title}
			</h3>
			{excerpt ? <p className="mt-2 text-muted text-sm">{excerpt}</p> : null}
			{tags && tags.length > 0 ? (
				<Cluster gap={2} className="mt-3">
					{tags.map((t) => (
						<TagPill key={t}>{t}</TagPill>
					))}
				</Cluster>
			) : null}
		</a>
	);
}
