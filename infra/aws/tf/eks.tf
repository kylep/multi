resource "aws_eks_cluster" "kytrade2-EKS-Cluster" {
  name     = "kytrade2-EKS-Cluster"
  role_arn = aws_iam_role.kytrade2-EKS-Cluster-Role.arn
  vpc_config {
    subnet_ids = [
      aws_subnet.kytrade2-Subnet-Public-1.id,
      aws_subnet.kytrade2-Subnet-Public-2.id,
    ]
  }
  tags = {
    Name = "kytrade2-EKS-Cluster"
    app = "kytrade2"
  }
}


resource "aws_eks_node_group" "kytrade2-EKS-Node-Group" {
  cluster_name = aws_eks_cluster.kytrade2-EKS-Cluster.name
  node_group_name = "kytrade2-EKS-Node-Group"
  node_role_arn = aws_iam_role.kytrade2-EKS-Node-Role.arn
  instance_types = ["t3.small"]
  remote_access {
    ec2_ssh_key = "Kyle"
    source_security_group_ids = [aws_security_group.kytrade2-Security-Group.id]
  }
  capacity_type = "SPOT"
  subnet_ids = [
      aws_subnet.kytrade2-Subnet-Public-1.id,
      aws_subnet.kytrade2-Subnet-Public-2.id,
  ]
  scaling_config {
    desired_size = 1
    max_size     = 1
    min_size     = 1
  }
  tags = {
    Name = "kytrade2-EKS-Node-Group"
    app = "kytrade2"
  }
}
