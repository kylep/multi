# AWS network configuration

resource "aws_vpc" "vpc" {
  cidr_block = var.vpc_cidr
  enable_dns_support = "true"
  enable_dns_hostnames = "true"
  # enable_classiclink = "false"  # deprecated
  instance_tenancy = "default"
  tags = {
    Name = "${var.env}_vpc"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id = aws_vpc.vpc.id
  cidr_block = var.public_cidrs[0]
  map_public_ip_on_launch = "true"
  availability_zone = var.availability_zones[0]
  tags = {
    Name = "${var.env}_public_subnet_1"
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/cluster" = "owned"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id = aws_vpc.vpc.id
  cidr_block = var.public_cidrs[1]
  map_public_ip_on_launch = "true"
  availability_zone = var.availability_zones[1]
  tags = {
    Name = "${var.env}_public_subnet_2"
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/cluster" = "owned"
  }
}

resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.vpc.id
  tags = {
    Name = "${var.env}_internet_gateway"
  }
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.internet_gateway.id
  }
  tags = {
    Name = "${var.env}_route_table"
  }
}

resource "aws_route_table_association" "route_table_association_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.route_table.id
}

resource "aws_route_table_association" "route_table_association_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.route_table.id
}

resource "aws_security_group" "security_group" {
  name        = "${var.env}_security_group"
  description = "Network access policy for ${var.env}"
  vpc_id      = aws_vpc.vpc.id
  ingress {
    description      = "shrug"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  tags = {
    Name = "${var.env}_security_group"
  }
}
