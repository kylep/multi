import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useEffect } from 'react';
import Head from 'next/head';

const SITE_URL = 'https://kyle.pericak.com';

export function BlogPostContentPage({ contentHtml, metaData }) {
    const canonicalUrl = `${SITE_URL}/${metaData.slug}.html`;
    const imagePath = metaData.image ? `/images/${metaData.image}` : null;
    const imageUrl = imagePath ? `${SITE_URL}${imagePath}` : null;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metaData.title,
        description: metaData.summary,
        datePublished: metaData.date,
        dateModified: metaData.modified,
        url: canonicalUrl,
        author: {
            '@type': 'Person',
            name: 'Kyle Pericak',
        },
        ...(imageUrl && { image: imageUrl }),
    };
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

    return (
        <Box>
            <Head>
                <title>{metaData.title}</title>
                <meta name="description" content={metaData.summary} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:title" content={metaData.title} />
                <meta property="og:description" content={metaData.summary} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:type" content="article" />
                {imageUrl && <meta property="og:image" content={imageUrl} />}
                <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
                <meta name="twitter:title" content={metaData.title} />
                <meta name="twitter:description" content={metaData.summary} />
                {imageUrl && <meta name="twitter:image" content={imageUrl} />}
                <script
                    type="application/ld+json"
                    // nosemgrep: react-dangerouslysetinnerhtml -- JSON-LD from own metadata, not user input
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </Head>
            <Box sx={{ marginBottom: '20px' }}>
                {/* Created and Updated timestamps above the title */}
                <Typography variant="blogPostGreySubtitle">Created: { metaData.date }</Typography> 
                <Typography variant="blogPostGreySubtitle" sx={{marginLeft: "15px"}}>Updated: { metaData.modified }</Typography> 
                {/*} Title in big blue text */}
                <Typography component="h1" variant="BlogPostTitleHeader">{ metaData.title }</Typography>
                {/* Category link */}
                <Typography variant="blogPostGreySubtitle">Category:</Typography>
                <a href={`/category/${metaData.category.toLowerCase()}`} style={{textDecoration: 'none', margin: "0 0.5em"}}>{ metaData.category.toLowerCase() }</a>
                {/*Tags Links*/}
                <Typography variant="blogPostGreySubtitle">Tags:</Typography>
                {metaData.tags.split(',').map((tag, index) => {
                    const display = tag.trim().toLowerCase();
                    const slug = display.replace(/\s+/g, '-');
                    return (
                        <a
                            key={`${slug}-${index}`}
                            href={`/tag/${slug}`}
                            style={{ textDecoration: 'none', marginLeft: '5px' }}
                        >
                            {display}
                        </a>
                    );
                })}
                {/*Post Header Image*/}
                {imagePath && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }} data-testid="ImageBox">
                        <Box component="img" src={imagePath} alt={metaData.summary} sx={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            height: 'auto',
                            objectFit: 'contain',
                        }} />
                    </Box>
                )}
            </Box>
            {/* nosemgrep: react-dangerouslysetinnerhtml -- SSG, HTML from own markdown */}
            <Box dangerouslySetInnerHTML={{ __html: contentHtml }}></Box>
        </Box>
    );
}

export default BlogPostContentPage;