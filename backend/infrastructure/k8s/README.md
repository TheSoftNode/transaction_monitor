# Kubernetes Deployment Guide

## Prerequisites
- Kubernetes cluster (v1.25+)
- kubectl configured
- NGINX Ingress Controller installed
- cert-manager installed (for TLS certificates)

## Deployment Steps

### 1. Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. Create ConfigMaps and Secrets
```bash
kubectl apply -f configmaps/
kubectl apply -f secrets/
```

**Note:** Update `secrets/db-credentials.yaml` with your actual credentials before applying.

### 3. Deploy Database and Message Broker
```bash
kubectl apply -f deployments/postgres.yaml
kubectl apply -f deployments/zookeeper.yaml
kubectl apply -f deployments/kafka.yaml
kubectl apply -f deployments/redis.yaml
```

### 4. Wait for StatefulSets to be Ready
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n transaction-monitor --timeout=300s
kubectl wait --for=condition=ready pod -l app=zookeeper -n transaction-monitor --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka -n transaction-monitor --timeout=300s
```

### 5. Deploy Backend Application
```bash
kubectl apply -f deployments/backend.yaml
kubectl apply -f services/backend-service.yaml
```

### 6. Deploy Event Processor
```bash
kubectl apply -f deployments/event-processor.yaml
```

### 7. Configure Ingress
```bash
kubectl apply -f ingress/ingress.yaml
```

## Verify Deployment

```bash
# Check all pods
kubectl get pods -n transaction-monitor

# Check services
kubectl get svc -n transaction-monitor

# Check ingress
kubectl get ingress -n transaction-monitor

# View logs
kubectl logs -f deployment/backend -n transaction-monitor
kubectl logs -f deployment/event-processor -n transaction-monitor
```

## Scaling

### Manual Scaling
```bash
kubectl scale deployment backend --replicas=5 -n transaction-monitor
kubectl scale deployment event-processor --replicas=4 -n transaction-monitor
```

### Auto-scaling
HPA is already configured for:
- Backend: 2-10 replicas (70% CPU threshold)
- Event Processor: 2-8 replicas (70% CPU, 80% memory)

## Monitoring

Access health check:
```bash
kubectl port-forward svc/backend-service 8000:8000 -n transaction-monitor
curl http://localhost:8000/health/
```

Access metrics:
```bash
curl http://localhost:8000/metrics/
```

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n transaction-monitor
kubectl logs <pod-name> -n transaction-monitor
```

### Database connection issues
```bash
kubectl exec -it postgres-0 -n transaction-monitor -- psql -U transaction_user -d transaction_monitor
```

### Kafka issues
```bash
kubectl exec -it kafka-0 -n transaction-monitor -- kafka-topics --list --bootstrap-server localhost:9092
```

## Cleanup

```bash
kubectl delete namespace transaction-monitor
```
