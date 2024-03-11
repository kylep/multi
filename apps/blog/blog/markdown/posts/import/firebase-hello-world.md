title: Firebase Basics: Hello World
summary: Learning the basics of creating web app on Google Firebase
slug: firebase-basics
category: development
tags: Firebase
date: 2020-01-11
modified: 2020-01-11
status: published
image: google-firestore.png
thumbnail: google-firestore-thumb.png


# Create a Firebase Project

Open the [Firebase console](https://console.firebase.google.com/) and follow
the wizard. It's pretty straightforward. I bound my project to a Google Cloud
Platform project I was already using and used the Blaze plan.

The wizard is intuitive, I won't cover its steps here.

Navigate into your project and "Add Firebase to your web app". Once that's done
you can use the CLI to deploy the app.


---

# Install Firebase CLI

Installing Firebase CLI requires the `npm` command from NodeJS.
If you want to configure your dev environment in Ansible, check out my
[Installing Node.js with Ansible](http://localhost:8000/nodejs-ansible.html)
post.


```bash
# Add the key for the nodesource Apt repository
wget -qO https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -

# Add the nodesource apt repo
echo "deb https://deb.nodesource.com/node_13.x bionic main" > /etc/apt/sources.d/nodesource
apt-get update

# Install NodeJS to get the npm command
apt-get install -y nodejs

# Install firebase-tools
npm install firebase-tools
```


## Logging In

If your CLI and browser are on the same system, just run `firebase login` and
ignore the rest of this section.

I haven't found a way to log into Firebase CLI that doesn't need a web browser.
The limitation was inconvenient since I develop inside an Ubuntu server VM.

The options I figure would work are:

1. Using a local Vagrant VM, forward the port that the oauth site tries to
   redirect to on localhost. This was the easiest for my local dev environment,
   so it's what I did. You copy the URL from your CLI into your workstation's
   browser, then have it redirect `http://localhost:9005/` to your VM. Here's
   an example of how to forward the port in a Vagrantfile:
   `config.vm.network :forwarded_port, host: 9005, guest: 9005`
1. Install Chrome in Ubuntu server then launch it with
   [X11 Forwarding](/x11-forwarding-ubuntu.html)
1. Create a reverse SSH tunnel from a port on your laptop to the development
   server. [Here's a post where I've done SSH port forwarding](/dial-home-device.html)
1. Use the `firebase login:ci` command and the
   `--token` argument. This option was my fallback, but you still need to
   install `firebase-cli` on your actual workstation with a browser to use it.

Once successfully authenticated your browser will show a message saying
`Woohoo! Firebase CLI Login Successful`.

---


# Deploy Hello World

Make an index file in a directory for this app

```bash
mkdir app
cd app
mkdir public
echo "<h1>Hello World!</h1>" > public/index.html
```

## firebase init

Initialize the directory as an application. This will present you with an
intuitive wizard.

```bash
firebase init

# When prompted,
#  choose only Hosting
#  keep your index file
#  decide if you'll use a single page app
```

### Single-page app setting

Running `firebase init` generates a `firebase.json` file for your project.
In single-page mode, this file will rewrite all traffic to index.html. You can
edit the file to change this behaviour. The rewrite block in `"hosting":` looks
like this:

```json
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }],
```


## firebase deploy
Deploy the default app

```bash
firebase deploy
```

The deploy command will print a Hosting URL. The Hello World site can be loaded
from there.
