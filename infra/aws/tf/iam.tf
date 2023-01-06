resource "aws_iam_role" "kytrade2-EKS-Cluster-Role" {
  name = "kytrade2-EKS-Cluster-Role"
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
    Name = "kytrade2-EKS-Cluster-Role"
    app = "kytrade2"
  }
}

resource "aws_iam_role" "kytrade2-EKS-Node-Role" {
  name = "kytrade2-EKS-Node-Role"
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
    Name = "kytrade2-EKS-Node-Role"
    app = "kytrade2"
  }
}

resource "aws_iam_policy" "kytrade2-EKS-ALB-Controller-Policy" {
  name = "kytrade2-EKS-ALB-Controller-Policy"
  path = "/"
  description = "Policy allowing ALB ingress and NLB services on EKS"
  policy = file("${path.module}/eks-alb-nlb-controller-policy.json")
  tags = {
    Name = "kytrade2-EKS-ALB-Controller-Policy"
    app = "kytrade2"
  }
}

resource "aws_iam_role_policy_attachment" "kytrade2-EKS-Node-Role-ALB-Policy-Attachment" {
  role = aws_iam_role.kytrade2-EKS-Node-Role.name
  policy_arn = aws_iam_policy.kytrade2-EKS-ALB-Controller-Policy.arn
}

resource "aws_eks_identity_provider_config" "kytrade2-EKS-OIDC" {
  cluster_name = aws_eks_cluster.kytrade2-EKS-Cluster.name
  oidc {
    client_id                     = "sts.amazonaws.com"
    identity_provider_config_name = "kytrade2-EKS-OIDC"
    issuer_url                    = aws_eks_cluster.kytrade2-EKS-Cluster.identity[0].oidc[0].issuer
  }
  tags = {
    Name = "kytrade2-EKS-OIDC"
    app = "kytrade2"
  }
}
