# SSG-002: Front Matter & Style

This is intended to build upon [ssg-01-multi-page-site](../ssg-01-multi-page-site).
Reference that to see the starting state for these instructions.

## Objective
This guide starts with a set of markdown files that all get rendered into basic HTML,
and an index page to help discover them. We'll add some metadata to the posts using
front matter, then leverage that metadata for some common styling.

## What is Front Matter?

Front matter is some yaml at the start of a mardown file. It follows a format like this:
```markdown
---
title: My Markdown Post
date: 2024-01-21
---
```

Below it, the usual content of the markdown file is placed.

# Prepare the content files

## Define an image

Make a new directory for images
```bash
mkdir img
```

Add a file into it. I had DALL-E create `img/blog.webp`.

## Add metadata to each file

`ls markdown/posts`
```bash
one.md    sample.md three.md  two.md
```

For each one, add something like this at the very top:

```markdown
---
title: Sample Markdown Page
summary: A simple demonstration of markdown rendering as HTML
image: blog.webp
created: 2024-01-20
updated: 2024-01-24
tags: sample,blog
---
```

# Parse the metadta with gray-matter

Install it
```bash
npm install gray-matter
```

Now we'll modify the file that renders the markdown, `pages/postes/[slug.json]`, to use
the gray matter library.

The existing code reads the raw markdown content using `fs.readFileSync`, saves it to
`const markdown`. We'll rename that to `const rawMarkdown`, then use
`matter(rawMarkdown)` to pull the metadata out.

The object returned by matter() typically contains two main properties:
- data: An object containing the parsed frontmatter.
- content: A string of the markdown content without the frontmatter.

We'll destructure those out into `markdown` and `metaData`, putting us about back where
we started but with the metadata added above now available for use. Let's return the
metadata from `getStaticProps` so we can use it in our `MarkdownPage` React component's.
JSX.

`vi pages/posts/\[slug\].js`
```js
import matter from 'gray-matter';
// ...

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

// ...
  const rawMarkdown = fs.readFileSync(path.join(process.cwd(), 'markdown','posts',  slug + '.md'), 'utf8');
  const { data: metaData, content: markdown } = matter(rawMarkdown);
  serializeDates(metaData);
  // ...
  return {props: {contentHtml, metaData},};
```


# Apply some common styling using the metadata

Now that `getStaticProps` is returning some `metaData`, lets extend the `MarkdownPage`
React function to leverage it. It can pass the content into other components.

Make a directory for the new components:

```bash
mkdir components/
```

Write a really basic common header for the blog pages. I like styled components, sort
of a concession to the minimal approach, but I don't want to come back and rewrite that
part.

```bash
npm install styled-components
npm install --save-dev babel-plugin-styled-components
```

Write a babelrc file:

`vi .bablerc`
```json
{
  "presets": ["next/babel"],
  "plugins": [["styled-components", { "ssr": true, "displayName": true }]]
}
```

This is really basic, sort of a common page header. The below works to show the example,
but I've actually extended this out a bit further using no new concepts in the actual
code.

`vi pages/posts/\[slug\].js`
```js
import styled from 'styled-components';

const HeaderContainer = styled.div`
  background-color: #f5f5f5;
  padding: 10px 20px;
  border-bottom: 2px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const IndexLink = styled.a`
  text-decoration: none;
  color: black;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
`;

const PostHeader = ({ title }) => (
  <HeaderContainer>
    <IndexLink href="/">Index</IndexLink>
    <Title>{title}</Title>
  </HeaderContainer>
);

export default PostHeader;
```

Back in the slug file, extend the `MarkdownPage` component to use the new PostHeader.

`vi pages/posts/\[slug\].js`
```js
import PostHeader from '../../components/PostHeader'; // Adjust the path as necessary
// ...

function MarkdownPage({ contentHtml, metaData }) {
  return (
    <div>
      <PostHeader title={metaData.title} /> {/* Use PostHeader */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}
```


# Adding MUI

I won't go through how to use MUI in the SSG site  here. It's big and not reall in the
 spirit of this guide.

For transparency I added these packages before deciding to split it into its own guide.

```bash
npm install \
  @mui/material \
  @emotion/react \
  @emotion/styled \
  @mui/icons-material \
  @mui/material-nextjs \
  @emotion/cache \
  @mui/material-nextjs
```


