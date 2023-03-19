resource "aws_iam_role" "cluster_role" {
  name = "${var.env}_cluster_role"
  path = "/"
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
  ]
  assume_role_policy = jsonencode(
    {
      Statement = [
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            Service = "eks.amazonaws.com"
          }
        },
      ]
      Version = "2012-10-17"
    }
  )
  tags = {
    Name = "${var.env}_cluster_role"
  }
}

resource "aws_iam_role" "node_role" {
  name = "${var.env}_node_role"
  path = "/"
  description = "Role for EKS Nodes"
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
  ]
  assume_role_policy = jsonencode(
    {
      Statement = [
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            Service = "ec2.amazonaws.com"
          }
        },
      ]
      Version = "2012-10-17"
    }
  )
  tags = {
    Name = "${var.env}_node_role"
  }
}

resource "aws_iam_policy" "alb_policy" {
  name = "${var.env}_alb_policy"
  path = "/"
  description = "Policy allowing ALB ingress and NLB services on EKS"
  policy = file("${path.module}/eks-alb-nlb-controller-policy.json")
  tags = {
    Name = "${var.env}_alb_policy"
  }
}

resource "aws_iam_role_policy_attachment" "alb_policy_attachment" {
  role = aws_iam_role.node_role.name
  policy_arn = aws_iam_policy.alb_policy.arn
}


# NOTE: I don't think this one's actually doing anything / required
resource "aws_eks_identity_provider_config" "identity_provider_config" {
  cluster_name = aws_eks_cluster.cluster.name
  oidc {
    client_id                     = "sts.amazonaws.com"
    identity_provider_config_name = var.env
    issuer_url                    = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
  }
  tags = {
    Name = "${var.env}_identity_provider_config"
  }
}

# Getthing the thumbprint is a nuisance, we need to get it from the region's certificate using
# a bash script thumbprint.sh

data "aws_region" "current" {}

data "external" "thumbprint" {
  program = ["./thumbprint.sh", data.aws_region.current.name]
}

resource "aws_iam_openid_connect_provider" "openid_connect_provider" {
  url = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [data.external.thumbprint.result.thumbprint]
}
