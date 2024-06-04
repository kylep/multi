import SiteLayout from '../../components/SiteLayout';
import { getMarkdownService } from '../../utils/MarkdownService';
import { GlobalContextProvider } from '../../utils/GlobalContext';


export async function getStaticPaths() {
  const slugs = Object.keys(getMarkdownService().markdownFilesBySlug);
  const paths = slugs.map(slug => ({ params: { slug } }));
  return {paths, fallback: false,};
}


export async function getStaticProps({ params: { slug } }) {
  const markdownService = getMarkdownService();
  return {
    props: {
      contentHtml: "",
      metaData: markdownService.markdownFilesBySlug[slug],
      markdownFiles: markdownService.markdownFiles, 
			categories: markdownService.categories,
    },
  }
}


function MarkdownPage({ contentHtml, metaData, markdownFiles, categories }) {  
  console.log("contentHtml", contentHtml);
  console.log("metaData", metaData);
  console.log("markdownFiles", markdownFiles);
  return (
    <GlobalContextProvider globalData={{ categories }}>
      <SiteLayout>
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </SiteLayout>
    </GlobalContextProvider>
  );
}


export default MarkdownPage;
