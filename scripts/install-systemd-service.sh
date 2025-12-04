#!/bin/bash
#
# Install DNA Spectrum Database Systemd Service
#
# This script installs and enables the systemd service for managing the database
#

set -euo pipefail

SERVICE_FILE="dna-spectrum-db.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_FILE}"
SCRIPTS_DIR="/home/guthdx/dna-spectrum-app/scripts"

echo "Installing DNA Spectrum Database systemd service..."
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script requires sudo privileges."
    echo "Please run: sudo $0"
    exit 1
fi

# Copy service file
echo "Copying service file to ${SERVICE_PATH}..."
cp "${SCRIPTS_DIR}/${SERVICE_FILE}" "$SERVICE_PATH"

# Set proper permissions
chmod 644 "$SERVICE_PATH"

# Reload systemd
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable service (start on boot)
echo "Enabling service..."
systemctl enable "$SERVICE_FILE"

# Check status
echo ""
echo "Service installed successfully!"
echo ""
echo "Available commands:"
echo "  sudo systemctl start dna-spectrum-db    # Start the database"
echo "  sudo systemctl stop dna-spectrum-db     # Stop the database"
echo "  sudo systemctl restart dna-spectrum-db  # Restart the database"
echo "  sudo systemctl status dna-spectrum-db   # Check status"
echo ""
echo "The service is enabled and will start automatically on boot."
echo ""

# Show current status
echo "Current status:"
systemctl status dna-spectrum-db --no-pager || true
