terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "transaction-monitor-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Transaction Monitor"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  private_subnets     = var.private_subnets
  public_subnets      = var.public_subnets
  enable_nat_gateway  = true
  single_nat_gateway  = var.environment != "production"
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  environment        = var.environment
  cluster_name       = "${var.project_name}-${var.environment}"
  cluster_version    = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_groups        = var.eks_node_groups
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  identifier              = "${var.project_name}-${var.environment}"
  engine_version          = "15.4"
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.worker_security_group_id]
  database_name           = var.database_name
  master_username         = var.database_username
  multi_az                = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 7 : 1
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"

  environment             = var.environment
  cluster_id              = "${var.project_name}-${var.environment}"
  node_type               = var.redis_node_type
  num_cache_nodes         = var.redis_num_nodes
  engine_version          = "7.0"
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.worker_security_group_id]
}

# MSK (Managed Kafka)
module "kafka" {
  source = "./modules/kafka"

  environment        = var.environment
  cluster_name       = "${var.project_name}-${var.environment}"
  kafka_version      = "3.5.1"
  broker_node_count  = var.kafka_broker_count
  broker_instance_type = var.kafka_instance_type
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.worker_security_group_id]
}

# S3 for backups and logs
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-${var.environment}-backups"
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
