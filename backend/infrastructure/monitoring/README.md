# Monitoring Setup

## Overview

This directory contains monitoring configuration using Prometheus and Grafana for the Transaction Monitor platform.

## Components

### Prometheus
- **Version**: 2.48.0
- **Purpose**: Metrics collection and alerting
- **Retention**: 15 days
- **Storage**: 50Gi PVC

### Grafana
- **Version**: 10.2.2
- **Purpose**: Metrics visualization and dashboards
- **Storage**: 10Gi PVC

## Deployment

### 1. Deploy Prometheus

```bash
# Apply Prometheus configuration
kubectl apply -f prometheus/deployment.yaml

# Verify deployment
kubectl get pods -n transaction-monitor -l app=prometheus
kubectl logs -f deployment/prometheus -n transaction-monitor
```

### 2. Deploy Grafana

```bash
# Create dashboard ConfigMap
kubectl create configmap grafana-dashboards \
  --from-file=grafana/dashboards/ \
  -n transaction-monitor

# Apply Grafana deployment
kubectl apply -f grafana/deployment.yaml

# Verify deployment
kubectl get pods -n transaction-monitor -l app=grafana
```

### 3. Access Grafana

```bash
# Port forward for local access
kubectl port-forward svc/grafana 3000:3000 -n transaction-monitor

# Open browser
open http://localhost:3000
```

**Default credentials:**
- Username: `admin`
- Password: `changeme123` (change this in production!)

## Metrics Collected

### Application Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `transactions_total` - Total transactions by status
- `transaction_risk_score` - Transaction risk score histogram
- `alerts_total` - Total alerts by severity
- `alert_processing_duration_seconds` - Alert processing time

### Infrastructure Metrics
- **PostgreSQL**: Connections, query performance, locks
- **Redis**: Memory usage, hit rate, commands/sec
- **Kafka**: Consumer lag, partition status, throughput
- **Kubernetes**: Pod CPU/memory, node health

## Alerts

Configured alerts (see `prometheus/alert-rules.yml`):

### Critical Alerts
- `HighErrorRate` - Error rate > 5% for 5 minutes
- `PodDown` - Backend pod down for 5 minutes
- `DatabaseDown` - PostgreSQL unreachable for 2 minutes
- `RedisDown` - Redis unreachable for 2 minutes
- `KafkaPartitionOffline` - Kafka partition has < 2 replicas

### Warning Alerts
- `HighResponseTime` - 95th percentile > 2s for 10 minutes
- `HighCPUUsage` - CPU usage > 80% for 10 minutes
- `HighMemoryUsage` - Memory usage > 2GB for 10 minutes
- `HighTransactionRejectionRate` - Rejection rate > 10%
- `KafkaConsumerLag` - Consumer lag > 1000 messages

## Dashboards

### Transaction Monitoring Dashboard
Main dashboard showing:
- Transaction rate by status
- Risk score distribution
- Alert statistics
- API response time percentiles
- HTTP status code distribution
- Kafka consumer lag
- Database connections
- Redis memory usage
- Pod CPU usage

**Access**: Grafana > Dashboards > Transaction Monitoring Dashboard

## Exporters

### PostgreSQL Exporter
```bash
# Deploy postgres-exporter
kubectl run postgres-exporter \
  --image=prometheuscommunity/postgres-exporter:v0.15.0 \
  --env="DATA_SOURCE_NAME=postgresql://user:pass@postgres:5432/db?sslmode=disable" \
  -n transaction-monitor
```

### Redis Exporter
```bash
# Deploy redis-exporter
kubectl run redis-exporter \
  --image=oliver006/redis_exporter:v1.55.0 \
  --env="REDIS_ADDR=redis-service:6379" \
  -n transaction-monitor
```

### Kafka Exporter
```bash
# Deploy kafka-exporter
kubectl run kafka-exporter \
  --image=danielqsj/kafka-exporter:v1.7.0 \
  --env="KAFKA_SERVER=kafka-service:9092" \
  -n transaction-monitor
```

## Querying Metrics

### Prometheus Query Examples

```promql
# Transaction rate by status
rate(transactions_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# High risk transactions
sum(increase(transactions_total{risk_level="high"}[1h]))

# Kafka consumer lag
kafka_consumergroup_lag

# Database active connections
pg_stat_activity_count
```

## Alert Configuration

### Slack Integration (Optional)

Edit `prometheus-config.yml`:
```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

route:
  receiver: 'slack'
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
```

## Custom Dashboards

Create custom dashboards in Grafana:
1. Go to Dashboards > New Dashboard
2. Add panels with Prometheus queries
3. Save dashboard
4. Export JSON and save to `grafana/dashboards/`

## Troubleshooting

### Prometheus not scraping targets
```bash
# Check Prometheus targets
kubectl port-forward svc/prometheus 9090:9090 -n transaction-monitor
open http://localhost:9090/targets

# Check service endpoints
kubectl get endpoints -n transaction-monitor
```

### Grafana dashboard not loading
```bash
# Check datasource connection
kubectl logs -f deployment/grafana -n transaction-monitor

# Verify ConfigMaps
kubectl get configmap -n transaction-monitor | grep grafana
```

### Missing metrics
```bash
# Check backend metrics endpoint
kubectl port-forward svc/backend-service 8000:8000 -n transaction-monitor
curl http://localhost:8000/metrics/
```

## Best Practices

1. **Retention**: Adjust based on storage capacity
2. **Scrape interval**: Balance between granularity and storage
3. **Alert tuning**: Reduce false positives with proper thresholds
4. **Dashboard organization**: Group related metrics
5. **Security**: Enable authentication for production
6. **Backups**: Export dashboard JSON regularly
