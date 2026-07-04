variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "transaction-monitor"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "azure_region" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "allowed_ips" {
  description = "List of allowed IP addresses for secure access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Update with your actual IP ranges
}

# Network Configuration
variable "vnet_address_space" {
  description = "Address space for Virtual Network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_prefixes" {
  description = "Subnet address prefixes"
  type = object({
    aks_subnet      = string
    db_subnet       = string
    redis_subnet    = string
    eventhub_subnet = string
  })
  default = {
    aks_subnet      = "10.0.1.0/24"
    db_subnet       = "10.0.2.0/24"
    redis_subnet    = "10.0.3.0/24"
    eventhub_subnet = "10.0.4.0/24"
  }
}

# AKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28"
}

variable "aks_node_pools" {
  description = "AKS node pool configurations"
  type = map(object({
    vm_size             = string
    node_count          = number
    min_count           = number
    max_count           = number
    enable_auto_scaling = bool
    availability_zones  = list(string)
  }))
  default = {
    system = {
      vm_size             = "Standard_D2s_v3"
      node_count          = 2
      min_count           = 2
      max_count           = 5
      enable_auto_scaling = true
      availability_zones  = ["1", "2", "3"]
    }
    user = {
      vm_size             = "Standard_D4s_v3"
      node_count          = 3
      min_count           = 2
      max_count           = 10
      enable_auto_scaling = true
      availability_zones  = ["1", "2", "3"]
    }
  }
}

# PostgreSQL Configuration
variable "postgresql_sku" {
  description = "SKU for Azure PostgreSQL"
  type        = string
  default     = "GP_Standard_D2s_v3" # General Purpose, 2 vCores
}

variable "postgresql_storage_mb" {
  description = "Storage size for PostgreSQL in MB"
  type        = number
  default     = 32768 # 32GB
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "transaction_monitor"
}

variable "database_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "pgadmin"
  sensitive   = true
}

# Redis Configuration
variable "redis_sku" {
  description = "Redis SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "redis_family" {
  description = "Redis family (C = Basic/Standard, P = Premium)"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis cache size (0-6 for Standard)"
  type        = number
  default     = 1 # 1GB
}

# Event Hubs Configuration (Kafka-compatible)
variable "eventhub_sku" {
  description = "Event Hubs SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "eventhub_capacity" {
  description = "Event Hubs throughput units"
  type        = number
  default     = 2
}

# Tags
variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
