title: AWS ECR - Elastic Container Registry: Basics
summary: Creating and operating a Docker registry on AWS with custom users
slug: aws-ecr
category: cloud
tags: AWS, Docker
date: 2019-08-26
modified: 2019-09-19
status: published
image: aws-ecr.png
thumbnail: aws-ecr-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---


This post covers how to make a Docker registry on AWS Elastic Container
Registry (ECR).
To secure the registry, least-privilege roles are created and assigned to
service account users in the AWS AIM tool

---

[TOC]

---

# Create an AWS ECR Repository

Navigate to the
[AWS ECR Repositories page](https://ca-central-1.console.aws.amazon.com/ecr/repositories)
and click Create a repository.

Fill in the form to name your repository.

# Create an AWS IAM User For the Registry

Its a good idea to have user accounts with write access, and others with
read-only access. This way you can push to the registry with your privileged
user but you never need to expose those credentials outside your development
or CI/CD environment.


## Create Groups for ECR Access

First, review the AWS Group access levels [here](https://docs.aws.amazon.com/AmazonECR/latest/userguide/ecr_managed_policies.html).

### Make a group with write access

Users in this group can push to existing registries but they can't use the CLI
to make new ones.

1. Go to the [AWS IAM page](https://console.aws.amazon.com/iam)
2. Click Groups on the sidebar
3. Name the group, ex: `ecr-write`
4. Attach Policy: `AmazonEC2ContainerRegistryPowerUser`, next
5. Create Group


### Make a read-only group

Its the same procedure as above, but use the read-only policy instead:
`AmazonEC2ContainerRegistryReadOnly`.

Consider also making an admin group with the
`AmazonEC2ContainerRegistryFullAccess` permission.


## Create Users for ECR Access

Make two users, one for pushing and one for pulling. You can share the user
will read access to anyone who needs to consume the images.

To make a user:

1. Go to the [AWS IAM page](https://console.aws.amazon.com/iam)
2. Click Users on the sidebar
3. Add User
4. Enter user name, check Programmatic Access, next
5. Choose from the groups you just created to grant read/write access, next
6. Skip the tags, next
7. Create User. Be sure to save the secret access key in your password manager.



# Connect Docker to the new  Registry

## Install the AWS CLI
The one from apt is really old and doesn't work. Use pip.
```bash
apt-get install -y python python-pip
pip install aws awscli
```

Test it out
```bash
python -m awscli help
```

## Configure the AWS CLI USER
When prompted, enter your key, secret key, region (ca-central-1), and output
format (none):
```bash
aws configure
```

## Get the docker login command
Use the AWS CLI to fetch and execute the docker login command. You can also
export this command to a file to run it, but there's no point since the token
gets invalidated after 12 hours.

```bash
$(aws ecr get-login --no-include-email --region ca-central-1)
```


---


# Push Images to the ECR Registry
If you click on the Push Commands button in the ECR registry page you'll get
examples programmatically generated for your registry.

Pushing is kind of unintuitive. Unlike a normal `registry:2` docker registry,
ECR won't automatically create your repositories for you. You have to manually
create each one. You can use the web UI, or log in as an admin user and run the
following:

```bash
aws ecr create-repository --repository-name kolla/ubuntu-source-base
```

For scripting, this is a handy way of creating the repo if it doesn't exist:

```bash
aws ecr describe-repositories --repository-names $repo_name \
  || aws ecr create-repository --repository-name $repo_name
```

Then you can push.

```bash
docker push $myId.dkr.ecr.ca-central-1.amazonaws.com/$repo:$tag
```

If you first create the repository, you get an error like this: `name unknown:
The repository with name 'kolla/ubuntu-source-base' does not exist in the
registry with id '...'`
