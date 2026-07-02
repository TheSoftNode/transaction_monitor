# Terraform Infrastructure

## Overview

This directory contains Terraform configuration for deploying the Transaction Monitor infrastructure on AWS.

## Architecture

- **VPC**: Multi-AZ VPC with public and private subnets
- **EKS**: Managed Kubernetes cluster for application workloads
- **RDS**: PostgreSQL database with Multi-AZ deployment
- **ElastiCache**: Redis for caching and session management
- **MSK**: Managed Kafka for event streaming
- **S3**: Backup storage with versioning and encryption

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0
3. **S3 bucket** for Terraform state (create manually first)
4. **DynamoDB table** for state locking

### Create State Backend

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket transaction-monitor-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket transaction-monitor-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Create tfvars File

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan Infrastructure

```bash
terraform plan -var-file=terraform.tfvars
```

### 4. Apply Infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

### 5. Get Outputs

```bash
terraform output
```

## Modules

### VPC Module
Creates VPC with:
- Public subnets (for NAT gateways, load balancers)
- Private subnets (for application workloads)
- NAT gateways for outbound internet access
- Internet gateway for inbound access

### EKS Module
Creates EKS cluster with:
- Managed control plane
- Auto-scaling node groups
- IAM roles and policies
- Security groups

### RDS Module
Creates PostgreSQL database with:
- Multi-AZ deployment (production)
- Automated backups
- Enhanced monitoring
- Secrets Manager integration

### Redis Module
Creates ElastiCache cluster with:
- Redis 7.x
- Automatic failover
- Parameter group customization

### Kafka Module
Creates MSK cluster with:
- Kafka 3.5.x
- Multiple broker nodes
- Encryption at rest and in transit
- CloudWatch logging

## Environments

Create separate tfvars files for each environment:

- `terraform.tfvars.development`
- `terraform.tfvars.staging`
- `terraform.tfvars.production`

## Cost Optimization

### Development Environment
- Single NAT gateway
- Smaller instance types
- Single-AZ RDS
- Reduced backup retention

### Production Environment
- Multi-AZ everything
- Larger instance types
- Extended backup retention
- Enhanced monitoring

## Security

- All data encrypted at rest and in transit
- Security groups follow least privilege
- Secrets stored in AWS Secrets Manager
- S3 buckets have public access blocked
- KMS encryption for sensitive data

## Outputs

After applying, you'll get:
- EKS cluster endpoint and kubeconfig
- RDS endpoint and credentials (in Secrets Manager)
- Redis endpoint
- Kafka bootstrap servers

## Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name transaction-monitor-production
```

## Destroy Infrastructure

```bash
terraform destroy -var-file=terraform.tfvars
```

⚠️ **Warning**: This will delete all resources including databases. Ensure backups are taken first.

## Troubleshooting

### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### EKS Access Issues
```bash
# Verify IAM user/role
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --name <cluster-name>
```

### RDS Connection Issues
```bash
# Get credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id transaction-monitor-production-db-credentials
```
