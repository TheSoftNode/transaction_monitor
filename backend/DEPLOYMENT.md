# Production Deployment Guide

## Prerequisites

- Docker 20.10+ and Docker Compose V2
- Minimum 4 CPU cores, 8GB RAM
- 30GB+ disk space
- Open ports: 8000, 8001, 3000, 9090

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/TheSoftNode/transaction_monitor.git
cd transaction_monitor/backend
```

### 2. Generate Secure Environment Variables

```bash
# Copy template
cp .env.example .env

# Generate secrets
export SECRET_KEY=$(openssl rand -base64 64 | tr -d '\n')
export DB_PASSWORD=$(openssl rand -hex 32)
export GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')

# Update .env file with your server IP
sed -i "s/your-ip-address/YOUR_SERVER_IP/g" .env
sed -i "s/CHANGEME_GENERATE_WITH_openssl_rand_base64_64/$SECRET_KEY/g" .env
sed -i "s/CHANGEME_GENERATE_WITH_openssl_rand_hex_32/$DB_PASSWORD/g" .env
sed -i "s/CHANGEME_GENERATE_WITH_openssl_rand_base64_16/$GRAFANA_PASSWORD/g" .env
```

### 3. Configure Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 8000/tcp # Backend API
sudo ufw allow 8001/tcp # Rust Scorer
sudo ufw allow 3000/tcp # Grafana
sudo ufw allow 9090/tcp # Prometheus
sudo ufw enable
```

### 4. Deploy Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

### 5. Create Admin User

```bash
docker exec -it transaction-monitor-backend python manage.py createsuperuser
```

### 6. Initialize Rule Configurations

```bash
docker exec -it transaction-monitor-backend python manage.py shell << EOF
from rules.models import RuleConfiguration

rules = [
    {
        'rule_name': 'HighValueTransactionRule',
        'is_active': True,
        'priority': 100,
        'description': 'Flags transactions above threshold',
        'parameters': {'threshold': 10000}
    },
    {
        'rule_name': 'VelocityRule',
        'is_active': True,
        'priority': 90,
        'description': 'Detects rapid transaction velocity',
        'parameters': {'max_transactions': 10, 'time_window_minutes': 60}
    },
    {
        'rule_name': 'BlacklistedCountryRule',
        'is_active': True,
        'priority': 80,
        'description': 'Flags transactions from high-risk countries',
        'parameters': {}
    },
    {
        'rule_name': 'HighRiskCustomerRule',
        'is_active': True,
        'priority': 70,
        'description': 'Flags transactions from high-risk customers',
        'parameters': {}
    }
]

for rule in rules:
    RuleConfiguration.objects.get_or_create(
        rule_name=rule['rule_name'],
        defaults=rule
    )
print("✅ Rules initialized")
EOF
```

## Access Points

- **API**: `http://YOUR_IP:8000/api/v1/`
- **Swagger UI**: `http://YOUR_IP:8000/api/schema/swagger-ui/`
- **Grafana**: `http://YOUR_IP:3000` (admin / YOUR_GRAFANA_PASSWORD)
- **Prometheus**: `http://YOUR_IP:9090`
- **Rust Scorer**: `http://YOUR_IP:8001/health`

## Health Checks

```bash
# Backend
curl http://YOUR_IP:8000/health/

# Rust Scorer
curl http://YOUR_IP:8001/health

# Prometheus
curl http://YOUR_IP:9090/-/healthy

# Grafana
curl http://YOUR_IP:3000/api/health
```

## Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f event-processor
```

### Backup Database

```bash
# Backup
docker exec transaction-monitor-db pg_dump -U postgres transaction_monitor > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260703.sql | docker exec -i transaction-monitor-db psql -U postgres transaction_monitor
```

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker exec transaction-monitor-backend python manage.py migrate
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop Services

```bash
# Stop without removing data
docker compose -f docker-compose.prod.yml stop

# Stop and remove containers (keeps volumes)
docker compose -f docker-compose.prod.yml down

# DANGER: Remove everything including data
docker compose -f docker-compose.prod.yml down -v
```

## Monitoring

### Check Service Health

```bash
docker compose -f docker-compose.prod.yml ps
```

### Resource Usage

```bash
docker stats
```

### View Metrics in Grafana

1. Open `http://YOUR_IP:3000`
2. Login with credentials from `.env`
3. Navigate to Dashboards → Transaction Monitoring

## Security Best Practices

✅ **Implemented:**
- Environment variables for secrets
- No hardcoded credentials
- Firewall configuration
- Restart policies for resilience
- Health checks for all services
- Named volumes for data persistence
- Isolated Docker network
- Read-only Prometheus config mount
- Gunicorn for production WSGI server

⚠️ **Recommended Additional Steps:**
- Enable HTTPS with Let's Encrypt
- Set up log rotation
- Configure automated backups
- Implement rate limiting at nginx/reverse proxy
- Enable Docker log drivers
- Set up monitoring alerts

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs SERVICE_NAME

# Check if port is in use
sudo netstat -tlnp | grep PORT
```

### Database Connection Issues

```bash
# Verify postgres is healthy
docker exec transaction-monitor-db pg_isready -U postgres

# Check connectivity from backend
docker exec transaction-monitor-backend nc -zv postgres 5432
```

### Kafka Issues

```bash
# List topics
docker exec transaction-monitor-kafka kafka-topics --list --bootstrap-server localhost:29092

# Check consumer groups
docker exec transaction-monitor-kafka kafka-consumer-groups --list --bootstrap-server localhost:29092
```

## Performance Tuning

### Increase Workers

Edit `.env`:
```
GUNICORN_WORKERS=8  # 2-4 workers per CPU core
```

### Database Optimization

```bash
docker exec transaction-monitor-db psql -U postgres -d transaction_monitor -c "VACUUM ANALYZE;"
```

### Redis Memory

Add to `docker-compose.prod.yml`:
```yaml
redis:
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

## Support

- **Documentation**: https://github.com/TheSoftNode/transaction_monitor
- **Issues**: https://github.com/TheSoftNode/transaction_monitor/issues
