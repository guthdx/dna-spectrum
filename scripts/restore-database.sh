#!/bin/bash
#
# DNA Spectrum Database Restore Script
#
# This script restores a PostgreSQL database from a backup file.
#
# Usage: ./restore-database.sh [backup_file]
#   If no backup file specified, lists available backups
#
# Example: ./restore-database.sh /home/guthdx/dna-spectrum/backups/dna_spectrum_20251203_020000.sql.gz
#

set -euo pipefail

# Configuration
BACKUP_DIR="/home/guthdx/dna-spectrum/backups"
CONTAINER_NAME="dna-spectrum-db"
DATABASE="dna_spectrum"
DB_USER="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function with colors
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error "Container ${CONTAINER_NAME} is not running!"
    exit 1
fi

# If no backup file specified, list available backups
if [ $# -eq 0 ]; then
    echo ""
    echo "Available backups in ${BACKUP_DIR}:"
    echo "-----------------------------------------------------------"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/dna_spectrum_*.sql.gz 2>/dev/null)" ]; then
        warning "No backups found!"
        exit 1
    fi

    ls -lh "$BACKUP_DIR"/dna_spectrum_*.sql.gz | awk '{
        size=$5
        datetime=substr($9, index($9, "_") + 1)
        gsub(".sql.gz", "", datetime)
        year=substr(datetime, 1, 4)
        month=substr(datetime, 5, 2)
        day=substr(datetime, 7, 2)
        hour=substr(datetime, 10, 2)
        minute=substr(datetime, 12, 2)
        second=substr(datetime, 14, 2)
        printf "%-10s  %s-%s-%s %s:%s:%s  %s\n", size, year, month, day, hour, minute, second, $9
    }'

    echo "-----------------------------------------------------------"
    echo ""
    echo "Usage: $0 /path/to/backup/file.sql.gz"
    exit 0
fi

BACKUP_FILE="$1"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Confirm restore operation
BACKUP_FILENAME=$(basename "$BACKUP_FILE")
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
warning "=========================================="
warning "  DATABASE RESTORE WARNING"
warning "=========================================="
echo ""
echo "  This will REPLACE the current database with:"
echo "  File: ${BACKUP_FILENAME}"
echo "  Size: ${BACKUP_SIZE}"
echo ""
warning "  ALL CURRENT DATA WILL BE LOST!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore operation cancelled."
    exit 0
fi

# Create a safety backup before restore
SAFETY_BACKUP="/tmp/dna_spectrum_pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating safety backup before restore: ${SAFETY_BACKUP}"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DATABASE" \
    --format=plain --no-owner --no-acl | gzip > "$SAFETY_BACKUP"
success "Safety backup created: ${SAFETY_BACKUP}"

# Perform restore
log "Starting database restore from: ${BACKUP_FILE}"

# Drop all connections to the database
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DATABASE}' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

# Restore the database
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE"

if [ $? -eq 0 ]; then
    success "Database restored successfully from: ${BACKUP_FILE}"
    echo ""
    log "Safety backup is available at: ${SAFETY_BACKUP}"
    log "You can delete it manually if restore was successful."
else
    error "Database restore failed!"
    log "Attempting to restore from safety backup..."
    gunzip -c "$SAFETY_BACKUP" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DATABASE"

    if [ $? -eq 0 ]; then
        success "Original database restored from safety backup."
    else
        error "CRITICAL: Failed to restore safety backup! Database may be in inconsistent state."
        error "Manual intervention required!"
    fi
    exit 1
fi

echo ""
log "Restore operation completed."
