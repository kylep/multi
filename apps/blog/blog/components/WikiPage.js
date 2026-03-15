import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { Link } from '@mui/material';
import { useEffect } from 'react';
import Head from 'next/head';

const SITE_URL = 'https://kyle.pericak.com';

export function WikiPage({ wikiContent }) {
	const { slug, title, summary, contentHtml, metaData, breadcrumbs, childTreeHtml } = wikiContent;
	const canonicalUrl = `${SITE_URL}/${slug}.html`;

	useEffect(() => {
		let isMounted = true;

		async function initializeMermaid() {
			const mermaidModule = await import('mermaid');
			if (!isMounted) {
				return;
			}
			const mermaid = mermaidModule.default;
			mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });
			mermaid.contentLoaded();
		}

		initializeMermaid();

		return () => {
			isMounted = false;
		};
	}, [contentHtml]);
	const keywords = metaData.keywords || [];
	const related = metaData.related || [];
	const jsonLd = [
		{
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: title,
			description: summary,
			url: canonicalUrl,
			...(keywords.length > 0 && { keywords: keywords.join(', ') }),
			author: {
				'@type': 'Person',
				name: 'Kyle Pericak',
			},
			isPartOf: {
				'@type': 'WebSite',
				name: 'Kyle Pericak',
				url: SITE_URL,
			},
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: breadcrumbs.map((crumb, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.title,
				item: `${SITE_URL}/${crumb.slug}.html`,
			})),
		},
	];

	return (
		<Box>
			<Head>
				<title>{title} - Bot-Wiki</title>
				<meta name="description" content={summary} />
				{keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
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
					// nosemgrep: react-dangerouslysetinnerhtml -- JSON-LD from own metadata, not user input
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</Head>
			<Box sx={{ marginBottom: '20px' }}>
				{/* Breadcrumbs */}
				{breadcrumbs.length > 1 && (
					<Box sx={{ marginBottom: '10px' }} data-testid="wiki-breadcrumbs">
						{breadcrumbs.map((crumb, i) => (
							<span key={crumb.slug}>
								{i > 0 && <Typography variant="blogPostGreySubtitle" component="span" sx={{ margin: '0 6px' }}>/</Typography>}
								{i < breadcrumbs.length - 1 ? (
									<Link href={`/${crumb.slug}.html`} sx={{ textDecoration: 'none' }}>{crumb.title}</Link>
								) : (
									<Typography variant="blogPostGreySubtitle" component="span">{crumb.title}</Typography>
								)}
							</span>
						))}
					</Box>
				)}
				{/* Title */}
				<Typography component="h1" variant="BlogPostTitleHeader">{title}</Typography>
				{/* Last verified date */}
				{metaData.last_verified && (
					<Typography variant="blogPostGreySubtitle">Last verified: {metaData.last_verified}</Typography>
				)}
			</Box>
			{/* Page content */}
			{/* nosemgrep: react-dangerouslysetinnerhtml -- SSG, HTML from own markdown */}
			<Box dangerouslySetInnerHTML={{ __html: contentHtml }} />
			{/* Child tree for index/section pages */}
			{childTreeHtml && (
				<Box sx={{ marginTop: '30px' }} data-testid="wiki-tree">
					{/* nosemgrep: react-dangerouslysetinnerhtml -- SSG, HTML from own build */}
					<Box dangerouslySetInnerHTML={{ __html: childTreeHtml }} />
				</Box>
			)}
			{/* Related links */}
			{related.length > 0 && (
				<Box sx={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
					<Typography variant="blogPostGreySubtitle" sx={{ marginBottom: '5px' }}>Related:</Typography>
					{related.map(rel => {
						const href = rel.startsWith('wiki/') ? `/${rel}.html` : `/${rel}.html`;
						return (
							<Link key={rel} href={href} sx={{ display: 'block', textDecoration: 'none', marginBottom: '3px' }}>
								{rel}
							</Link>
						);
					})}
				</Box>
			)}
		</Box>
	);
}

export default WikiPage;
