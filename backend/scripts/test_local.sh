#!/bin/bash

echo "=== Testing Transaction Monitor Platform ==="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi
echo "✅ Docker installed"

# Check docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose not found"
    exit 1
fi
echo "✅ docker-compose available"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi
echo "✅ Python 3 installed"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

echo ""
echo "=== Starting Services with Docker Compose ==="
docker compose up -d postgres redis zookeeper kafka

echo ""
echo "Waiting for services to be ready (30s)..."
sleep 30

echo ""
echo "=== Checking Service Health ==="

# Check PostgreSQL
if docker compose exec -T postgres pg_isready -U transaction_user &> /dev/null; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Check Kafka
if docker compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list &> /dev/null; then
    echo "✅ Kafka is ready"
else
    echo "⚠️  Kafka may not be ready yet (this is normal, it takes time)"
fi

echo ""
echo "=== Setting up Python Environment ==="

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements/development.txt

echo ""
echo "=== Running Migrations ==="
DB_PORT=5433 python manage.py migrate

echo ""
echo "=== Creating Superuser (Optional) ==="
echo "Username: admin"
echo "Email: admin@example.com"
echo "Password: admin123"
echo ""
echo "Skip if already exists..."
DB_PORT=5433 python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
" 2>/dev/null || true

echo ""
echo "=== Health Check ==="
echo "Starting Django server in background..."
DB_PORT=5433 python manage.py runserver 8000 &
DJANGO_PID=$!

sleep 5

if curl -f http://localhost:8000/health/ &> /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

kill $DJANGO_PID 2>/dev/null || true

echo ""
echo "=== Summary ==="
echo "All core services are running!"
echo ""
echo "Next steps:"
echo "1. Start backend: python manage.py runserver"
echo "2. Start event processor: python manage.py run_event_processor"
echo "3. Access API: http://localhost:8000/api/v1/"
echo "4. Access admin: http://localhost:8000/admin/ (admin/admin123)"
echo "5. API docs: http://localhost:8000/api/schema/swagger-ui/"
echo ""
