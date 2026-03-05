import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { useEffect } from 'react';
import Head from 'next/head';



export function BlogPostContentPage({ contentHtml, metaData }) {
    /* Example metadata: 
    metaData:  {
        title: 'Creating a CSR with a SAN - openssl',
        summary: "Certs aren't valid without SubjectAltName (SANs) now, openssl makes it hard",
        slug: 'openssl-csr-san',
        category: 'systems administration',
        tags: 'https, openssl',
        date: '2020-10-19',
        modified: '2020-10-19',
        status: 'published',
        image: 'gear.png',
        thumbnail: 'gear-thumb.png'
    }
    */
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
            <Head><title>{metaData.title}</title></Head>
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
                })};
                {/*Post Header Image*/}
                <Box sx={{ display: 'flex', justifyContent: 'center' }} data-testid="ImageBox">
                    <Box component="img" src={"/images/"+metaData.image} alt={metaData.summary}  sx={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        height: 'auto',
                        objectFit: 'contain',
                    }} />
                </Box>
            </Box>
            <Box dangerouslySetInnerHTML={{ __html: contentHtml }}></Box>
        </Box>
    );
}

export default BlogPostContentPage;