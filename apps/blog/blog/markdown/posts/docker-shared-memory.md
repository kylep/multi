---
title: Docker Shared Memory (/dev/sdh)
summary: "Docker's 64MB /dev/shm default is tiny. Raise it per-container with --shm-size, set a daemon-wide default in daemon.json, or remount /dev/shm on the host."
slug: docker-shared-memory
category: development
tags: Docker
date: 2019-09-06
modified: 2019-09-06
status: published
image: Docker.png
thumbnail: docker-thumb.png
keywords:
  - docker shared memory size
  - docker shm-size increase
  - docker dev shm too small
  - change docker default shared memory
  - docker container shared memory configuration
---


Docker supports shared memory. The default is only 64MB though which is TINY.

The small size became a problem during a containerized OpenStack upgrade.

This will be a really short post because I haven't done much playing with the
shared memory yet, I just think its really neat.


---


# Change the /dev/shm size on the system

This lets you change the size of shared memory on a host.

```bash
mount -o remount,size=1G /dev/shm
```


---


# Update Docker Daemon's Default Shared Memory Size

This will update the default across the whole Docker service.

`vi /etc/docker/daemon.json`

```json
{
  "default-shm-size": "512M"
}
```


---


# Set a Containers Shared Memory Size

Here's how to change it for a specific container at runtime.

```bash
docker run -it --shm-size=512M
```
