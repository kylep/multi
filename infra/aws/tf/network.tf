# AWS network configuration for kytrade2

resource "aws_vpc" "kytrade2-VPC-Public" {
  cidr_block = "10.20.0.0/16"
  enable_dns_support = "true"
  enable_dns_hostnames = "true"
  # enable_classiclink = "false"  # deprecated
  instance_tenancy = "default"
  tags = {
    Name = "kytrade2-VPC-Public"
    app = "kytrade2"
  }
}

resource "aws_subnet" "kytrade2-Subnet-Public-1" {
  vpc_id = aws_vpc.kytrade2-VPC-Public.id
  cidr_block = "10.20.0.0/24"
  map_public_ip_on_launch = "true"
  availability_zone = "ca-central-1a"
  tags = {
    Name = "kytrade2-Subnet-Public-1"
    app = "kytrade2"
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/kytrade2-EKS-Cluster" = "owned"
  }
}

resource "aws_subnet" "kytrade2-Subnet-Public-2" {
  vpc_id = aws_vpc.kytrade2-VPC-Public.id
  cidr_block = "10.20.1.0/24"
  map_public_ip_on_launch = "true"
  availability_zone = "ca-central-1b"
  tags = {
    Name = "kytrade2-Subnet-Public-2"
    app = "kytrade2"
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/kytrade2-EKS-Cluster" = "owned"
  }
}

resource "aws_internet_gateway" "kytrade2-Internet-Gateway" {
  vpc_id = aws_vpc.kytrade2-VPC-Public.id
  tags = {
    app = "kytrade2"
    Name = "kytrade2-Internet-Gateway"
  }
}

resource "aws_route_table" "kytrade2-Route-Table" {
  vpc_id = aws_vpc.kytrade2-VPC-Public.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.kytrade2-Internet-Gateway.id
  }
  tags = {
    app = "kytrade2"
    Name = "kytrade2-Route-Table"
  }
}

resource "aws_route_table_association" "kytrade2-Route-Table-Association-1" {
  subnet_id      = aws_subnet.kytrade2-Subnet-Public-1.id
  route_table_id = aws_route_table.kytrade2-Route-Table.id
}

resource "aws_route_table_association" "kytrade2-Route-Table-Association-2" {
  subnet_id      = aws_subnet.kytrade2-Subnet-Public-2.id
  route_table_id = aws_route_table.kytrade2-Route-Table.id
}

resource "aws_security_group" "kytrade2-Security-Group" {
  name        = "kytrade2-Security-Group"
  description = "Network access policy for kytrade2-VPC-Public"
  vpc_id      = aws_vpc.kytrade2-VPC-Public.id
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
    app = "kytrade2"
    Name = "kytrade2-Security-Group"
  }
}
