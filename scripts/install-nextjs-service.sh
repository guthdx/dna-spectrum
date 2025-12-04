#!/bin/bash
#
# Install DNA Spectrum Next.js Systemd Service
#
# Alternative to PM2 - uses systemd for process management
#

set -euo pipefail

SERVICE_FILE="dna-spectrum-app.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_FILE}"
SCRIPTS_DIR="/home/guthdx/dna-spectrum-app/scripts"
APP_DIR="/home/guthdx/dna-spectrum-app"

echo "Installing DNA Spectrum Next.js systemd service..."
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script requires sudo privileges."
    echo "Please run: sudo $0"
    exit 1
fi

# Check if PM2 is managing the app
if command -v pm2 &> /dev/null; then
    if pm2 describe dna-spectrum &> /dev/null; then
        echo "WARNING: PM2 is currently managing dna-spectrum."
        echo "Stop PM2 first with: pm2 stop dna-spectrum && pm2 delete dna-spectrum"
        read -p "Continue anyway? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            exit 0
        fi
    fi
fi

# Check if Next.js is built
if [ ! -d "$APP_DIR/.next" ]; then
    echo "ERROR: Next.js build not found!"
    echo "Run 'npm run build' first in $APP_DIR"
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

# Start service
echo "Starting service..."
systemctl start "$SERVICE_FILE"

# Wait a moment for service to start
sleep 3

# Check status
echo ""
echo "Service installed successfully!"
echo ""
echo "Available commands:"
echo "  sudo systemctl start dna-spectrum-app     # Start the application"
echo "  sudo systemctl stop dna-spectrum-app      # Stop the application"
echo "  sudo systemctl restart dna-spectrum-app   # Restart the application"
echo "  sudo systemctl status dna-spectrum-app    # Check status"
echo "  sudo journalctl -u dna-spectrum-app -f    # View logs"
echo ""

# Show current status
echo "Current status:"
systemctl status dna-spectrum-app --no-pager || true

echo ""
echo "Logs are written to:"
echo "  - /home/guthdx/dna-spectrum-app/logs/nextjs-out.log"
echo "  - /home/guthdx/dna-spectrum-app/logs/nextjs-error.log"
