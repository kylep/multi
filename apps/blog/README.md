# Blog

NextJS powered SSG for http://kyle.pericak.com.

This blog was previously powered by [Python Pelican](https://getpelican.com/), and there was
nothing wrong with that, but I wanted to learn something new and modern. Plus I'd gone a few years without
writing to my blog so I figured a new framework might help motivate me.

## Set up the build environment

Install next and the dependencies
```bash
cd blog
npm install
```

Then from the base directory (with this README), verify the setup by building the static files.

## Building the static files

Renders all the markdown files using the templating defined in this project,
then outputs them to `out/` as .html files to be served as static content.

```bash
bin/build-blog-files.sh
ls blog/out/
```

## Launching dev server

Uses the nice built-in dev workflow, handy for fast build & check but not
totally aligned with how it works in production. NextJS can be all
too willing to act as a backend client-side rendering server instead of
just a static site generator. At this point I think I've got dev working very closely
to how prod works.

```bash
bin/start-dev-npm.sh
```

## Launch the staging env

This behaves more like how prod works, using the actual static files from the build
and serving them from a Docker container on a different port. It does volume-mount,
so the dev-test cycle is still not terrible if changes are needed, but you need to
manually re-run the build each change.

```bash
bin/start-staging-nginx.sh
```

## Deploy to production

Ships the build artifacts from out/ up to GCP where they're hosted.
While I'm not using Pelican any more, I covered the infrastructure that uses in my old
blog's Project post [here](https://kyle.pericak.com/blog-website.html).

This is handled by the CI pipeline, but you can run it manually, too.

```bash
bin/prod-deploy.sh
```


---

# About the code

## Routing

The routing rules and base component for the pages can be found in `blog/pages/[..route.js]`.
With NextJS running as a webserver that file would catch every URL path that wasn't otherwise defined.
When rendering the static site, it works to create a .html file for each element of the 
`paths` array in `getStaticPaths`.


## Styling & Content Paths

- I've tried to keep the styles as close to the code as possible.  Primarily in react's `sx` props on page components
- Components are defined in `blog/components`. 
  - The common/base page component is `blog/pages/[..route.js]`. It handles routes and page structure.
  - Components have been organized to have 1 export per file.
- Theme styles and `<head>` are in `pages/_app.js`. 
  - Theme CSS is used mainly for component elements that can use `<Typography>` blocks
- Global styles, and specifically styles for blog post content that gets rendered to HTML by `remark`, are in `styles/globals.css` since they can't easily use `<Typography>`


## Content Formatting

- Using `remark` to format Markdown into HTML
- Using `remark-toc` to format text headers to table of contents, like `#### Table of contents`
- Using `remark-gfm` to allow support for tables and such, see [Github Flavoured Markdown](https://github.github.com/gfm/)
