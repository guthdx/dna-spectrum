#!/bin/bash
#
# DNA Spectrum Database Health Monitoring Script
#
# This script monitors:
# - PostgreSQL container health status
# - Database connectivity
# - Disk usage for database volume
# - Container resource usage
#
# Usage: ./health-check.sh [--alert]
#   --alert: Send alert to n8n webhook if issues detected
#
# Cron: */10 * * * * /home/guthdx/dna-spectrum-app/scripts/health-check.sh --alert >> /home/guthdx/dna-spectrum-app/logs/health.log 2>&1
#

set -euo pipefail

# Configuration
CONTAINER_NAME="dna-spectrum-db"
DATABASE="dna_spectrum"
DB_USER="postgres"
DISK_THRESHOLD=80  # Alert if disk usage exceeds this percentage
LOG_DIR="/home/guthdx/dna-spectrum-app/logs"

# n8n webhook for alerts (uncomment and configure if needed)
# N8N_WEBHOOK="https://n8n.iyeska.net/webhook/dna-spectrum-alerts"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
SEND_ALERT=false
if [ "${1:-}" = "--alert" ]; then
    SEND_ALERT=true
fi

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Alert function
send_alert() {
    local message="$1"
    local severity="${2:-warning}"  # info, warning, error

    if [ "$SEND_ALERT" = true ] && [ -n "${N8N_WEBHOOK:-}" ]; then
        curl -s -X POST "$N8N_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"service\": \"DNA Spectrum Database\",
                \"severity\": \"${severity}\",
                \"message\": \"${message}\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"server\": \"$(hostname)\"
            }" > /dev/null 2>&1 || true
    fi
}

# Check results
HEALTH_STATUS="healthy"
ISSUES_FOUND=()

log "=========================================="
log "DNA Spectrum Database Health Check"
log "=========================================="

# 1. Check if container is running
log ""
log "1. Container Status Check"
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
    CONTAINER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no healthcheck")

    success "Container is running (status: ${CONTAINER_STATUS})"

    if [ "$CONTAINER_HEALTH" = "healthy" ]; then
        success "Container health check: ${CONTAINER_HEALTH}"
    elif [ "$CONTAINER_HEALTH" = "no healthcheck" ]; then
        warning "No healthcheck configured"
    else
        error "Container health check: ${CONTAINER_HEALTH}"
        HEALTH_STATUS="degraded"
        ISSUES_FOUND+=("Container health check failed: ${CONTAINER_HEALTH}")
    fi
else
    error "Container is not running!"
    HEALTH_STATUS="critical"
    ISSUES_FOUND+=("Container ${CONTAINER_NAME} is not running")
    send_alert "Container ${CONTAINER_NAME} is not running!" "error"
fi

# 2. Check database connectivity
log ""
log "2. Database Connectivity Check"
if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DATABASE" > /dev/null 2>&1; then
    success "Database is accepting connections"

    # Test actual query
    if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database query test passed"
    else
        error "Database query test failed"
        HEALTH_STATUS="degraded"
        ISSUES_FOUND+=("Database query test failed")
    fi
else
    error "Database is not ready!"
    HEALTH_STATUS="critical"
    ISSUES_FOUND+=("Database is not accepting connections")
    send_alert "Database ${DATABASE} is not accepting connections!" "error"
fi

# 3. Check disk usage
log ""
log "3. Disk Usage Check"

# Check backup directory
if [ -d "/home/guthdx/dna-spectrum/backups" ]; then
    BACKUP_SIZE=$(du -sh /home/guthdx/dna-spectrum/backups | cut -f1)
    BACKUP_COUNT=$(find /home/guthdx/dna-spectrum/backups -name "dna_spectrum_*.sql.gz" -type f 2>/dev/null | wc -l)
    log "Backup directory: ${BACKUP_SIZE} (${BACKUP_COUNT} backups)"
fi

# Check Docker volume usage
VOLUME_NAME=$(docker inspect "$CONTAINER_NAME" --format='{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{end}}{{end}}' | head -1)
if [ -n "$VOLUME_NAME" ]; then
    VOLUME_PATH="/var/lib/docker/volumes/${VOLUME_NAME}/_data"
    if [ -d "$VOLUME_PATH" ]; then
        VOLUME_SIZE=$(sudo du -sh "$VOLUME_PATH" 2>/dev/null | cut -f1 || echo "unknown")
        log "Database volume (${VOLUME_NAME}): ${VOLUME_SIZE}"
    fi
fi

# Check overall disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

if [ "$DISK_USAGE" -ge "$DISK_THRESHOLD" ]; then
    error "Disk usage critical: ${DISK_USAGE}% (available: ${DISK_AVAIL})"
    HEALTH_STATUS="degraded"
    ISSUES_FOUND+=("Disk usage at ${DISK_USAGE}%")
    send_alert "Disk usage at ${DISK_USAGE}% on $(hostname)" "warning"
else
    success "Disk usage: ${DISK_USAGE}% (available: ${DISK_AVAIL})"
fi

# 4. Check container resource usage
log ""
log "4. Container Resource Usage"
CONTAINER_STATS=$(docker stats "$CONTAINER_NAME" --no-stream --format "CPU: {{.CPUPerc}} | Memory: {{.MemUsage}}" 2>/dev/null || echo "unavailable")
log "$CONTAINER_STATS"

# 5. Check database statistics
log ""
log "5. Database Statistics"
DB_SIZE=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE" -t -c \
    "SELECT pg_size_pretty(pg_database_size('${DATABASE}'));" 2>/dev/null | xargs || echo "unknown")
log "Database size: ${DB_SIZE}"

# Get table counts
COACHES_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE" -t -c \
    "SELECT COUNT(*) FROM coaches;" 2>/dev/null | xargs || echo "0")
ASSESSMENTS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE" -t -c \
    "SELECT COUNT(*) FROM assessments;" 2>/dev/null | xargs || echo "0")
REPORTS_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE" -t -c \
    "SELECT COUNT(*) FROM reports;" 2>/dev/null | xargs || echo "0")

log "Records - Coaches: ${COACHES_COUNT} | Assessments: ${ASSESSMENTS_COUNT} | Reports: ${REPORTS_COUNT}"

# 6. Check last backup
log ""
log "6. Backup Status"
LAST_BACKUP=$(find /home/guthdx/dna-spectrum/backups -name "dna_spectrum_*.sql.gz" -type f 2>/dev/null | sort -r | head -1)
if [ -n "$LAST_BACKUP" ]; then
    LAST_BACKUP_DATE=$(stat -c %y "$LAST_BACKUP" | cut -d. -f1)
    LAST_BACKUP_SIZE=$(du -h "$LAST_BACKUP" | cut -f1)
    success "Last backup: ${LAST_BACKUP_DATE} (${LAST_BACKUP_SIZE})"

    # Check if backup is older than 2 days
    LAST_BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LAST_BACKUP")))
    if [ "$LAST_BACKUP_AGE" -gt 172800 ]; then  # 48 hours
        warning "Last backup is older than 2 days!"
        ISSUES_FOUND+=("Last backup is older than 2 days")
    fi
else
    warning "No backups found!"
    ISSUES_FOUND+=("No database backups found")
fi

# Summary
log ""
log "=========================================="
if [ "$HEALTH_STATUS" = "healthy" ]; then
    success "Overall Status: HEALTHY"
elif [ "$HEALTH_STATUS" = "degraded" ]; then
    warning "Overall Status: DEGRADED"
    log "Issues found:"
    for issue in "${ISSUES_FOUND[@]}"; do
        log "  - $issue"
    done
else
    error "Overall Status: CRITICAL"
    log "Critical issues:"
    for issue in "${ISSUES_FOUND[@]}"; do
        log "  - $issue"
    done
fi
log "=========================================="

# Exit with appropriate code
if [ "$HEALTH_STATUS" = "critical" ]; then
    exit 2
elif [ "$HEALTH_STATUS" = "degraded" ]; then
    exit 1
else
    exit 0
fi
