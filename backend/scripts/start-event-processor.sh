#!/bin/bash
set -e  # Exit on error
set -u  # Exit on undefined variable

echo "========================================="
echo "Event Processor - Production Startup"
echo "========================================="
echo ""

# Function for logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function for error handling
error_exit() {
    echo "[ERROR] $1" >&2
    exit 1
}

# Check required environment variables
log "Checking environment variables..."
: "${DB_HOST:?Database host not set}"
: "${KAFKA_BOOTSTRAP_SERVERS:?Kafka servers not set}"
: "${RUST_RISK_SCORER_URL:?Rust scorer URL not set}"
log "✓ Environment variables validated"

# Wait for database to be ready
log "Waiting for database connection..."
max_attempts=30
attempt=0
until python manage.py check --database default > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        error_exit "Database connection failed after $max_attempts attempts"
    fi
    log "Database not ready yet (attempt $attempt/$max_attempts)..."
    sleep 2
done
log "✓ Database connection established"

# Wait for Kafka to be ready
log "Waiting for Kafka..."
sleep 10  # Give Kafka time to fully start
log "✓ Kafka wait period completed"

# Verify Rust scorer is accessible
log "Checking Rust risk scorer availability..."
if curl -sf "${RUST_RISK_SCORER_URL}/health" > /dev/null; then
    log "✓ Rust risk scorer is healthy"
else
    log "⚠ Rust risk scorer not responding (will retry during processing)"
fi

# Start event processor
log "Starting event processor..."
log "Configuration:"
log "  - Kafka: ${KAFKA_BOOTSTRAP_SERVERS}"
log "  - Rust Scorer: ${RUST_RISK_SCORER_URL}"
log "  - Rust Enabled: ${RUST_RISK_SCORER_ENABLED:-true}"
echo ""
log "========================================="
log "Event Processor Running"
log "========================================="
echo ""

exec python manage.py run_event_processor
