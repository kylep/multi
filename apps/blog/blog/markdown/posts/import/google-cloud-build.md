title: Google Cloud Build: Basics
summary: An introduction to the Google Cloud Build, showing how its used for this site.
slug: google-cloud-build
tags: GCP,Docker,CI/CD
category: cloud
date: 2019-08-06
modified: 2019-12-05
status: published
image: google-cloud-build.png
thumbnail: google-cloud-build-thumb.png


**This post is linked to from the [Blog Website Project](/blog-website.html)**

**This post is linked to from the [GCP: Deep Dive Project](/gcp.html)**

---


[TOC]


---

[Google Cloud-Build](https://console.cloud.google.com/cloud-build)
offers a docker based mechanism for continuous delivery within Google's
cloud. In this post I'll show how Cloud Build can automatically deploy changes
to a Docker image and a static web page as soon as the changes are committed to
source control.



# Pricing

Current pricing data can be found [here](https://cloud.google.com/cloud-build/pricing).

- For the first 120 builds in a day, cloud build is **free**.
- each build after the free quota costs $0.003 US / build-minute when using the
  single core build server with no additional SSD storage


# Write the Cloud Build file

Google Cloud Build uses a file, `cloudbuild.yml`, to define the tasks that will
be executed when a build is triggered.

The online references for the syntax are pretty good:

- [Google's Cloud-Build Documentation](https://cloud.google.com/cloud-build/docs/build-config)
- [Variables Available in cloudbuild.yaml](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values)

Below are some example configuration files used for this site.

# IAM Roles

[Official Documentation](https://cloud.google.com/cloud-build/docs/securing-builds/configure-access-control)

- Cloud Build Editor
- Cloud Build Viewer

## Docker Image to Cloud Registry

Cloud Build is great for keeping your Docker Registry images aligned with your
version control code.

In this example I use Cloud Build to build and push a [pelican image](/docker-pelican-image)
to the [Google Container Registry](/google-container-registry).

Be sure to keep the Dockerfile code in version control. Aside from being a good
idea in general, Cloud Build can also use Git commits as a build trigger.
[Here's my Pelican Docker image repository](https://github.com/kylep/pelican).

```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [ 'build', '-t', 'gcr.io/$PROJECT_ID/pelican', '.' ]
images:
- 'gcr.io/$PROJECT_ID/pelican'
```


## Static Website to Google Cloud Storage

Another use for Cloud Builder is to generate static website files and then sync
them up with Cloud Storage every time the source control files or template are
changed.

Here's an example that triggers when I commit code to my
[blog content git repository](https://github.com/kylep/kyle.pericak.com). It
copies the content into `/workspace` and uses the above pelican image to render
the content and output it to the `output/` directory.

Once the site content is generated, the next step uses the `gcloud` image's
`gsutil -m rsync` command to upload the files to the Google Storage Bucket.


---

# Define Cloud Build Triggers

Here's the procedure I used to link a Cloud Build trigger to my Pelican image.

1. Go to [Google Cloud-Build](https://console.cloud.google.com/cloud-build).
1. On the left side-bar, navigate to Triggers
1. Add Trigger
1. Select source: GitHub
1. Authenticate: Log in if needed
1. Select Repository: This is the repo that will be watched for changes
1. Name: This is the name of the trigger
1. Description: Something like `Push to master branch`
1. Trigger Type: `Branch`
1. Branch: `master`
1. Build Configuration: `cloudbuild.yaml`
1. **Create Trigger**

With this trigger in place, all pushes to the pelican project will trigger the
rebuilding of its image, followed by updating the image in GCR with the latest
changes.
