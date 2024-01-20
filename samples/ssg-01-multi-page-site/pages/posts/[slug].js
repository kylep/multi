import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-paths
export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('markdown', 'posts'));
  const paths = files.map((filename) => ({
    params: {slug: filename.replace('.md', ''),},
  }));
  return {paths, fallback: false,};
}

// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props
export async function getStaticProps({ params: { slug } }) {
  const markdown = fs.readFileSync(path.join(process.cwd(), 'markdown','posts',  slug + '.md'), 'utf8');
  const result = await remark().use(html).process(markdown);
  const contentHtml = result.toString();
  return {props: {contentHtml,},};
}

function MarkdownPage({ contentHtml }) {
  return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}

export default MarkdownPage;
