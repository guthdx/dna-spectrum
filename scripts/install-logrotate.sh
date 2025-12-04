#!/bin/bash
#
# Install DNA Spectrum Log Rotation Configuration
#
# This script installs logrotate configuration for DNA Spectrum logs
#

set -euo pipefail

LOGROTATE_FILE="dna-spectrum-logs"
LOGROTATE_PATH="/etc/logrotate.d/${LOGROTATE_FILE}"
SCRIPTS_DIR="/home/guthdx/dna-spectrum-app/scripts"

echo "Installing DNA Spectrum log rotation configuration..."
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script requires sudo privileges."
    echo "Please run: sudo $0"
    exit 1
fi

# Copy logrotate configuration
echo "Copying logrotate config to ${LOGROTATE_PATH}..."
cp "${SCRIPTS_DIR}/${LOGROTATE_FILE}" "$LOGROTATE_PATH"

# Set proper permissions
chmod 644 "$LOGROTATE_PATH"

# Test configuration
echo "Testing logrotate configuration..."
logrotate -d "$LOGROTATE_PATH"

echo ""
echo "Log rotation installed successfully!"
echo ""
echo "Configuration:"
echo "  - Application logs: Rotated daily, kept for 30 days"
echo "  - Docker logs: Rotated daily, kept for 7 days"
echo "  - Logs are compressed after rotation"
echo ""
echo "To manually test rotation:"
echo "  sudo logrotate -f ${LOGROTATE_PATH}"
echo ""
