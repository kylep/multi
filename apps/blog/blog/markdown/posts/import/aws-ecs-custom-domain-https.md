title: HTTPS on Custom Domain with AWS ECS Fargate and LetsEncrypt
summary: Creating a docker container on Fargate with valid HTTPS on your domain
slug: aws-ecs-custom-domain-https
category: aws
tags: aws, docker, ecs, letsencrypt
date: 2019-09-11
modified: 2019-09-11
status: draft

# For real, this isn't done


AWS ECS (Fargate) allows you to easily run Docker containers on their public
cloud, but they make it difficult to point your own domain name at the service.
This is made even more complicated if you want to use HTTPS on that domain.

This guide shows how to use LetsEncrypt with ECS to get and host a valid HTTPS
service on your own domain name.

This approach doesn't work for scale-out services where more than one container
would be needed. In that scenario you need to get your cert into the container
some other way.


# Create a Subnet (VPC)
Go to the [VPC page](https://ca-central-1.console.aws.amazon.com/vpc/) for your
region.

Click **Create VPC** and fill out the form.


# Define the Docker Image & Start Script

Write a docker file that installs NGINX and sets the `server_name` value of the
NGINX site to match your HTTPS FQDN.

Have the dockerfile run a startup script as its CMD, and have the startup
script use the certbox-nginx software to enable the certificate.

The appeal of doing things this way is that when the cert expires, you just
relaunch the container. Fargate can actually handle that with its built-in
health checks.


---


# Build and Upload the Image to ECR


Locally build your image and upload it to ECR. It can be pulled from there to
the ECS cluster service.

---


# Build an AWS Application Load Balancer (ALB) and ECS Cluster

You need these to put your ECS service inside.


## Point your FQDN at the ALB FQDN as a CNAME

AWS doesn't let you use your own domain name normally, so point it at the FQDN
provided by the ALB using a CNAME.


---


# Create the Service

Be sure to choose the existing load balancer.
