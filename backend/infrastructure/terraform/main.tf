terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "transaction-monitor-tfstate"
    storage_account_name = "txmonitorterraformstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.azure_region

  tags = {
    Project     = "Transaction Monitor"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Virtual Network
module "network" {
  source = "./modules/network"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  vnet_address_space  = var.vnet_address_space
  subnet_prefixes     = var.subnet_prefixes
}

# AKS Cluster
module "aks" {
  source = "./modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  cluster_name        = "${var.project_name}-${var.environment}-aks"
  kubernetes_version  = var.kubernetes_version
  subnet_id           = module.network.aks_subnet_id
  node_pools          = var.aks_node_pools
  enable_auto_scaling = true
}

# Azure Database for PostgreSQL
module "postgresql" {
  source = "./modules/postgresql"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  server_name         = "${var.project_name}-${var.environment}-psql"
  postgresql_version  = "15"
  sku_name            = var.postgresql_sku
  storage_mb          = var.postgresql_storage_mb
  subnet_id           = module.network.db_subnet_id
  database_name       = var.database_name
  admin_username      = var.database_username
  backup_retention_days = var.environment == "production" ? 7 : 1
  geo_redundant_backup  = var.environment == "production" ? "Enabled" : "Disabled"
}

# Azure Cache for Redis
module "redis" {
  source = "./modules/redis"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  redis_name          = "${var.project_name}-${var.environment}-redis"
  sku_name            = var.redis_sku
  family              = var.redis_family
  capacity            = var.redis_capacity
  subnet_id           = module.network.redis_subnet_id
  enable_non_ssl_port = false
}

# Azure Event Hubs (Kafka-compatible)
module "eventhub" {
  source = "./modules/eventhub"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  namespace_name      = "${var.project_name}-${var.environment}-evhub"
  sku                 = var.eventhub_sku
  capacity            = var.eventhub_capacity
  subnet_id           = module.network.eventhub_subnet_id
  event_hubs = {
    transactions = {
      partition_count   = 4
      message_retention = var.environment == "production" ? 7 : 1
    }
  }
}

# Storage Account for backups and logs
resource "azurerm_storage_account" "backups" {
  name                     = "${lower(replace(var.project_name, "-", ""))}${var.environment}backup"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 30
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.backups.name
  container_access_type = "private"
}

# Key Vault for secrets
resource "azurerm_key_vault" "main" {
  name                = "${var.project_name}-${var.environment}-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  enable_rbac_authorization = true
  purge_protection_enabled  = var.environment == "production"
  soft_delete_retention_days = 7

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
    ip_rules       = var.allowed_ips
  }

  tags = {
    Environment = var.environment
  }
}

# Application Insights for monitoring
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"
  retention_in_days   = var.environment == "production" ? 90 : 30

  tags = {
    Environment = var.environment
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "production" ? 90 : 30

  tags = {
    Environment = var.environment
  }
}

# Container Registry for Docker images
resource "azurerm_container_registry" "main" {
  name                = "${lower(replace(var.project_name, "-", ""))}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.environment == "production" ? "Premium" : "Basic"
  admin_enabled       = false

  network_rule_set {
    default_action = "Deny"
    ip_rule {
      action   = "Allow"
      ip_range = var.allowed_ips[0]
    }
  }

  tags = {
    Environment = var.environment
  }
}

# Role assignment for AKS to pull from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = module.aks.kubelet_identity_object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

# Current client config
data "azurerm_client_config" "current" {}
