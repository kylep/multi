# Blog

NextJS powered SSG for http://kyle.pericak.com.

This blog was previously powered by [Python Pelican](https://getpelican.com/), and there was
nothing wrong with that, but I wanted to learn something new and modern. Plus I'd gone a few years without
writing to my blog so I figured a new framework might help motivate me.

## Setting up the dev environment

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
bin/build-blog-files.sh blog/out/
ls blog/out/
```

## Launching dev server

Uses the nice built-in dev workflow, handy for fast build & check but not
totally aligned with how it works in production. NextJS can be all
too willing to act as a backend client-side rendering server instead of
just a static site generator. At this point I think I've got dev working very closely
to how prod works.

If you get a 404 on `http://localhost:3000`, try `http://localhost:3000/index1`

```bash
bin/start-dev-npm.sh
```

## Launch the (local) staging env

This behaves more like how prod works, using the actual static files from the build
and serving them from a Docker container on a different port. It does volume-mount,
so the dev-test cycle is still not terrible if changes are needed, but you need to
manually re-run the build each change.

```bash
bin/start-staging-nginx.sh
```

## Manually push files to prod

The CI should push the files up to prod, but if you're impatient or it's not working,
build and push yourself. Make sure your gcloud cli is authd first.

```
build-blog-files.sh
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

## Syntax Highlighting

I only downloaded the prism.js languages that I figured I was likely to use. If one isn't working,
probably need a new css file.


---


# Prod Build & CI Pipeline Details

- The blog is hosted as static files in a GCP storage bucket that is public to the internet.
- Google Cloud Build is configured to read `apps/blog/cloudbuild.yaml` on commit.
- The Cloud Build Trigger is in the `global` region. You can find the config in `tf/`.


## IaC Google Cloud Build Setup

This isn't in CI itself, sort of a chicken and egg thing. I just use my default gcloud
auth with my own account for this, so no service account is involved here.

```bash
gcloud auth application-default login
cd tf
terraform init
terraform plan  # Review the changes
terraform apply
```

## Building and pushing the Docker image

This is also outside of CI. I could make it fancy and only conditionally build it
but honestly I'm working alone on this so just manually build and push it when it needs
to change. Easiest way to do this is to run `build-and-push-docker-image.sh`, but the
script is really just a reminder of the following commands.

```bash
gcloud auth configure-docker
docker-compose build
docker push gcr.io/kylepericak/kylepericakdotcom:latest
```

## Testing the Google Cloud Build setup

GCB has a `/workspace` dir mounted to all running containers in a cloud build.
This is used to first store the static files, then rsync them up to the storage bucket.

Here's a command to test that build command locally:

```bash
docker run --rm -v ./blog/markdown:/app/blog/markdown:ro -v ./workspace:/workspace -it gcr.io/kylepericak/kylepericakdotcom bash /app/bin/build-blog-files.sh /workspace/out
```


