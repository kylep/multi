title: Local Pelican Development Environment
summary: How to set up a Docker-based local development environment for Pelican static sites.
slug: pelican-dev-environment
category: development
tags: Pelican, Docker
date: 2019-08-04
modified: 2019-08-04
status: published
image: gear.png
thumbnail: gear-thumb.png


**This post is linked to from the [Blog Website Project](/blog-website.html)**

---

Nobody wants to test in production.

This guide covers how to preview your Pelican content locally as you write it.
Every time you save a markdown file or update the Pelican theme, the entire
site will re-generate and be hosted by a local web-server for you to review.


# Install Dependencies

- [Docker](https://docs.docker.com/install/)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Text Editor: Your choice, I use [Vim](https://github.com/vim/vim)
- Browser: Chrome has nice developer tools but anything works


---


# Get the Pelican Image

**Option 1: Build your own**

This is the approach I suggest. You can see the guide I wrote explaining how to
build a Pelican image [here](/docker-pelican-image.html).

**Option 2: Use a pre-made image**
I've shared my image for public use [here](https://hub.docker.com/r/kpericak/pelican).
If you plan on using it, you're best bet is to check how I use it on GitHub.


---


# Launch a Persistent Pelican Container

Once you've either pulled or built the image, it will be listed in your Docker
image list.

```bash
docker image list
```

Set the following variables. Note the paths should be absolute (vs relative).

- `$image_name`: docker image name
- `$conf_file`: path to `pelicanconf.py` configuration file
- `$content_dir`: path to `content/` directory, where markdown files reside
- `$output_dir`: path to `output/` directory, where generated files will land.
- `$listen_port`: Which port to listen on for the dev web-server

Optionally, you can set a theme path too. If you omit this and its associated
volume mount then the theme built into the Pelican image will be used instead.
This enables theme development.

- `$theme_path`: Path to the Pelican theme

Start the Docker container in daemon mode (`-d`)  as persistent container.
By setting the run command to `tail -f /dev/null`, the container will never
stop itself and instead sit idle until told to do otherwise.

Mount the directories specified by those variables into the container.

Forward `$listen_port` to the workstation so the site can be opened in a local
browser.

```bash
image_name=""
conf_file=""
content_dir=""
output_dir=""
theme_path=""
listen_port=8000

docker run -d \
  --name pelican \
  -v $conf_file:/pelicanconf.py \
  -v $conftent_dir:/content \
  -v $output_dir:/output \
  -v $theme_path:/theme" \
  -p 0.0.0.0:$listen_port:8000 \
  image_name \
  tail -f /dev/null
```

---


# Launch Development Web-Server

At this point you have a pelican container running, but it isn't doing
anything. The files are all mounted in, and it's prepared to forward its local
port 8000 to your specified workstation port, so all that's left is to start
Pelican's built-in development service.

This service will watch both the markdown files and the theme files for
changes, then reload the site files. It will also host the website on a
non-production web-server.

```bash
docker exec -it pelican \
  pelican \
    -s /pelicanconf.py \
    --debug \
    --autoreload \
    --listen \
    --port 8000 \
    --bind 0.0.0.0 \
    /content \
    -o /output
````
