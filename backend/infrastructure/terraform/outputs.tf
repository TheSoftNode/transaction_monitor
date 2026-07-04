# AKS Outputs
output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "aks_kube_config" {
  description = "Kubernetes config"
  value       = module.aks.kube_config
  sensitive   = true
}

# PostgreSQL Outputs
output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = module.postgresql.server_fqdn
}

# Redis Outputs
output "redis_hostname" {
  description = "Redis hostname"
  value       = module.redis.hostname
}

output "redis_primary_key" {
  description = "Redis primary key"
  value       = module.redis.primary_access_key
  sensitive   = true
}

# Event Hubs Outputs
output "eventhub_namespace" {
  description = "Event Hubs namespace"
  value       = module.eventhub.namespace_name
}

output "eventhub_connection_string" {
  description = "Event Hubs connection string"
  value       = module.eventhub.primary_connection_string
  sensitive   = true
}

# ACR Outputs
output "acr_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

# Key Vault Outputs
output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# Resource Group Output
output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}
