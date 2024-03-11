title: Building a Docker Pelican Image
summary: Create a Docker image for Pelican, to convert markdown content into static website files.
slug: docker-pelican-image
category: development
tags: docker, Pelican
date: 2019-08-01
modified: 2019-08-01
status: published
image: Docker.png
thumbnail: docker-thumb.png


**This post is linked to from the [Blog Website Project](/blog-website.html)**

---

Pelican is a free and open source static website generator written in Python.
It accepts a theme, a config file, and a directory of markdown documents as
input and uses them to generate the HTML and CSS files that make up a static
website.

This post covers how to build a Docker image that contains the Pelican software
and the theme which I chose to use with it. This image is reusable and
[freely available on Docker Hub](https://hub.docker.com/r/kpericak/pelican).


# Dockerfile

As with any Docker image, the most important piece is the Dockerfile.

You can see the current file I'm using [here](https://github.com/kylep/pelican/blob/master/Dockerfile).

In this Dockerfile, Pelican, its theme, and plugins are installed to the image.

```text
FROM ubuntu:bionic
ADD requirements.txt ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         git \
         python \
         python-pip \
         python-setuptools \
    && rm -rf /var/lib/apt/lists/* \
    && pip install -r requirements.txt \
    && git clone https://github.com/kylep/voidy-bootstrap.git /theme \
    && mkdir -p /tmp-plugins/ /plugins \
    && git clone --recurse \
           https://github.com/getpelican/pelican-plugins.git /tmp-plugins \
    && cp -r /tmp-plugins/series /plugins/ \
    && rm -r /tmp-plugins
```


### FROM ubuntu:bionic

This section specifies the Docker base image. The above docker file uses
[the official Docker Hub Ubuntu image](https://hub.docker.com/_/ubuntu/).


### ADD requirements.txt

The requirements.txt file lists the python packages which Pelican depends upon.
Docker's `ADD` will copy that file into the image at the specified path.

The minimum packages required are:
```text
pelican
markdown
```


### RUN ...
The run task is basically a bash script all squished into one line. While its
harder to read with all the line continuation and `&&` symbols, using them
leads to Docker only building a single layer.

[See the best practices for writing docker images](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/).

Since this is an Ubuntu image, `apt` is the package manager. It installs Git
and some python packages. Git is required to pull the Pelican theme from
Github.

Only the minimum Python packages are installed by apt, since pip is the
preferred python package manager.

`rm -rf /var/lib/apt/lists/*` removes the leftover apt artifacts, helping to
shrink the Docker image.

After the theme is pulled from GitHub, Pelican's open source plugins are also
pulled. The ones desired are copied to `/plugins`, then the (huge) checkout is
deleted to reduce image size.


---


# Running the Docker Image

Locally, you need to mount the content into the container. Something like this
will work:

```bash
docker run \
  --name pelican \
  -v $(pwd):/workspace \
  gcr.io/kylepericak/pelican:latest \
  pelican -o /workspace/output -s /workspace/pelicanconf.py
```

The above command will load the `content/` and `pelicanconf.py` files into
Pelican, and write the static website to `output/`.
