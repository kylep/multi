import Box from '@mui/material/Box';


export function BlogPostContentPage({ contentHtml, metaData }) {
    //console.log("metaData: ", metaData);
    return (
        <Box dangerouslySetInnerHTML={{ __html: contentHtml }}></Box>
    );
}

export default BlogPostContentPage;