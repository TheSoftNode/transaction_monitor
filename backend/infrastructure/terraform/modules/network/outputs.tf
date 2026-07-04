output "vnet_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Virtual network name"
  value       = azurerm_virtual_network.main.name
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

output "db_subnet_id" {
  description = "Database subnet ID"
  value       = azurerm_subnet.db.id
}

output "redis_subnet_id" {
  description = "Redis subnet ID"
  value       = azurerm_subnet.redis.id
}

output "eventhub_subnet_id" {
  description = "Event Hub subnet ID"
  value       = azurerm_subnet.eventhub.id
}
