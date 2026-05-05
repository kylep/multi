---
title: "Docker Shared Memory: 64MB /dev/shm Default and --shm-size"
summary: "Docker's default /dev/shm size is 64MB. Raise it per-container with --shm-size, set a daemon-wide default in daemon.json, or remount /dev/shm on the host."
slug: docker-shared-memory
category: development
tags: Docker
date: 2019-09-06
modified: 2026-05-03
status: published
image: Docker.png
thumbnail: docker-thumb.png
keywords:
  - docker default /dev/shm 64mb
  - docker --shm-size default 64m
  - docker shm size default
  - docker shared memory size
  - docker shm-size increase
  - docker dev shm too small
  - change docker default shared memory
  - docker container shared memory configuration
---


Docker supports shared memory. The default /dev/shm size is only 64MB, which is
tiny for anything doing serious IPC or running Chromium-based tools.

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
