#!/bin/bash
#
# DNA Spectrum Database Backup Script
#
# This script performs automated backups of the PostgreSQL database
# with 30-day retention policy.
#
# Usage: ./backup-database.sh
# Cron: 0 2 * * * /home/guthdx/dna-spectrum-app/scripts/backup-database.sh >> /home/guthdx/dna-spectrum-app/logs/backup.log 2>&1
#

set -euo pipefail

# Configuration
BACKUP_DIR="/home/guthdx/dna-spectrum/backups"
CONTAINER_NAME="dna-spectrum-db"
DATABASE="dna_spectrum"
DB_USER="postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dna_spectrum_${TIMESTAMP}.sql.gz"
LOG_DIR="/home/guthdx/dna-spectrum-app/logs"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting database backup..."

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "ERROR: Container ${CONTAINER_NAME} is not running!"
    exit 1
fi

# Perform backup
log "Creating backup: ${BACKUP_FILE}"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DATABASE" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup successful: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "ERROR: Backup failed!"
    exit 1
fi

# Remove backups older than retention period
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "dna_spectrum_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "dna_spectrum_*.sql.gz" -type f | wc -l)
log "Current backup count: ${BACKUP_COUNT}"

# Calculate disk usage
DISK_USAGE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup directory size: ${DISK_USAGE}"

log "Backup process completed successfully."

# Optional: Test backup integrity (uncomment to enable)
# log "Testing backup integrity..."
# gunzip -t "$BACKUP_FILE" && log "Backup integrity check passed." || log "WARNING: Backup integrity check failed!"
