import Head from "next/head";
import { useEffect } from "react";
import { Prose } from "@/components/primitives/prose";

const SITE_URL = "https://kyle.pericak.com";

interface Breadcrumb {
	slug: string;
	title: string;
}

export interface WikiContent {
	slug: string;
	title: string;
	summary: string;
	contentHtml: string;
	metaData: {
		keywords?: string[];
		related?: string[];
		last_verified?: string;
	};
	breadcrumbs: Breadcrumb[];
	childTreeHtml?: string;
}

// Tokenized wiki page (content only; the route wraps it in PageShell).
// Preserves the wiki.spec contracts: title h1, the wiki-breadcrumbs +
// wiki-tree testids and their links, page content, Mermaid, and JSON-LD.
export function WikiPage({ wikiContent }: { wikiContent: WikiContent }) {
	const { slug, title, summary, contentHtml, metaData, breadcrumbs, childTreeHtml } =
		wikiContent;
	const canonicalUrl = `${SITE_URL}/${slug}.html`;
	const keywords = metaData.keywords || [];
	const related = metaData.related || [];
	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			headline: title,
			description: summary,
			url: canonicalUrl,
			...(keywords.length > 0 && { keywords: keywords.join(", ") }),
			author: { "@type": "Person", name: "Kyle Pericak" },
			isPartOf: { "@type": "WebSite", name: "Kyle Pericak", url: SITE_URL },
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: breadcrumbs.map((crumb, i) => ({
				"@type": "ListItem",
				position: i + 1,
				name: crumb.title,
				item: `${SITE_URL}/${crumb.slug}.html`,
			})),
		},
	];

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
				<title>{title} - Bot-Wiki</title>
				<meta name="robots" content="noindex,follow" />
				<meta name="description" content={summary} />
				{keywords.length > 0 ? (
					<meta name="keywords" content={keywords.join(", ")} />
				) : null}
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={summary} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:type" content="article" />
				<meta property="og:site_name" content="Kyle Pericak" />
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={summary} />
				<script
					type="application/ld+json"
					// nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</Head>

			<header className="mb-6">
				{breadcrumbs.length > 1 ? (
					<nav
						data-testid="wiki-breadcrumbs"
						className="mb-2 font-mono text-subtle text-sm"
					>
						{breadcrumbs.map((crumb, i) => (
							<span key={crumb.slug}>
								{i > 0 ? <span className="mx-1.5">/</span> : null}
								{i < breadcrumbs.length - 1 ? (
									<a
										href={`/${crumb.slug}.html`}
										className="text-link no-underline hover:underline"
									>
										{crumb.title}
									</a>
								) : (
									<span>{crumb.title}</span>
								)}
							</span>
						))}
					</nav>
				) : null}
				<h1 className="font-mono font-semibold text-3xl text-default">{title}</h1>
				{metaData.last_verified ? (
					<p className="mt-2 font-mono text-subtle text-sm">
						Last verified: {metaData.last_verified}
					</p>
				) : null}
			</header>

			<Prose html={contentHtml} />

			{childTreeHtml ? (
				<div
					data-testid="wiki-tree"
					className="mt-8 overflow-x-auto pb-2 font-mono text-sm [&_a:hover]:text-accent [&_a]:text-link [&_a]:no-underline [&_ul]:list-none [&_ul]:pl-4"
					suppressHydrationWarning
					// nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
					dangerouslySetInnerHTML={{ __html: childTreeHtml }}
				/>
			) : null}

			{related.length > 0 ? (
				<div className="mt-8 border-border border-t pt-4">
					<p className="mb-1 font-mono text-subtle text-sm">Related:</p>
					{related.map((rel) => (
						<a
							key={rel}
							href={`/${rel}.html`}
							className="block text-link no-underline hover:underline"
						>
							{rel}
						</a>
					))}
				</div>
			) : null}
		</article>
	);
}

export default WikiPage;
