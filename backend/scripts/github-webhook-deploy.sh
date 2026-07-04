#!/bin/bash
# GitHub webhook deployment script
# This script runs when GitHub sends a push webhook

set -e

LOG_FILE="/var/log/github-deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔔 Webhook received - Starting deployment..."

# Change to project directory
cd ~/transaction_monitor

# Verify it's a push to main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "⚠️ Not on main branch, skipping deployment"
    exit 0
fi

# Pull latest changes
log "📥 Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# Check if backend or rust-scorer changed
CHANGED_FILES=$(git diff --name-only HEAD@{1} HEAD)
if echo "$CHANGED_FILES" | grep -qE "(backend/|rust-risk-scorer/)"; then
    log "🐳 Building Docker images..."
    cd ~/transaction_monitor/backend
    docker compose -f docker-compose.prod.yml build --no-cache backend event-processor

    log "♻️ Restarting services..."
    docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps backend event-processor

    log "⏳ Waiting for services..."
    sleep 30

    log "🧪 Testing health endpoint..."
    curl -f http://localhost:8000/health/ || {
        log "❌ Health check failed!"
        exit 1
    }

    log "✅ Deployment successful!"
else
    log "ℹ️ No backend changes detected, skipping deployment"
fi
