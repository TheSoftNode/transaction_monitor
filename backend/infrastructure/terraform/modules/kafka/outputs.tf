output "bootstrap_brokers" {
  description = "Kafka bootstrap brokers"
  value       = aws_msk_cluster.main.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  description = "Kafka bootstrap brokers TLS"
  value       = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "zookeeper_connect" {
  description = "Zookeeper connection string"
  value       = aws_msk_cluster.main.zookeeper_connect_string
}

output "cluster_arn" {
  description = "MSK cluster ARN"
  value       = aws_msk_cluster.main.arn
}
