title: Project: FOSS Python App
summary: Building an Open Source python application and distribute it on PyPi.
slug: open-source-cli-project
tags: python,open source
category: development
date: 2019-08-24
modified: 2019-08-24
status: published
image: pypi.png
thumbnail: pypi-thumb.png


**Github Link:** [here](https://github.com/kylep/jsc2f)

---


Open source software is great, and Python is a super popular language for
writing an open source tool. In this project I create a greenfield project
called **JSC2F: Json SQL Cell to File** and distribute it freely and publicly
on PyPi. I'll also set up a Travis CI pipeline and some automated tests to get
a bit of CI/CD magic going.


---

# Project Posts & Progress

This project includes, or will include, the following posts.
If any aren't finished, check back later!

<table class="project-table">
  <tr>
    <th>Status</th>
    <th>Article</th>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Building a simple CLI app in Python</td>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>
      <a href="/python-pypi.html">
        Publishing a Python application to PyPi
      </a>
    </td>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Building a deployment pipeline with Travis CI</td>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Writing unit and functional tests for a Python CLI app</td>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Integrating tests with Tox</td>
  </tr>
</table>

---


# A simple Python Application

The purpose of this project was primarily to learn and deploy the tools needed
to build a full Free & Open Source application. I chose a Python CLI app
because I've made a few of those before.

For deployment, the app will go in [PyPi](https://pypi.org/).

The app itself solves a real-world problem. At work we have this one database
field that stores a huge JSON string. It was a JSON type cell in the old MySQL
database but since we moved to HA MariaDB and it doesn't support that, it's
just a string now. Anyways, the app, JSC2F, has two features:

1. Connect to the database and select the cell holding the JSON data. Export
   that data to a nicely formatted file for editing in your IDE of choice.
1. Upload a JSON file from your workstation into a SQL cell.

Its pretty trivial and there's certainly a million other ways to solve this
problem, but it was low hanging fruit.

Another objective of this project is to try out Travis CI, and have it run some
simple tests then handle my deployments.


---

# Building the App

So, I haven't actually broken down how I made the app into posts yet, but you
can find the app [here](https://github.com/kylep/jsc2f).


---


# Deploying the App to PyPi

Currently I'm deploying the app manually after testing the app by hand.

[Publishing a Python application to PyPi](/python-pypi.html)

Check back for updates as I automate this.
