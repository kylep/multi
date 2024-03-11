title: Google Container Registry: Basics
summary: An introduction to the Google Container Registry: pricing and how to store images.
slug: google-container-registry
tags: GCP,Docker
category: cloud
date: 2019-08-05
modified: 2019-08-05
status: published
image: google-container-registry.png
thumbnail: google-container-registry-thumb.png


**This post is linked to from the [GCP: Deep Dive Project](/gcp.html)**

**This post is linked to from the [Blog Website Project](/blog-website.html)**

---

[TOC]


---


# Why use Google Container Registry

The Google Container Registry is a SaaS version of the public [Registry](https://hub.docker.com/_/registry)
docker image. It solves a number of problems that the public Docker image has.
Namely:

- **Authentication**: GCR has built-in access controls, where the Registry image
  does not. With the Docker Registry you need to put something like NGINX in
  front of it to provide access control.
- **HTTPS**: Like with the authentication problem, Registry needs a reverse proxy
  in front of it to serve a certificate. Also, you need to worry about
  obtaining and maintaining the valid cert files. Without a valid cert, each
  Docker client needs to list the registry as an insecure registry, which is
  both insecure and inconvenient.
- **Serverless**: To host a traditional Docker registry, you need a public
  server running Docker. With Google's Container Registry, there's no server to
  maintain.
- **Vulnerability Scanning**: GCR can [scan your images for security issues](https://cloud.google.com/container-registry/docs/get-image-vulnerabilities).


---


# Pricing

The pricing is well documented [here](https://cloud.google.com/container-registry/pricing),
and it has a lot of variables.

Basically though, it boils down to the following approximate costs:

- **Storage**: $0.026 USD / GB / month
- **Network**: ~ $0.12 USD / GB
- **Vulnerability Scanning**: $0.26 per scanned image


---


# Command Line

GCR can be managed from the web UI or the command line. I try and keep my steps
limited to the web UI, but the command line is really easy to use. You can find
its documentation [here](https://cloud.google.com/sdk/gcloud/reference/container/images).


---


# Authentication

Before you start, be sure to install:

- [Google Cloud SDK](https://cloud.google.com/sdk/)
- [Docker](https://docs.docker.com/install/)

To interact with Google Container Registry you need to first authenticate your
local Docker client. Usually this is done with the `docker login <registry>`
command, but that's not how it's done with Google container registry. Instead
we'll use the `gcloud` command line.


## Create a service account

While this isn't strictly necessary, it's good practice.

The container registry uses GCS buckets to store the images. It doesn't have
dedicated roles, and instead uses the GCS roles. You can find a detailed list
of the roles [here](https://cloud.google.com/container-registry/docs/access-control).
The two important roles are `roles/storage.admin` for write and
`roles/storage.objectViewer` for read.

To create the SA from the Google Cloud Web UI:

1. Open the [IAM Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts)
1. If needed, select or create your project
1. Click `Create Service Account`
1. Create a member, such as `gcr-readonly` or `gcr-admin`.
   When possible, its nice to have the account name and account ID match.
1. Assign a useful description to the service-account.
1. Assign a role. `Storage Object Viewer` grants read access and
   `Storage Admin`.
1. Create and download a key. Name it something like `gcr-readonly.json`.



## Authenticate your local Docker client

Use the `gcloud` tool to deploy some `credHelpers` to `~/.docker/config.json`.

```bash
gcloud auth configure-docker --project <project name>
```

Next up, it's time to authenticate.

You could run `gcloud auth login`, but that doesn't use the service account we
just created and also requires a browser to open a generated link.

Instead, use the service account's JSON file generated in the above step with
the `--key-file` argument as follows:

```bash
gcloud auth activate-service-account --key-file /vagrant/auth/gcr-readonly.json
```

If successful, you'll get a confirmation message:

```bash
Activated service account credentials for: [gcr-readonly@*.gserviceaccount.com]
```

---

# Using the Google Container Registry

The GCR works just like any other registry once you've ran the `gcloud auth`
command. You don't need to run any `docker login` command.

## Pull Image

Here's how to pull a Pelican image from GCR:

```bash
docker pull gcr.io/myProject/pelican
```

## Push Image

It's pretty straightforward. Replace `myProject` with your project name.

In this example I add a tag to my pelican image, calling it `pelican2`, and
push it up to the registry as a new image. You'd normally make your own Docker
image.

```bash
sudo docker tag gcr.io/myProject/pelican gcr.io/myProject/pelican2
sudo docker push gcr.io/myProject/pelican2
```

If you didn't get an error, then the image is now pushed.


### Access Denied

If you receive the following message, your user account lacks write access:

```text
denied: Token exchange failed for project 'myProject'. Caller does not have permission 'storage.buckets.get'.
```

To resolve this, create a service account  with the role `roles/storage.admin`.
If there's a finer grained access level to permit this, I'd be interested to
hear about it.

```bash
gcloud auth activate-service-account --key-file /vagrant/auth/gcr-admin.json
sudo docker push gcr.io/kylepericak/pelican2
```


## Delete an Image
At the time of writing this, there's a warning in the cloud UI saying that you
can't delete images unless you use the CLI.

Here's how to do that. Be sure to replace `myProject` with your project.

```bash
# List current images
gcloud config set project myProject

# Ignore this warning if you're using a service account:
# WARNING: You do not appear to have access to project [myProject] or it does not exist.

# Delete the image
cloud container images delete gcr.io/myProject/pelican2
```

