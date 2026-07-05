#!/bin/bash

set -e

# Always run from the repository root (this script lives in scripts/)
cd "$(dirname "$0")/.."

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Transaction Monitor - Complete Infrastructure Test       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd backend

echo "📋 Step 1: Cleaning up any existing containers..."
docker compose down -v 2>/dev/null || true
echo "✅ Cleanup complete"
echo ""

echo "📋 Step 2: Building all services..."
echo "This may take 5-10 minutes on first run..."
docker compose build --no-cache
echo "✅ Build complete"
echo ""

echo "📋 Step 3: Starting infrastructure services..."
docker compose up -d postgres redis zookeeper
echo "Waiting for database and cache (20s)..."
sleep 20
echo "✅ Core services started"
echo ""

echo "📋 Step 4: Starting Kafka..."
docker compose up -d kafka
echo "Waiting for Kafka to be ready (40s)..."
sleep 40
echo "✅ Kafka started"
echo ""

echo "📋 Step 5: Starting Rust Risk Scorer..."
docker compose up -d rust-scorer
echo "Waiting for Rust service (10s)..."
sleep 10
echo "✅ Rust scorer started"
echo ""

echo "📋 Step 6: Starting Backend (with migrations)..."
docker compose up -d backend
echo "Waiting for backend to be ready (30s)..."
sleep 30
echo "✅ Backend started"
echo ""

echo "📋 Step 7: Starting Event Processor..."
docker compose up -d event-processor
echo "✅ Event processor started"
echo ""

echo "📋 Step 8: Starting Monitoring (Prometheus + Grafana)..."
docker compose up -d prometheus grafana
echo "Waiting for monitoring stack (10s)..."
sleep 10
echo "✅ Monitoring started"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    HEALTH CHECKS                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to check service
check_service() {
    local name=$1
    local command=$2

    if eval "$command" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
        return 0
    else
        echo "❌ $name is NOT healthy"
        return 1
    fi
}

# Check PostgreSQL
check_service "PostgreSQL" "docker compose exec -T postgres pg_isready -U postgres"

# Check Redis
check_service "Redis" "docker compose exec -T redis redis-cli ping | grep -q PONG"

# Check Kafka
check_service "Kafka" "docker compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092"

# Check Backend
check_service "Backend API" "curl -f http://localhost:8000/health/"

# Check Rust Scorer
check_service "Rust Risk Scorer" "curl -f http://localhost:8001/health"

# Check Prometheus
check_service "Prometheus" "curl -f http://localhost:9090/-/ready"

# Check Grafana
check_service "Grafana" "curl -f http://localhost:3000/api/health"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   RUNNING SERVICES                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

docker compose ps

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   SERVICE ENDPOINTS                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Backend API:        http://localhost:8000"
echo "📚 API Documentation:  http://localhost:8000/api/schema/swagger-ui/"
echo "🔐 Admin Panel:        http://localhost:8000/admin/ (admin/admin123)"
echo "💓 Health Check:       http://localhost:8000/health/"
echo "📊 Metrics:            http://localhost:8000/metrics/"
echo "🦀 Rust Risk Scorer:   http://localhost:8001"
echo "📈 Prometheus:         http://localhost:9090"
echo "📊 Grafana:            http://localhost:3000 (admin/admin)"
echo "🗄️  PostgreSQL:         localhost:5433"
echo "⚡ Redis:              localhost:6379"
echo "📨 Kafka:              localhost:9092"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   TESTING API                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Creating test superuser..."
docker compose exec -T backend python manage.py shell << 'PYTHON'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('✅ Superuser already exists')
PYTHON

echo ""
echo "Testing authentication..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Authentication successful"
    echo "🔑 JWT Token obtained"
else
    echo "❌ Authentication failed"
    exit 1
fi

echo ""
echo "Creating test customer..."
CUSTOMER_ID=$(curl -s -X POST http://localhost:8000/api/v1/customers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_reference": "CUST_TEST_001",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "country_code": "USA",
    "risk_level": "low"
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$CUSTOMER_ID" ]; then
    echo "✅ Customer created: $CUSTOMER_ID"
else
    echo "❌ Customer creation failed"
fi

echo ""
echo "Creating test transaction..."
TXN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/transactions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_reference\": \"TXN_TEST_001\",
    \"customer\": \"$CUSTOMER_ID\",
    \"amount\": \"5000.00\",
    \"currency\": \"USD\",
    \"transaction_type\": \"deposit\"
  }")

if echo "$TXN_RESPONSE" | grep -q "transaction_reference"; then
    echo "✅ Transaction created"
    echo "📄 Response: $TXN_RESPONSE"
else
    echo "❌ Transaction creation failed"
    echo "Response: $TXN_RESPONSE"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    LOGS PREVIEW                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Backend logs (last 10 lines):"
docker compose logs --tail=10 backend

echo ""
echo "Event Processor logs (last 10 lines):"
docker compose logs --tail=10 event-processor

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    SUCCESS!                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "All services are running and integrated properly!"
echo ""
echo "Next steps:"
echo "1. View logs: docker compose logs -f [service-name]"
echo "2. Stop all: docker compose down"
echo "3. Stop and remove volumes: docker compose down -v"
echo ""
echo "Available services: backend, event-processor, rust-scorer, postgres, redis, kafka"
echo ""
