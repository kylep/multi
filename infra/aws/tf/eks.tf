resource "aws_eks_cluster" "cluster"  {
  name = "${var.env}_cluster"
  role_arn = aws_iam_role.cluster_role.arn
  vpc_config {
    subnet_ids = [
      aws_subnet.public_subnet_1.id,
      aws_subnet.public_subnet_2.id,
    ]
  }
  tags = {
    Name = "${var.env}_cluster"
  }
}


resource "aws_eks_node_group" "node_group" {
  cluster_name = aws_eks_cluster.cluster.name
  node_group_name = "${var.env}_node_group"
  node_role_arn = aws_iam_role.node_role.arn
  instance_types = var.instance_types
  remote_access {
    ec2_ssh_key = var.ec2_ssh_key
    source_security_group_ids = [aws_security_group.security_group.id]
  }
  capacity_type = "SPOT"
  subnet_ids = [
      aws_subnet.public_subnet_1.id,
      aws_subnet.public_subnet_2.id,
  ]
  scaling_config {
    desired_size = 1
    max_size     = 1
    min_size     = 1
  }
  tags = {
    Name = "${var.env}_node_group"
  }
}


# EBS Addon



resource "aws_eks_addon" "aws_ebs_csi_driver" {
  cluster_name      = aws_eks_cluster.cluster.name
  addon_name        = "aws-ebs-csi-driver"
  # addon_version     = "latest"  # I don't really care
  service_account_role_arn = aws_iam_role.eks_csi_driver.arn
}
