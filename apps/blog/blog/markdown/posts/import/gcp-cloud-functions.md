title: Google Cloud Functions: Basics
summary: Building a simple servless API on Google Cloud Platform's Cloud Functions
slug: gcp-cloud-functions
category: cloud
tags: gcp, api
date: 2019-10-11
modified: 2019-10-11
status: published
image: google-cloud-functions.png
thumbnail: google-cloud-functions-thumb.png


This post covers getting started with a very simple Google Cloud Functions API,
a great serverless solution with affordable pricing. This API will pull the
IP address from the HTTP request, and return `Hello <source IP>`.

---

[TOC]

---


# Pricing Details

Cloud Functions pricing is pretty affordable for most use cases, assuming you
write your functions in such a way that they don't get invoked a few too many
millions of times.

Check the official [Google docs](https://cloud.google.com/functions/pricing)
for accurate and up-to-date pricing, but here's what it looked like at the time
 of my writing this.

Pricing is broken into a few fees:

- *Invocations*: A flat fee per function execution. $0.0000004 per invocation,
  excluding the first 2 million.
- *Compute Time*: At the lowest clock speed (200MHz x 128MB RAM), compute costs
  $0.000000231/100ms, ceil 100.
- *Networking*: $0.12/GB egress for data, while ingress is free.


---


# Deploy Hello World Function

Open [Google Cloud Functions](https://console.cloud.google.com/functions/) in
your browser.

Create a function.
- Name: HelloWorld
- Memory Allocated: 128 MB
- Trigger: HTTP
- Authentication: Allow unauthenticated invocations
- Source code: Inline Editor
- Runtime: Python 3.7
- Other settings: Leave them as defaults

## main.py
The API function defined by `Function to execute` accepts a
[flask.Request](https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data)
argument.

```python
def hello_world(request):
    """" Return a Hello message to sender of the API call """
		return 'Hello {}!'.format(request.remote_addr)
```

## requirements.py

You can leave this blank. It's a list of libraries that will be used.


---


# Accessing the Function

## From the Console Web UI

1. Navigate to the [Functions page](https://console.cloud.google.com/functions).
1. Click on the 3 dots next to the function name, and choose "Test function".
1. Populate and JSON for the GET request in "Triggering event". The above
   example doesn't accept any input data so `{}` is all you need.
1. Click "Test the function"


## From the Request URL

1. Navigate to the [Functions page](https://console.cloud.google.com/functions).
1. Click the function's name to navigate to the "Function details" page
1. Go to the 'Trigger" tab
1. Find the URL. Copy it.

You can now test the URL with curl, your browser, httpie, python, etc.

```bash
https://<region>-<project>.cloudfunctions.net/HelloWorld
```

