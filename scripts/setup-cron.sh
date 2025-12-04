#!/bin/bash
#
# Setup Cron Jobs for DNA Spectrum Database
#
# This script adds cron jobs for automated backups and health monitoring
#

set -euo pipefail

SCRIPTS_DIR="/home/guthdx/dna-spectrum-app/scripts"
LOGS_DIR="/home/guthdx/dna-spectrum-app/logs"

echo "Setting up cron jobs for DNA Spectrum Database..."
echo ""

# Create a temporary file with the cron jobs
CRON_FILE=$(mktemp)

# Get existing crontab (ignore error if no crontab exists)
crontab -l 2>/dev/null > "$CRON_FILE" || true

# Remove any existing DNA Spectrum entries
sed -i '/dna-spectrum/d' "$CRON_FILE"

# Add new cron jobs
cat >> "$CRON_FILE" << 'EOF'

# DNA Spectrum Database - Automated Operations
# Daily backup at 2:00 AM
0 2 * * * /home/guthdx/dna-spectrum-app/scripts/backup-database.sh >> /home/guthdx/dna-spectrum-app/logs/backup.log 2>&1

# Health check every 10 minutes (with alerting)
*/10 * * * * /home/guthdx/dna-spectrum-app/scripts/health-check.sh --alert >> /home/guthdx/dna-spectrum-app/logs/health.log 2>&1
EOF

# Install new crontab
crontab "$CRON_FILE"
rm "$CRON_FILE"

echo "Cron jobs installed successfully!"
echo ""
echo "Scheduled jobs:"
echo "  - Daily database backup: 2:00 AM"
echo "  - Health checks: Every 10 minutes"
echo ""
echo "Log locations:"
echo "  - Backup logs: ${LOGS_DIR}/backup.log"
echo "  - Health logs: ${LOGS_DIR}/health.log"
echo ""
echo "To view current crontab:"
echo "  crontab -l | grep dna-spectrum"
echo ""
