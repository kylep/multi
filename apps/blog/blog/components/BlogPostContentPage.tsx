import Head from "next/head";
import { useEffect } from "react";
import { Cluster } from "@/components/primitives/cluster";
import { Prose } from "@/components/primitives/prose";
import { TagPill } from "@/components/ui/tag-pill";

const SITE_URL = "https://kyle.pericak.com";

export interface PostMeta {
	slug: string;
	title: string;
	summary: string;
	date: string;
	modified?: string;
	category: string;
	tags: string;
	image?: string;
}

export interface BlogPostContentPageProps {
	contentHtml: string;
	metaData: PostMeta;
}

// Tokenized post page (content only; the page route wraps it in PageShell).
// Preserves the post.spec contracts: the title h1, "Created:" meta, /tag/
// links, the markdown body (h2/pre/heading-anchor IDs from contentHtml), plus
// Mermaid initialization and the JSON-LD blob.
export function BlogPostContentPage({
	contentHtml,
	metaData,
}: BlogPostContentPageProps) {
	const canonicalUrl = `${SITE_URL}/${encodeURIComponent(metaData.slug)}.html`;
	const imagePath = metaData.image ? `/images/${metaData.image}` : null;
	const imageUrl = imagePath ? `${SITE_URL}${imagePath}` : null;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: metaData.title,
		description: metaData.summary,
		datePublished: metaData.date,
		dateModified: metaData.modified,
		url: canonicalUrl,
		author: { "@type": "Person", name: "Kyle Pericak" },
		...(imageUrl && { image: imageUrl }),
	};
	const tagList = metaData.tags
		.split(",")
		.map((t) => t.trim().toLowerCase())
		.filter(Boolean)
		.map((display) => ({ display, slug: display.replace(/\s+/g, "-") }));

	useEffect(() => {
		let isMounted = true;
		async function initializeMermaid() {
			const mermaidModule = await import("mermaid");
			if (!isMounted) return;
			const mermaid = mermaidModule.default;
			mermaid.initialize({ startOnLoad: true, securityLevel: "loose" });
			mermaid.contentLoaded();
		}
		initializeMermaid();
		return () => {
			isMounted = false;
		};
	}, [contentHtml]);

	return (
		<article>
			<Head>
				<title>{metaData.title}</title>
				<meta name="description" content={metaData.summary} />
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:title" content={metaData.title} />
				<meta property="og:description" content={metaData.summary} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:type" content="article" />
				{imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
				<meta
					name="twitter:card"
					content={imageUrl ? "summary_large_image" : "summary"}
				/>
				<meta name="twitter:title" content={metaData.title} />
				<meta name="twitter:description" content={metaData.summary} />
				{imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
				{/* JSON-LD built from the post's own frontmatter (not user input). */}
				<script
					type="application/ld+json"
					// nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</Head>

			<header className="mb-6">
				<p className="font-mono text-subtle text-sm">
					Created: {metaData.date}
					{metaData.modified ? (
						<span className="ml-3">Updated: {metaData.modified}</span>
					) : null}
				</p>
				<h1 className="mt-1 font-mono font-semibold text-3xl text-default">
					{metaData.title}
				</h1>
				<Cluster gap={2} className="mt-3">
					<a
						href={`/category/${metaData.category.toLowerCase()}`}
						className="font-mono text-muted text-xs no-underline transition-colors hover:text-accent"
					>
						{metaData.category.toLowerCase()}
					</a>
					{tagList.map((t) => (
						<TagPill key={t.slug} href={`/tag/${t.slug}`}>
							{t.display}
						</TagPill>
					))}
				</Cluster>
				{imagePath ? (
					<div className="mt-4 flex justify-center" data-testid="ImageBox">
						<img
							src={imagePath}
							alt={metaData.summary}
							className="max-h-[300px] w-auto max-w-full object-contain"
						/>
					</div>
				) : null}
			</header>

			<Prose html={contentHtml} />
		</article>
	);
}

export default BlogPostContentPage;
