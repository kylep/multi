title: Using AWS S3 from Python
summary: Saving and reading files from S3 using python and a dedicated IAM user.
slug: aws-s3-python
category: cloud
tags: AWS,python,S3
date: 2019-09-26
modified: 2019-09-26
status: published
image: aws-s3.png
thumbnail: aws-s3-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---


This post covers how to upload and download files from Amazon's S3 using
Python. Setup is done from the web UI.


# Create a Bucket

Go to the [AWS S3 page](https://s3.console.aws.amazon.com).

Click on "+ Create Bucket" and fill out the form. For access, choose
Block all public access. For the rest of the options, the defaults are fine.


---


# Create IAM Credentials


IAM stands for Identity and Access Management.


## Create a Policy

From the left nav-bar, go to policies. The default policies don't grant
programmatic access, so you need to make a new one.

For admin rights, I just used the visual policy builder and granted it
access to everything. I'll come back and update this guide with how to lock
that down later.


---


# Add the policy to a group

Go to the groups on the left. Either make a new one or edit an existing one.
Under Permissions, click Attach Policy. If you want, you can also add
`AmazonS3FullAccess` to see the difference between the two.


## Create/Edit a User

On the left nav-bar, go to Users > Add User. Or edit a user that exists.
Fill in the wizard and assign the group.


---


# Use Python to interact with S3

## Install Boto3

Python needs boto3 installed to interact with AWS.

```bash
pip install boto3
```


## Uploading and Downloading Files

```python
import boto3

# Fill in the key and key id, or read them from stdin/file/whatever
key_id = ''
key = ''

# Create the authenticated s3 client
session = boto3.Session(aws_access_key_id=key_id, aws_secret_access_key=key)
client = session.client('s3')

# Define the file/object
filename = '/example/file/path'
bucket_name = 'my_bucket'
key = 'my_key'

# Upload Example
client.upload_file(filename, bucket_name, key)

# Download Example
client.download_file(bucket_name, object_name, path)
```
