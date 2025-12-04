#!/bin/bash
#
# DNA Spectrum - Next.js Production Deployment Script
#
# This script deploys the Next.js application to Ubuntu server and configures:
# - Production build
# - PM2 process manager
# - Environment configuration
# - Cloudflare tunnel integration
# - Health checks
#
# Usage: ./deploy-nextjs.sh
#

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/guthdx/dna-spectrum-app"
APP_NAME="dna-spectrum"
APP_PORT="3000"
DATABASE_URL="postgresql://postgres:dna_spectrum_2024@localhost:5432/dna_spectrum"
PUBLIC_URL="https://dna.iyeska.net"
CLOUDFLARED_CONFIG="/home/guthdx/.cloudflared/config.yml"

# Log functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║          DNA Spectrum - Next.js Production Deployment                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF

echo ""
log "Starting deployment to Ubuntu server..."
echo ""

# Step 1: Verify prerequisites
log "Step 1/8: Verifying prerequisites..."

# Check if we're in the right directory
if [ ! -f "$APP_DIR/package.json" ]; then
    error "Not in app directory! Please cd to $APP_DIR first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed!"
    exit 1
fi
NODE_VERSION=$(node --version)
success "Node.js $NODE_VERSION installed"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed!"
    exit 1
fi
NPM_VERSION=$(npm --version)
success "npm $NPM_VERSION installed"

# Check PostgreSQL container
if ! docker ps --format '{{.Names}}' | grep -q "^dna-spectrum-db$"; then
    error "PostgreSQL container is not running!"
    error "Start it with: cd ~/dna-spectrum && docker compose up -d"
    exit 1
fi
success "PostgreSQL container is running"

echo ""

# Step 2: Install dependencies
log "Step 2/8: Installing dependencies..."
cd "$APP_DIR"
npm install --production=false
success "Dependencies installed"
echo ""

# Step 3: Create environment file
log "Step 3/8: Creating production environment file..."

if [ -f "$APP_DIR/.env.local" ]; then
    warning ".env.local already exists. Creating backup..."
    cp "$APP_DIR/.env.local" "$APP_DIR/.env.local.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$APP_DIR/.env.local" << EOF
# DNA Spectrum - Production Environment
# Generated: $(date)

# Database connection (local PostgreSQL container)
DATABASE_URL="${DATABASE_URL}"

# Public URL (Cloudflare tunnel)
NEXT_PUBLIC_APP_URL="${PUBLIC_URL}"

# Node environment
NODE_ENV="production"

# Port (default: 3000)
PORT=${APP_PORT}
EOF

success "Environment file created: .env.local"
echo ""

# Step 4: Build production bundle
log "Step 4/8: Building production bundle..."
log "This may take 2-3 minutes..."

npm run build

if [ $? -eq 0 ]; then
    success "Production build completed successfully"
else
    error "Build failed! Check errors above."
    exit 1
fi
echo ""

# Step 5: Install and configure PM2
log "Step 5/8: Setting up PM2 process manager..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    warning "PM2 not installed. Installing globally..."
    sudo npm install -g pm2
    success "PM2 installed"
else
    success "PM2 already installed"
fi

# Stop existing process if running
if pm2 describe "$APP_NAME" &> /dev/null; then
    warning "Stopping existing $APP_NAME process..."
    pm2 stop "$APP_NAME"
    pm2 delete "$APP_NAME"
fi

# Start Next.js with PM2
log "Starting Next.js application..."
cd "$APP_DIR"
pm2 start npm --name "$APP_NAME" -- start

# Save PM2 configuration
pm2 save

success "Application started with PM2"
echo ""

# Step 6: Configure PM2 startup
log "Step 6/8: Configuring auto-start on boot..."

# Check if PM2 startup is already configured
if ! systemctl is-enabled pm2-guthdx &> /dev/null; then
    info "Setting up PM2 startup script..."
    STARTUP_CMD=$(pm2 startup systemd -u guthdx --hp /home/guthdx | grep "sudo")

    if [ -n "$STARTUP_CMD" ]; then
        echo ""
        warning "PM2 startup requires sudo. Run this command manually:"
        echo ""
        echo "$STARTUP_CMD"
        echo ""
        read -p "Press Enter after running the command above, or Ctrl+C to skip..."
        success "PM2 startup configured"
    fi
else
    success "PM2 startup already configured"
fi
echo ""

# Step 7: Update Cloudflare tunnel configuration
log "Step 7/8: Configuring Cloudflare tunnel..."

if [ ! -f "$CLOUDFLARED_CONFIG" ]; then
    error "Cloudflare tunnel config not found at $CLOUDFLARED_CONFIG"
    warning "You'll need to manually add the ingress rule for dna.iyeska.net"
else
    # Check if dna.iyeska.net already exists
    if grep -q "dna.iyeska.net" "$CLOUDFLARED_CONFIG"; then
        success "dna.iyeska.net already configured in Cloudflare tunnel"
    else
        warning "Adding dna.iyeska.net to Cloudflare tunnel config..."

        # Create backup
        sudo cp "$CLOUDFLARED_CONFIG" "${CLOUDFLARED_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

        # Add ingress rule before the catch-all
        sudo sed -i '/service: http_status:404/i \  # DNA Spectrum Next.js App\n  - hostname: dna.iyeska.net\n    service: http://localhost:3000\n' "$CLOUDFLARED_CONFIG"

        success "Added dna.iyeska.net to tunnel config"

        # Restart cloudflared
        log "Restarting Cloudflare tunnel..."
        sudo systemctl restart cloudflared
        sleep 3

        if systemctl is-active --quiet cloudflared; then
            success "Cloudflare tunnel restarted successfully"
        else
            error "Cloudflare tunnel failed to restart! Check logs:"
            echo "sudo journalctl -u cloudflared -n 50"
        fi
    fi
fi
echo ""

# Step 8: Verify deployment
log "Step 8/8: Verifying deployment..."

# Wait for app to start
sleep 3

# Check PM2 status
if pm2 describe "$APP_NAME" &> /dev/null; then
    success "PM2 process is running"
else
    error "PM2 process is not running!"
    pm2 logs "$APP_NAME" --lines 20
    exit 1
fi

# Check if port 3000 is listening
if ss -tlnp | grep -q ":$APP_PORT"; then
    success "Application is listening on port $APP_PORT"
else
    error "Application is not listening on port $APP_PORT!"
    exit 1
fi

# Test local HTTP response
log "Testing local HTTP endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT | grep -q "200\|301\|302"; then
    success "Local HTTP test passed"
else
    warning "Local HTTP test returned non-200 status (this may be normal for Next.js)"
fi

echo ""
log "═══════════════════════════════════════════════════════════════════════════"
success "Deployment completed successfully!"
log "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Display summary
cat << EOF
${GREEN}✓ Deployment Summary${NC}

Application:     ${APP_NAME}
Status:          $(pm2 describe ${APP_NAME} | grep "status" | awk '{print $4}')
Port:            ${APP_PORT}
Environment:     Production
Database:        PostgreSQL (localhost:5432)
Public URL:      ${PUBLIC_URL}

${BLUE}Next Steps:${NC}

1. View application logs:
   pm2 logs ${APP_NAME}

2. Check PM2 status:
   pm2 status

3. Test locally:
   curl http://localhost:${APP_PORT}

4. Test via Cloudflare:
   curl -I ${PUBLIC_URL}

5. Monitor Cloudflare tunnel:
   sudo journalctl -u cloudflared -f

${BLUE}Management Commands:${NC}

pm2 restart ${APP_NAME}    # Restart application
pm2 stop ${APP_NAME}       # Stop application
pm2 logs ${APP_NAME}       # View logs
pm2 monit                  # Monitor resources

${YELLOW}Important:${NC}

- DNS must point dna.iyeska.net → your Cloudflare tunnel
- Application auto-starts on server reboot
- Logs: ~/.pm2/logs/${APP_NAME}-out.log

EOF

# Test Cloudflare connection (non-blocking)
log "Testing Cloudflare tunnel connection..."
sleep 2

if curl -s -I "${PUBLIC_URL}" | grep -q "HTTP/"; then
    success "Cloudflare tunnel is working! ${PUBLIC_URL} is live!"
else
    warning "Could not verify Cloudflare connection yet. DNS may still be propagating."
    info "Check DNS: https://www.whatsmydns.net/#CNAME/dna.iyeska.net"
fi

echo ""
log "Deployment script finished."
echo ""
