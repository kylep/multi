# Used as part of pretty much everything's name
variable "env" {
  type = string
  default = "staging"
}

# These tags get assigned to everything
variable "default_tags" {
  type = map
  default = {
    Environment: "staging",
    "tf_managed": "true"
  }
}

# Name of the EC2 SSH key to use
variable "ec2_ssh_key" {
  type = string
  default = "Kyle"
}

# How big to make the worker nodes
variable "instance_types" {
  type = list(string)
  default = ["t3.small"]
}

# region for the AWS provider
variable "aws_region" {
  type = string
  default = "ca-central-1"
}

# subnet used for the vpc
variable vpc_cidr {
  type = string
  default = "10.20.0.0/16"
}

# public_cidrs must be inside vpc_cidr
variable public_cidrs {
  type = list(string)
  default = ["10.20.0.0/24", "10.20.1.0/24"]
}

# AZs overrides
variable availability_zones {
  type = list(string)
  default = ["ca-central-1a", "ca-central-1b"]
}
