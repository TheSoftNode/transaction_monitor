#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd ~/transaction_monitor

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Build and deploy backend services
echo "🐳 Building Docker images..."
cd ~/transaction_monitor/backend
docker compose -f docker-compose.prod.yml build --no-cache backend event-processor

# Restart services with zero-downtime
echo "♻️ Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps backend event-processor

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker compose -f docker-compose.prod.yml ps backend event-processor

# Test health endpoint
echo "🧪 Testing health endpoint..."
curl -f http://localhost:8000/health/ || exit 1

echo "✅ Deployment successful!"
