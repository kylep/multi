# SSG-003: Material UI in a Static Site

This is intended to build upon [ssg-02-metadata-and-style](../ssg-02-metadata-and-style).
Reference that to see the starting state for these instructions.

## Objective
Last guide added some basic styles and metadata that can be used in templates. This one
will show how to set up MUI and provide some really basic examples. I'll add a fair bit
of styling to this sample repo too.


# Build a better test env

Any QA will tell you that it's critical to stage your changes in an environment that's
as similar to prod as possible.x1

Using `npm run dev` is great for fast feedback and testing, but it's not truly using
the static site files that get created. I want to be sure that the files I'm making
work the way I want them to.

Let's just use nginx
```bash
mkdir bin
touch bin/start-dev.sh
chmod +x bin/start-dev.sh
```

Then write a little startup script
```bash
#!/bin/bash
docker run --name blogdev -it -v $(pwd)/out/:/usr/share/nginx/html -p 8080:80 --rm nginx:latest
```

Running that script will host the site using the static files, letting you be sure it
looks right.


# Quick review of special files

While styling the site, let's review some files that matter

- `pages/_app.js`:  allows you to import global CSS files that affect all pages and it's where theme settings get applied.
  Analytics can go in here too.
- `pages/_document.js`: Customizes the HTML document. Useful for server-side rendering and for adding HTML tags that are common across all pages like custom fonts or a <head>.
- `pages/_error.js``: Custom error handling. Create a custom error page that will be displayed in case of a 404 or 500 error.
- `pages/_middleware.js`: Not really being used in this SSG setup
- `next.config.js`: Used to configure nextjs for ssg export mode.
- `.babelrc`: Configures the javascript compiler


# Install Material UI

Install the base packages.

- @mui/material: Core Material UI library. Provides React components.
- @emotion/react: MUI uses it for styling its components. Install it, to enable
  styling of components using the CSS-in-JS approach.
- @emotion/styled: Allows you to create React components with styles attached to them.
  Used for customizing Material UI components beyond basic theming.
- styled-components: Lets you style components like `StyledAppBar = styled(AppBar)`
- babel-plugin-styled-components: improves the server-side rendering of styled components. Tbh I'm not sure we need this.
- @mui/icons-material: Used for icons like the HomeIcon

```bash
npm install \
  @mui/material \
  @emotion/react \
  @emotion/styled \
  styled-components \
  babel-plugin-styled-components \
  @mui/icons-material
```

# Set up styles

## Write a global style sheet

Make a really basic stylesheet for global styles. Let's change the default body margin. I erased anything already in there.

This sheet will be applied on all pages.

`vi src/app/global.css`
```css
body {
    margin: 0;
    padding: 0;
}
```

## Load the global style sheet

This happens in `pages/_app.js`. That's pretty much all we're going to do with this file.

`vi pages/_app.js`

```js
import '../src/app/global.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```


## Make a generic common template

Yeah this one's in tsx, I'll convert the rest later.
This example is absolutely minimal, but this file is the one we'll be extending. We'll take a lot of the styling out of the
prior slug file and move them here, later. 

`vi src/app/layout.tsx`

```tsx
import React from 'react';

const Layout: React.FC = ({ children }) => {
  return <div>{children}</div>;
};

export default Layout;
```


# Define a page layout

## Make some sample components
```bash
mkdir -p components
```

Here's what a minimal sample component might look like:

```js
import React from 'react';

function MyComponent({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default MyComponent;
```

Or if it has no children:

```js
import React from 'react';

function MyComponent() {
  return (
    <div></div>
  );
}

export default MyComponent;
```


The page layout will be defined in `src/app/layout.tsx` and have the following major components:

```jsx
<SiteLayout>
  <SiteNavHeader />
  <SiteTitle />
  <PageContent>
    {content}
  </PageContent>
  <SiteFooter>
</SiteLayout>
```

Then the `pages/[slug].js` files will be fed into content, having something like this:

```jsx
<BlogPostRow>
  <BlogPostContent>
    <MarkdownPage />
  </BlogPostContent>
  <BlogSidebar />
</BlogPostRow>
```

# Defining the template

`vi src/app/layout.tsx`