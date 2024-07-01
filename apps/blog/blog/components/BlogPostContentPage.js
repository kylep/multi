import { Typography } from '@mui/material';
import Box from '@mui/material/Box';



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
    return (
        <Box>
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
                {metaData.tags.split(',').map((tag) => (
                    <a href={`/tag/${tag.trim().toLowerCase()}`} style={{textDecoration: 'none', marginLeft: "5px"}}>{ tag.trim().toLowerCase() }</a>
                ))}
                {/*Post Header Image*/}
                <Box sx={{ display: 'flex', justifyContent: 'center' }} data-testid="ImageBox">
                    <Box component="img" src={"/images/"+metaData.image} alt={metaData.summary}  sx={{
                        maxWidth: '100%',
                        height: 'auto',
                    }} />
                </Box>
            </Box>
            <Box dangerouslySetInnerHTML={{ __html: contentHtml }}></Box>
        </Box>
    );
}

export default BlogPostContentPage;