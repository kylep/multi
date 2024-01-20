import fs from 'fs/promises'; // file system module to read files
import path from 'path'; // path module to handle file paths
// as of 2020, remark seems to be more popular than marked for markdown processing (by npm downloads)
import { remark } from 'remark';
import html from 'remark-html';

// the sample markdown file will be translated to HTML
const MARKDOWN_FILE_PATH = 'markdown/sample.md';

// getStaticProps is a Next.js function that fetches data at build time
// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props
export async function getStaticProps() {
  // Load the markdown file for parsing
  const markdownFilePath = path.join(process.cwd(), MARKDOWN_FILE_PATH)
  const markdown = await fs.readFile(markdownFilePath, 'utf8');
  // Note remark's use of plugin architecture here with use(html):
  //   There are lots of other plugins available like emjoi, math (TeX, LaTeX), toc (table of contents),
  //   and remark-highlight.js which can highlight code blocks in markdown.
  // process(markdown) accepts the above-loaded markdown content
  const result = await remark().use(html).process(markdown);
  const contentHtml = result.toString();

  return {
    props: {
      contentHtml,
    },
  };
}

// render the page, it's "dangerous" since there's xss risk but there's no user-accepted content here
function MarkdownPage({ contentHtml }) {
  return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}

export default MarkdownPage;
