variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "MSK cluster name"
  type        = string
}

variable "kafka_version" {
  description = "Kafka version"
  type        = string
}

variable "broker_node_count" {
  description = "Number of broker nodes"
  type        = number
}

variable "broker_instance_type" {
  description = "Broker instance type"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access Kafka"
  type        = list(string)
}
