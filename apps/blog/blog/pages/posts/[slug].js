import SiteLayout from '../../components/SiteLayout';
import { getMarkdownService } from '../../utils/MarkdownService';


export async function getStaticPaths() {
  const slugs = Object.keys(getMarkdownService().markdownFilesBySlug);
  const paths = slugs.map(slug => ({ params: { slug } }));
  return {paths, fallback: false,};
}


export async function getStaticProps({ params: { slug } }) {
  // `slug` gets deconstructed from the params object
  const markdownService = getMarkdownService();
  return {
    props: {
      contentHtml: "",
      metaData: getMarkdownService().markdownFilesBySlug[slug],
    },
  }
}


function MarkdownPage({ contentHtml, metaData }) {
  console.log('metaData', metaData);
  //console.log('contentHtml', contentHtml);
  return (
    <SiteLayout>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </SiteLayout>
  );
}


export default MarkdownPage;
