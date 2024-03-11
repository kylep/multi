title: Building an API on GCP with Cloud Endpoints
summary: Uses Google Cloud Platform's Cloud Endpoints to build a new API
slug: gcp-api-cloud-endpoints
category: gcp
tags: gcp, api
date: 2019-10-09
modified: 2019-10-09
status: draft


This post covers my experience testing the Google Cloud Endpoints product.

*Note*: I tried to start here before learning Google App Engine and Google Cloud
Functions. That was a mistake. Google Cloud Endpoints is basically useless
without something to back the endpoints. I'd thought this would be a third way
of building them, but instead this product is a layer on top of those existing
products which provides additional API-specific functionality.


# Why?

Two reasons. Both stem from the fact that this tech blog is built on Pelican,
an open source static site generator. Static sites are great, they're really
affordable and easy to manage, but they are by definition static.

I wanted a bit of dynamic content:
1. Viewer stats - Google offers nice data but I wanted a bit of my own
1. Comment support

This post won't cover how I made either of those features, I'll save that for
another post. In this post, I'm specifically covering how I made  a generic API
on Google's serverless Cloud Endpoints tool.

---


# Building a Hello World API

As usual, I'm mostly re-hashing an official guide but adding my commentary and
notes to it. In this case, I started with the [Cloud Endpoints Quickstart](https://cloud.google.com/endpoints/docs/quickstart-endpoints).


## Choosing a Cloud Endpoint option

There are three options for cloud endpoints:
1. OpenAPI
2. gRPC (Google Remote Procedure Call)
3. Google App Engine

I'm not going to use gRPC because it looks just way too proprietary. Also, I
have a REST endpoint in mind, not an RPC API.

App Engine looks nice, but until it supports Python 3 I don't think its a good
idea to write any code for it. Python 2 gets deprecated in a few months at the
time of my writing this.

That leaves [OpenAPI](https://en.wikipedia.org/wiki/OpenAPI_Specification),
formerly known as [Swagger](https://swagger.io/docs/specification/about/).


## Create and upload an OpenAPI file

I made a git repo, which I might not bother pushing, and pulled the example
openAPI file.

```bash
wget https://raw.githubusercontent.com/GoogleCloudPlatform/endpoints-quickstart/master/openapi.yaml
```

Then I reviewed their scripts to see what the did. It seems, mostly, like they
just get your gcloud project id with `gcloud config get-value project`, then
make a temp file, and copy the `openapi.yaml` file to it.

The script also replaces YOUR-PROJECT-ID with your project ID. Then it runs
`gcloud endpoints services deploy <file name>` on the file.


Instead of doing that, I just downloaded the file, inserted my project myself
with vim, and manually deployed it.

```bash
gcloud endpoints services deploy openapi.yaml
gcloud endpoints services list
gcloud endpoints services describe <name>
```

## Deploy the API Backend

This is the part I'm actually interested in.

Download their app.yaml file
```
wget https://raw.githubusercontent.com/GoogleCloudPlatform/endpoints-quickstart/master/app/app_template.yaml
```

Edit the file and replace SERVICE\_NAME with your app name
`<project>.appspot.com`.

Also look through it to see what it's actually doing. It looks like it's
running some sort of docker service. Need to look into that more still...

```bash
# pick the montreal region
gcloud app regions list
region='northamerica-northeast1'

# create a gcloud app in the current gcloud project
gcloud app create --region=$region

# I got an error which I ignored, probably from an earlier test:
# The project <project> already contains an App Engine application.




