title: CircleCI: Continuous Delivery for Firebase
summary: A very simple CD setup for a basic hosting Firebase app.
slug: firebase-circleci-cd
category: development
tags: Firebase
date: 2020-01-16
modified: 2020-01-16
status: published
image: google-firestore.png
thumbnail: google-firestore-thumb.png


[TOC]

---

# Create CI token

This will do the usual browser-based login system, so if you're using a VM then
be sure your lolcahost:9005 goes to the server's <ip>:9005.

```bash
firebase login:ci
```


# Add token as CircleCI env var

1. Log into CircleCI
1. Choose your GitHub project
1. Use the Hello World build template
1. Assign that token as `$FIREBASE_DEPLOY_TOKEN` in the project's environment
   variable settings.
    1. Navigate to your project in CircleCI
    1. Click the gear on the top-right to open this project's settings
    1. Open environment variables page
    1. Add Variable. Name: `FIREBASE_DEPLOY_TOKEN`, value is your token.
    1. Add another variable for `FIREBASE_PROJECT` and set it to your Firebase
				 project's name.


# Write .circleci/config.yml

I found [this guide](https://medium.com/static-void-academy/easy-peasy-ci-cd-w-circleci-282bc85ddcf5)
useful.

## Example File

```yaml
version: 2
jobs:
  build:
    docker:
      # Using latest can cause failures, but I hope it will help me keep up
      - image: circleci/node:latest
    steps:
      - checkout
      - run: npm install --prefix=./firebase-deploy firebase-tools
      - run: >
          ./firebase-deploy/node_modules/.bin/firebase deploy
          --project=$FIREBASE_PROJECT
          --token=$FIREBASE_DEPLOY_TOKEN
```

## Locally validating your config

You can use CircleCI's local-ci. Note that this was tested on a
[dev Ubuntu server](https://github.com/kylep/dev-vm).


**Install** - [official docs](https://circleci.com/docs/2.0/local-cli/#installation)

```bash
snap install docker circleci
snap connect circleci:docker docker
```

Test your configuration file. Navigate to your project directory first.


```bash
circleci config validate
# or
circleci config validate <config file path>
```

