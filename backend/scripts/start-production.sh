#!/bin/bash
set -e  # Exit on error
set -u  # Exit on undefined variable

echo "========================================="
echo "Transaction Monitor - Production Startup"
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
: "${DB_NAME:?Database name not set}"
: "${SECRET_KEY:?Secret key not set}"
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

# Run database migrations
log "Running database migrations..."
python manage.py migrate --noinput || error_exit "Migration failed"
log "✓ Migrations completed"

# Collect static files
log "Collecting static files..."
python manage.py collectstatic --noinput --clear || error_exit "Static file collection failed"
log "✓ Static files collected"

# Create cache table if needed
log "Setting up cache..."
python manage.py createcachetable > /dev/null 2>&1 || true
log "✓ Cache configured"

# Start Gunicorn
log "Starting Gunicorn WSGI server..."
log "Configuration:"
log "  - Workers: ${GUNICORN_WORKERS:-4}"
log "  - Bind: 0.0.0.0:8000"
log "  - Timeout: 120s"
log "  - Log Level: info"
echo ""
log "========================================="
log "Application Starting"
log "========================================="
echo ""

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-4}" \
    --worker-class sync \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --capture-output \
    --enable-stdio-inheritance
