# Static-Base: A NextJS Minimal Static Site Generator (SSG)

## Project Setup


Make a Next.js app:
```
npx create-next-app@latest static-base
```

Answer the prompts as follows:
```
Ok to proceed? (y) y
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? …  Yes
✔ Would you like to use `src/` directory? …  Yes
✔ Would you like to use App Router? (recommended) …  Yes
✔ Would you like to customize the default import alias (@/*)? … No
```

Install remark and remark-html:
```
npm install remark remark-html
```

Hop into the new app directoryc
```
cd static-base
```

Add `node_modules` to your gitignore lest the repo get messy:
```
echo "node_modules" >> .gitignore
```

Make directories for the markdown files and tempate:
```
mkdir -p markdown pages
```

## Create a simple template

Create a page in `pages/` that will render the markdown.

`vi pages/render.js`
```js
import fs from 'fs/promises'; // file system module to read files
import path from 'path'; // path module to handle file paths
// as of 2020, remark seems to be more popular than marked for markdown processing (by npm downloads)
import { remark } from 'remark';
import html from 'remark-html';

// the sample markdown file will be translated to HTML
const MARKDOWN_FILE_PATH = 'markdown/sample.md';

// getStaticProps is a Next.js function that fetches data at build time
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
```

Next, write a markdown file mocking out some site content.

`vi markdown/sample.md`
```markdown
# h1 Header
Lorem ipsum dolor sit amet.

## h2 Header
Consectetur adipiscing elit.

### h3 Header
Sed do eiusmod tempor incididunt.

---

Some `code` and a [link](http://kyle.pericak.com).

```


# Test it out

Start the node dev server to give it quick preview.
```
npm run dev
```

By default it'll serve the default landing page on http://localhost:3000.
To view the rendered page, navigate to the example page: http://localhost:3000/example.
It's located at `/render` because the file in `pages/` is called `render.js`.

*Note*: The route to `/render` doesn't get rebuilt if you move the file to have another
name. If you want to rename the file, the dev server will break and you'll need to exit
the dev server and run `npm run build` first to fix it.

# Build it to be distributable


