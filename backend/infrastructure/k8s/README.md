# Kubernetes Deployment for Azure AKS

Deploy Transaction Monitoring Platform on Azure Kubernetes Service.

## Prerequisites

```bash
# Connect to AKS
az aks get-credentials \
  --resource-group transaction-monitor-production-rg \
  --name transaction-monitor-production-aks

# Verify
kubectl get nodes
```

## Quick Deployment

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets

```bash
# Database credentials (Azure PostgreSQL)
kubectl create secret generic db-credentials \
  --from-literal=DB_HOST='your-server.postgres.database.azure.com' \
  --from-literal=DB_NAME='transaction_monitor' \
  --from-literal=DB_USER='pgadmin' \
  --from-literal=DB_PASSWORD='your-password' \
  -n transaction-monitor

# Redis credentials (Azure Cache for Redis)
kubectl create secret generic redis-credentials \
  --from-literal=REDIS_URL='redis://your-cache.redis.cache.windows.net:6380?ssl=true' \
  --from-literal=REDIS_PASSWORD='your-redis-key' \
  -n transaction-monitor

# Event Hubs (Kafka) credentials
kubectl create secret generic kafka-credentials \
  --from-literal=KAFKA_BOOTSTRAP_SERVERS='your-eventhub.servicebus.windows.net:9093' \
  --from-literal=KAFKA_SASL_PASSWORD='your-connection-string' \
  -n transaction-monitor
```

### 3. Deploy ConfigMaps

```bash
kubectl apply -f configmaps/
```

### 4. Deploy Application

```bash
# Backend API
kubectl apply -f deployments/backend.yaml
kubectl apply -f services/backend-service.yaml

# Event Processor
kubectl apply -f deployments/event-processor.yaml

# Rust Scorer
kubectl apply -f deployments/rust-scorer.yaml
kubectl apply -f services/rust-scorer-service.yaml

# Wait for pods
kubectl wait --for=condition=ready pod -l app=backend -n transaction-monitor --timeout=300s
```

### 5. Expose Service

```bash
# LoadBalancer (gets Azure public IP)
kubectl apply -f services/backend-service.yaml

# Get external IP
kubectl get svc backend-service -n transaction-monitor
```

## Verify

```bash
# Check pods
kubectl get pods -n transaction-monitor

# Check logs
kubectl logs -f deployment/backend -n transaction-monitor

# Test health endpoint
kubectl port-forward svc/backend-service 8000:8000 -n transaction-monitor
curl http://localhost:8000/health/
```

## Scaling

### Manual

```bash
kubectl scale deployment backend --replicas=5 -n transaction-monitor
```

### Auto-scaling (HPA)

Pre-configured in deployments:
- **Backend**: 2-10 replicas (70% CPU threshold)
- **Event Processor**: 2-8 replicas

```bash
kubectl get hpa -n transaction-monitor
```

## Access Application

### Development (Port Forward)

```bash
kubectl port-forward svc/backend-service 8000:8000 -n transaction-monitor
# http://localhost:8000/api/schema/swagger-ui/
```

### Production (LoadBalancer)

```bash
# Get external IP
EXTERNAL_IP=$(kubectl get svc backend-service -n transaction-monitor -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Access API
curl http://$EXTERNAL_IP:8000/health/
```

### With Ingress (Optional)

```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Deploy ingress
kubectl apply -f ingress/ingress.yaml
```

## Database Migrations

```bash
# Automatic via initContainer (runs on pod startup)
# Or manually:
kubectl exec -it deployment/backend -n transaction-monitor -- python manage.py migrate

# Create superuser
kubectl exec -it deployment/backend -n transaction-monitor -- python manage.py createsuperuser
```

## Monitoring

### Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n transaction-monitor

# Event processor logs
kubectl logs -f deployment/event-processor -n transaction-monitor

# Previous logs (if crashed)
kubectl logs --previous deployment/backend -n transaction-monitor
```

### Azure Monitor

Enable Container Insights:

```bash
az aks enable-addons \
  --resource-group transaction-monitor-production-rg \
  --name transaction-monitor-production-aks \
  --addons monitoring
```

Access in Azure Portal → Monitor → Containers.

## Updates

### Update Image

```bash
kubectl set image deployment/backend \
  backend=thesoftnode/transaction-monitor-backend:v2.0 \
  -n transaction-monitor

kubectl rollout status deployment/backend -n transaction-monitor
```

### Rollback

```bash
kubectl rollout undo deployment/backend -n transaction-monitor
```

## Troubleshooting

### Pod Not Starting

```bash
kubectl describe pod POD_NAME -n transaction-monitor
kubectl logs POD_NAME -n transaction-monitor
kubectl get events -n transaction-monitor --sort-by='.lastTimestamp'
```

### Database Connection

```bash
kubectl exec -it deployment/backend -n transaction-monitor -- bash
python manage.py dbshell
```

### ImagePullBackOff

```bash
# Create ACR secret
kubectl create secret docker-registry acr-secret \
  --docker-server=txmonitorprodacr.azurecr.io \
  --docker-username=YOUR_SP_ID \
  --docker-password=YOUR_SP_PASSWORD \
  -n transaction-monitor

# Patch deployment
kubectl patch deployment backend \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"acr-secret"}]}}}}' \
  -n transaction-monitor
```

## Cleanup

```bash
kubectl delete namespace transaction-monitor
```

## Azure Services Integration

This deployment works best with Azure managed services (deployed via Terraform):

- **Azure Database for PostgreSQL** - Managed PostgreSQL with backups
- **Azure Cache for Redis** - Managed Redis with high availability
- **Azure Event Hubs** - Kafka-compatible event streaming
- **Azure Container Registry** - Private Docker images

If you deployed infrastructure with Terraform, use those connection strings in secrets.

## Architecture

```
┌─────────────────────────────────────────┐
│         Azure Load Balancer             │
│        (via LoadBalancer Service)       │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴─────────┐
    │                    │
┌───▼────┐         ┌────▼───┐
│Backend │         │Backend │  (2-10 replicas, HPA)
│  Pod   │         │  Pod   │
└───┬────┘         └────┬───┘
    │                   │
    └──────┬────────────┘
           │
    ┌──────▼───────┐
    │ Azure Managed│
    │   Services   │
    │              │
    │ • PostgreSQL │
    │ • Redis      │
    │ • Event Hubs │
    └──────────────┘
```

## Best Practices

1. Use Azure Managed Services (PostgreSQL, Redis, Event Hubs)
2. Set resource limits on all pods
3. Configure health probes (liveness, readiness)
4. Use HPA for auto-scaling
5. Store secrets in Azure Key Vault
6. Enable Azure Monitor Container Insights
7. Use ACR for private images
8. Regular backups of persistent data

## Resources

- [Azure AKS Docs](https://docs.microsoft.com/en-us/azure/aks/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Azure Monitor for Containers](https://docs.microsoft.com/en-us/azure/azure-monitor/containers/)
