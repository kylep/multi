# SSG-001: Multi Page static site

This is intended to build upon [ssg-00-static-base](../ssg-00-static-base). Reference
that to see the starting state for these instructions.


## Objective
Go from rendering one file to having a navigable site that combines multiple markdown
files all sharing some common but minimal template styles.

## Make more markdown files

We might want to do something else with markdown later too, so first let's specify
that these markdown files are for blog posts.

```bash
mkdir -p markdown/posts
mv markdown/*.md markdown/posts
```

In the ideal end state, each markdown file in `markdown/` will end up making a new html
file in `out/`. To see if that's working, we'll need to have more files.

```bash
echo "# one" > markdown/posts/one.md
echo "# two" > markdown/posts/two.md
echo "# three" > markdown/posts/three.md
```

## Create the dynamic route

Move `pages/render.js` to `pages/posts/[slug].js`. Literally that, with the square brackets.
The square brackets are used in Next.js's pages directory to create dynamic routes. The
part inside the brackets, `slug`, is a variable. Later, page components will be able
to access the value of `slug` through the query parameters of the router. It works as a
sort of wildcard, accepting any submitted value and then letting you work with it,
for example `/one` or `/foo`.

The directory `posts` is used to automatically prepend the URL, so for example the file
`markdown/one.md` would be routed at `/posts/one`



```bash
mkdir -p pages/posts
mv pages/render.js "pages/posts/[slug].js"
```


## Swap out the fs import

We were using `import fs from 'fs/promises';` before to get the `readFile` function.
That function returns a promise and isn't what we really want to use here. Replace it
with one that's synchronous by using `import fs from 'fs';`. We'll swap in `readFileSync`
below.

`vi pages/\[slug\].js`
```js
import fs from 'fs';
```

## Define getStaticPaths

Above `getStaticProps`, write a new function, `getStaticPaths`. It will read all the
files in the `markdown` folder and use their file names, minus the `.md` suffix, as the
URL slug. That's not ideal, I'd like to pull the slug from a property at the top of the
markdown, but it's a good and simple place to start.

The `getStaticPaths` function is special in Next.js,
[documented here](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-paths).
It's used to determine which paths will be pre-rendered by Next.js at build time.

The return value contains `paths`, which is a list of objects, where each object
contains a `params` key, with a value of an object that defines the `slug` for that
file. It alo sets `fallback: false`, causing a 404 to be returned if the path isn't
defined, which suits a static site well - there's not going to be a Netx.js server
running to render anything else.

`vi pages/posts/\[slug\].js`
```js
export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('markdown', 'posts'));
  const paths = files.map((filename) => ({
    params: {slug: filename.replace('.md', ''),},
  }));
  return {paths, fallback: false,};
}
```

## Update getStaticProps

Another Next.js function, `getStaticProps` is also well documented -
[here](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props).
This function is automatically called by Next.js to fetch data during the build process
while rendering the static pages.

For each path returned by getStaticPaths, Next.js calls getStaticProps with the
appropriate parameters to fetch data specific to that path. It uses JavaScript's
destructuring assignment to set the value of `slug` each time it's called.

In ssg-00, we had it loading a specific file and rendering the output. Rewriting it
now a bit, we accept a function parameter of `{ params: { slug } }`. Other than that,
it works basically the same as explained before.


```js
export async function getStaticProps({ params: { slug } }) {
  const markdown = fs.readFileSync(path.join('markdown', slug + '.md'), 'utf8');
  const result = await remark().use(html).process(markdown);
  const contentHtml = result.toString();
  return {props: {contentHtml,},};
}
```

Lastly, the `MarkdownPage` component remains unchanged and is the `export default` of
this route. In Next.js, the default export of every file in `pages/` should be a React
component.


## Give it a try

Do a quick build to check that the results are as expected:

```bash
npm run build
```

And confirm the dev server works to quickly look at your changes:

```bash
npm run dev
```

Then go to `http://localhost:3000/one`, for example.


---

# Build an index/landing page

Now that we have multiple pages and routing, we want our users to be able to discover
them. In the spirit of keeping things minimal, we'll just make a page that sits at the
`/` route, creates an `index.html` file, and links to the other pages.

The easiest way to do this, in the short term, would be to just write an `index.md` page
in the `markdown/` directory, but then we'd have to curate that over time manually and
that's no fun. Instead, let's make it dynamically generate the links.

Create a new page file, `pages/index.js`. We'll use `getStaticProps` again to read in
the markdown files, and then return some really simple HTML for the index page.

The default exported function, `IndexPage`, returns some [JSX](https://react.dev/learn/writing-markup-with-jsx)
that leverages the `map()` function to loop through each slug found in the `markdown/`
directory. It's important to remember that returned JSX needs to have a single
top-level container, thus that `<div>`. Also note the used
[Link](https://nextjs.org/docs/pages/api-reference/components/link) syntax, we use that
instead of just using `<a>` tags in Next.js, and it wraps the Links with anchor tags.

For now, we'll use the slug as the title. We will deal with metadata later.

__Note about routing precedence__: The named files in `pages/` are static routes.
Those take precedence over dynamic routes that get defined by `pages/posts/[slug].js`.
`index.js`, being a special name, gets routed to `/` (depending on your server config).
If we had another file, say `pages/contact.js`, it would also be loaded instead of any
content from a file in `markdown/contact.md`.

`vi pages/index.js`
```js
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export async function getStaticProps() {
  const files = fs.readdirSync(path.join('markdown', 'posts'));
  const markdownFiles = files.map(filename => ({
    slug: filename.replace('.md', ''),
    title: filename.replace('.md', ''),
  }));
  return {props: {markdownFiles,},};
}

function IndexPage({ markdownFiles }) {
  return (
    <div>
      <h1>Pages</h1>
      <ul>
        {markdownFiles.map(file => (
          <li key={file.slug}>
            <Link href={`/posts/${file.slug}`}>{file.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default IndexPage;
```

## Remove the default index page
If you'd try and run this now, you'd get an error saying `Conflicting app and page file
was found, please remove the conflicting files to continue`. To resolve that, remove
the original index file:

```bash
rm src/app/page.tsx
```

## Check it out

```bash
npm run build
npm run dev
```
