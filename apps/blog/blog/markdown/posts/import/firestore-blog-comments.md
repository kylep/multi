title: Google Firebase: Building a blog comments app
summary: Using Google Firestore to build a dynamic comment app for a static site.
slug: firestore-blog-comments
category: development
tags: GCP, Firestore
date: 2019-12-08
modified: 2019-12-08
status: draft
image: google-firestore.png
thumbnail: google-firestore-thumb.png


This post covers how the comments on this blog work. This site itself is setup
as a static website ([see how](/blog-website.html), but comments are inherently
dynamic content. To solve this problem, a second app is created that will
provide comment support and it will be lazy-loaded by user interaction within
the static templates.


**Note:** This was my first time using Firebase. I'm interested in hearing
any insights as to how this might have been done better.

---

# Pricing

See: [Official pricing page](https://firebase.google.com/pricing)

There are a lot of moving parts to Firebase pricing, but I expect this app
to have the following costs:

...TODO


---


# Install the Firebase CLI

I do my development in a source-controlled VM so that my environment. It didn't
have NPM before starting this, which the Firebase CLI is built on.

Here's an Ansible task file that installs the Firebase CLI on Ubuntu. You can
see my latest code on GitHub.

TODO

---


# Application Setup

## Create a Firebase Project

Navigate to [console.firebase.google.com](https://console.firebase.google.com/)
and click `Create a project`. Personally, I bound the project to a GCP project
which I had created for this app before choosing to use Firebase.


## Write Firebase config files

### .firebaserc

This file stores your project aliases. An alias is 

### firebase.json

This file lists your project configuration.

---



# References

- [This Firebase video was really helpful, very similar](https://www.youtube.com/watch?v=XdrdLv1y9xk)

