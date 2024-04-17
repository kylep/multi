import fs from 'fs';
import SiteLayout from '../../components/SiteLayout';
import { MarkdownService } from '../../utils/MarkdownService';

export async function getStaticPaths() {
  // wip - i need to move the filenames-as-slug logic into MarkdownService and then use it here
  //const files = MarkdownService.getInstance().markdownFiles.map((file) => file.slug);
  const paths = files.map((filename) => ({
    params: {slug: filename.replace('.md', ''),},
  }));
  return {paths, fallback: false,};
}

export async function getStaticProps({ params: { slug } }) {
  const fullPath = markdownDirectory + '/' +  slug + '.md';
  const rawMarkdown = fs.readFileSync(fullPath, 'utf8');
  return getRenderedMarkdownAndProps(rawMarkdown);
}

function MarkdownPage({ contentHtml, metaData }) {
  return (
    <SiteLayout>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </SiteLayout>
  );
}


export default MarkdownPage;
