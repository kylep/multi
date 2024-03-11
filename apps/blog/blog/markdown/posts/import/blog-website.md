title: Project: Blog Website
summary: Build a blog that is affordable, maintainable, and extensible using tools from the Google Cloud Platform.
slug: blog-website
tags: Pelican,GCP
category: projects
date: 2019-07-27
modified: 2019-08-01
status: published
image: blog.png
thumbnail: project-blog-thumb.png



The objective of this project is to build a technology blog website,
satisfying the following requirements:

- **Affordable**: The website should cost as little as possible to maintain
- **Maintainable**: Authoring and updating content on the website should be
  simple and fast.
- **Extensible**: This is a software developer's website. It needs to enable
  custom code so fun features can be built into it.
- **Custom Domain**: Some free/cheap blog options require a custom FQDN suffix,
  such as `x.wordpress.com` sites. This blog needs to work with any domain
  name.
- **Fun**: The blog needs to use technologies that are current and interesting.


---


# Project Posts & Progress

This project includes, or will include, the following posts.
If any aren't finished, check back later!

<table class="project-table">
  <tr>
    <th>Status</th>
    <th>Article</th>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Writing a custom Pelican Theme</td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/docker-pelican-image.html">
        Building a Pelican Docker image
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/writing-pelican-content.html">
        Writing blog content for Pelican
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/pelican-dev-environment.html">
        A simple Pelican development environment
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/google-container-registry.html">
        Saving Docker images in Google's Container Registry
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/google-cloud-build.html">
        Google Cloud Build with GitHub Trigger
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/google-cloud-storage-website.html">
        Hosting a website using Google Cloud Storage
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/cloudflare-https.html">
        Using Cloudflare to provide HTTPS
      </a>
    </td>
  </tr>

</table>


---


# Design & Workflow

At a high level, with this setup you just write your content and push it to
git. The rest takes care of itself.

Here's how it works:

1. Blog content is written as text in markdown files. I use Vim.
1. When the content is ready, code is pushed to a GitHub repository.
1. A Google Cloud Build trigger watches for commits. When one happens, it loads
   the Git master branch to its temporary workspace.
1. Cloud Build loads a pre-created Pelican Docker image is from Google's
   Container Registry, and executes it against the markdown files to generate
   a static website's .html and .css files.
1. Cloud Build uses an rsync image to transfer the files to a Google Storage
   bucket.
1. Google Storage hosts the static site files on a custom domain as a website.


![Blog architecture diagram](/images/blog_workflow.png)


---


# Setup: Configuring Pelican and GCP

## Pelican Theme

Before Pelican can render the markdown files into a site worth looking at,
it needs a theme to work with.

The easiest way to go is to [select a pre-made theme.](http://www.pelicanthemes.com/)

Personally, I forked a theme then heavily modified it.
Forking the theme prevents it from changing, and lets you change things as
needed. I'd suggest creating a fork of the theme even if you won't change it.


## Pelican Docker Image

### Containerize Pelican

Next, the pelican software needs to be containerized for Cloud Build to use it.
You can either grab an existing image, such as the one I've shared on Docker
Hub, or build your own.

**[How to build a Docker image for Pelican](/docker-pelican-image.html)**

### Push Pelican Image to GCR

The Pelican image needs to be in the Google Container Registry for Cloud Build
to use it. GCR is like Docker Hub, but private and not free. It's pretty
affordable.

**[Using Google Cloud Registry](/google-container-registry.html)**


## Development Environment

Google Storage's website hosting feature is great, but it has a cache that I
haven't yet figured out how to bypass. This means that if you push a mistake to
the storage, then push a fix, the fix may not display for like an hour.

To get past this, using a local service for development is a nice solution.
Also, this way you're not testing your code in production.

You can see the utility script I made [here](https://github.com/kylep/kyle.pericak.com/blob/master/bin/pelican-dev.sh),
but basically you just run a local Pelican image, then run `pelican` against
your content files with `--listen` and `--autoreload`.

**[Pelican Website: Local Development Environment](/pelican-dev-environment.html)**


## Cloud Build

Google Cloud Build is the automation framework used to watch for changes
committed to github, then transform the content files into a website and save
them to Google Cloud Storage.

Configure Cloud Build to watch for commits to the master branch of the blog
content repository, then run the pelican and rsync jobs against it.

**[Google Cloud Build: Automatically Deploy Changes from GitHub](/google-cloud-build.html)**


## Google Storage Web Hosting

At this point, you've written your content, converted it into web files, and
synchronized those files with Google Cloud Storage. To make the website
accessible, you need to configure Google Cloud Storage to host the content as
a website. This step is also where you point your custom domain name at the new
site.

**[Google Cloud Storage: Static Website Hosting](/google-cloud-storage-website.html)**


# Secure the site with HTTPS

These days there's really no good excuse to not have HTTPS on your site. On
a self-hosted site I usually use [LetsEncrypt](https://letsencrypt.org/), but
for this static site instead I've used the built-in HTTPS feature of
CloudFlare's free CDN solution.

**[Using Cloudflare to provide HTTPS to an HTTP static site](/cloudflare-https.html)**
