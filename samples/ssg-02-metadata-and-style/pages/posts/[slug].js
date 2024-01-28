import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

import PostHeader from '../../components/PostHeader'; // Adjust the path as necessary


// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-paths
export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('markdown', 'posts'));
  const paths = files.map((filename) => ({
    params: {slug: filename.replace('.md', ''),},
  }));
  return {paths, fallback: false,};
}

// Required to turn date objects in strings when grey-matter collects ex 2024-01-1 as
// an object. Without this, you can expect errors.
const serializeDates = (obj) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] instanceof Date) {
        obj[key] = obj[key].toISOString(); // Convert Date to String
      }
    }
  }
};

// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props
export async function getStaticProps({ params: { slug } }) {
  const rawMarkdown = fs.readFileSync(path.join(process.cwd(), 'markdown','posts',  slug + '.md'), 'utf8');
  const { data: metaData, content: markdown } = matter(rawMarkdown);
  serializeDates(metaData);
  const result = await remark().use(html).process(markdown);
  const contentHtml = result.toString();
  return {props: {contentHtml, metaData},};
}

function MarkdownPage({ contentHtml, metaData }) {
  return (
    <div>
      <PostHeader title={metaData.title} /> {/* Use PostHeader */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}


export default MarkdownPage;
