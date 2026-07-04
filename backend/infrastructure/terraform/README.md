# Terraform Infrastructure for Azure

Complete infrastructure as code for deploying Transaction Monitoring Platform on Microsoft Azure.

## What Gets Deployed

- **AKS** (Azure Kubernetes Service) - Managed Kubernetes with auto-scaling
- **PostgreSQL** - Azure Database for PostgreSQL Flexible Server
- **Redis** - Azure Cache for Redis
- **Event Hubs** - Kafka-compatible event streaming
- **Container Registry** - Private Docker image registry (ACR)
- **Key Vault** - Secrets management
- **Storage Account** - Backups and logs
- **Application Insights** - Monitoring
- **Virtual Network** - Secure networking

## Quick Start

### 1. Prerequisites

```bash
# Install Azure CLI
brew install azure-cli

# Install Terraform
brew install terraform

# Login to Azure
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 2. Create State Storage

```bash
az group create --name transaction-monitor-tfstate --location "East US"

az storage account create \
  --name txmonitorterraformstate \
  --resource-group transaction-monitor-tfstate \
  --location "East US" \
  --sku Standard_LRS

az storage container create \
  --name tfstate \
  --account-name txmonitorterraformstate
```

### 3. Configure

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 4. Deploy

```bash
terraform init
terraform plan
terraform apply
```

Takes ~15-20 minutes.

### 5. Connect to AKS

```bash
az aks get-credentials \
  --resource-group transaction-monitor-production-rg \
  --name transaction-monitor-production-aks

kubectl get nodes
```

## Configuration

Key variables in `terraform.tfvars`:

```hcl
azure_region = "East US"
allowed_ips  = ["YOUR_IP/32"]  # Update this!

# Sizing
aks_node_pools = {
  system = {
    vm_size    = "Standard_D2s_v3"
    node_count = 2
  }
}

postgresql_sku = "GP_Standard_D2s_v3"
redis_sku      = "Standard"
```

## Outputs

After deployment:

```bash
terraform output aks_cluster_name
terraform output postgresql_fqdn
terraform output redis_hostname
terraform output acr_login_server
```

## Scaling

### Scale AKS Nodes

```hcl
# terraform.tfvars
aks_node_pools = {
  user = {
    node_count = 5  # Increase
    max_count  = 15
  }
}
```

Then: `terraform apply`

### Scale Database

```hcl
postgresql_sku = "GP_Standard_D4s_v3"  # 4 vCores
```

## Costs

**Production** (current config): ~$800-1200/month

**Dev** (smaller VMs, single zones): ~$300-500/month

## Security

- All resources in private subnets
- NSG rules restrict access
- Key Vault for secrets
- RBAC enabled on AKS
- Network policies enforced

## Cleanup

```bash
terraform destroy
```

## Modules

- `network/` - VNet, subnets, NSGs
- `aks/` - Kubernetes cluster
- `postgresql/` - Database
- `redis/` - Cache
- `eventhub/` - Event streaming

Note: Module implementations are complete in terraform/modules/ directory.

## Next Steps

After infrastructure is ready:

1. Deploy Kubernetes manifests (see `../k8s/README.md`)
2. Configure DNS records
3. Set up monitoring alerts
4. Configure backups

## Support

- Terraform docs: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- Azure docs: https://docs.microsoft.com/en-us/azure/
