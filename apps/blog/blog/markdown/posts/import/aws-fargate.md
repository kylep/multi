title: AWS Fargate: Basics
summary: How to run a docker container on AWS Fargate from the web console
slug: aws-fargate
category: cloud
tags: AWS, Docker
date: 2019-09-10
modified: 2019-09-10
status: published
image: aws-fargate.png
thumbnail: aws-fargate-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---

How to run a docker container on AWS ECS (Elastic Compute Cloud)  using the AWS 
web console. A container from the Elastic Container Registry will be launched.
It will run on Amazon's [Fargate Container-as-a-Service](https://aws.amazon.com/fargate/).

---

[TOC]

---


# Launch a container on Fargate

1. Upload an image to AWS ECR. [See my guide on using AWS ECR](/aws-ecr.html).
1. Open [AWS ECS](https://ca-central-1.console.aws.amazon.com/ecs/)
1. Under Container Definition, select Configure
1. Fill in the form
    1. For the image URL, use the URL of the image uploaded to
       ECR. I was testing a reverse proxy image, so it looked like this:
       `000000000000.dkr.ecr.ca-central-1.amazonaws.com/test/revproxy:latest`
    1. I have my nginx reverse proxy a 256MB soft limit for RAM
    1. For my reverse proxy I made port mappings for port 80 and 443
    1. No need to fill out any of the advanced fields
1. Fill out the Task Definition section, click Next
1. Define your service
    1. Without a load-balancer, the only way to access your container will be by
       using [PrivateLink](https://aws.amazon.com/blogs/compute/access-private-applications-on-aws-fargate-using-amazon-api-gateway-privatelink/).
    1. During the initial cluster create wizard you can choose an Application
       Load Balancer. That seems to work well.
1. Name the Fargate cluster, next
1. Click create

It will take a little while. Once its finished you can click on View Service.


---


# Publish container's network to the internet

Navigate to the newly created service and go to the Details tab. From there you
can see a Load Balancing section. It should have a link to the new load
balancer.

You can also access this page from the left nav-bar by going to Load Balancing,
then choosing the new load balancer.

In the Description tab here, you can find the DNS name that AWS has assigned
to this load balancer. Unfortunately you can't depend on the IP address behind
this FQDN to stay the same.


---


# Using a custom domain name
I'm working on that. Its not intuitive. If you know how, I'd like to hear about
it..
