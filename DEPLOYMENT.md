# DNA Spectrum - Deployment Guide

Deploy the Next.js application to Ubuntu server (192.168.11.20) for production use at https://dna.iyeska.net

---

## Quick Deployment (Automated)

### Prerequisites

✅ PostgreSQL database running (`docker ps | grep dna-spectrum-db`)
✅ Node.js installed (`node --version`)
✅ Cloudflare tunnel configured
✅ Latest code from GitHub

### One-Command Deployment

```bash
# Pull latest code
cd ~/dna-spectrum-app
git pull origin main

# Run deployment script
./scripts/deploy-nextjs.sh
```

**The script will:**
1. Install dependencies
2. Build production bundle
3. Create `.env.local` configuration
4. Set up PM2 process manager
5. Configure auto-start on boot
6. Update Cloudflare tunnel config
7. Restart services
8. Verify deployment

**Time**: ~5-10 minutes (first run includes build)

---

## What Gets Deployed

### Application Stack

```
Internet
    ↓
Cloudflare Tunnel (cloudflared)
    ↓
https://dna.iyeska.net → http://localhost:3000
    ↓
Next.js (PM2 managed)
    ↓
PostgreSQL (Docker container)
```

### Configuration

- **Port**: 3000
- **Process Manager**: PM2 (default) or systemd
- **Database**: `postgresql://postgres:dna_spectrum_2024@localhost:5432/dna_spectrum`
- **Public URL**: https://dna.iyeska.net
- **Environment**: Production

### Files Created

```
/home/guthdx/dna-spectrum-app/
├── .env.local              # Production environment (not in git)
├── .next/                  # Production build output (not in git)
├── node_modules/           # Dependencies (not in git)
└── logs/
    ├── nextjs-out.log      # Application stdout
    └── nextjs-error.log    # Application stderr
```

---

## Management with PM2 (Default)

### Common Commands

```bash
# View status
pm2 status

# View logs (real-time)
pm2 logs dna-spectrum

# View logs (last 100 lines)
pm2 logs dna-spectrum --lines 100

# Restart application
pm2 restart dna-spectrum

# Stop application
pm2 stop dna-spectrum

# Start application
pm2 start dna-spectrum

# Monitor resources
pm2 monit

# View detailed info
pm2 describe dna-spectrum
```

### Log Files

```bash
# PM2 logs location
~/.pm2/logs/dna-spectrum-out.log
~/.pm2/logs/dna-spectrum-error.log

# View with tail
tail -f ~/.pm2/logs/dna-spectrum-out.log
```

### PM2 Configuration

```bash
# Save current PM2 processes
pm2 save

# Restore saved processes
pm2 resurrect

# Update PM2
sudo npm install -g pm2
pm2 update
```

---

## Alternative: Systemd Service

If you prefer systemd over PM2:

### Install Systemd Service

```bash
# First, stop PM2 if running
pm2 stop dna-spectrum
pm2 delete dna-spectrum
pm2 save

# Install systemd service
cd ~/dna-spectrum-app/scripts
sudo ./install-nextjs-service.sh
```

### Systemd Commands

```bash
# Start application
sudo systemctl start dna-spectrum-app

# Stop application
sudo systemctl stop dna-spectrum-app

# Restart application
sudo systemctl restart dna-spectrum-app

# Check status
sudo systemctl status dna-spectrum-app

# View logs (real-time)
sudo journalctl -u dna-spectrum-app -f

# View logs (last 100 lines)
sudo journalctl -u dna-spectrum-app -n 100

# Enable auto-start on boot
sudo systemctl enable dna-spectrum-app

# Disable auto-start
sudo systemctl disable dna-spectrum-app
```

### Systemd Log Files

```bash
~/dna-spectrum-app/logs/nextjs-out.log
~/dna-spectrum-app/logs/nextjs-error.log
```

---

## Cloudflare Tunnel Configuration

### Ingress Rule

The deployment script adds this to `~/.cloudflared/config.yml`:

```yaml
ingress:
  - hostname: dna.iyeska.net
    service: http://localhost:3000
```

### Manual Configuration (if needed)

```bash
# Edit config
sudo nano ~/.cloudflared/config.yml

# Add before the catch-all rule (service: http_status:404):
  - hostname: dna.iyeska.net
    service: http://localhost:3000

# Restart tunnel
sudo systemctl restart cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f
```

### DNS Configuration

In Cloudflare dashboard (should already be done):

1. Go to DNS settings for `iyeska.net`
2. Add CNAME record:
   - **Name**: `dna`
   - **Target**: `1e02b2ec-7f02-4cf5-962f-0db3558e270c.cfargotunnel.com`
   - **Proxy**: Enabled (orange cloud)

---

## Redeployment (Updates)

When you have code changes:

```bash
# Pull latest code
cd ~/dna-spectrum-app
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Restart application
pm2 restart dna-spectrum

# Or with systemd:
# sudo systemctl restart dna-spectrum-app
```

### Quick Redeploy Script

```bash
# Create an alias for quick updates
cd ~/dna-spectrum-app
git pull && npm install && npm run build && pm2 restart dna-spectrum
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check build exists
ls -la ~/dna-spectrum-app/.next

# Rebuild if needed
cd ~/dna-spectrum-app
npm run build

# Check PM2 logs
pm2 logs dna-spectrum --lines 50

# Or systemd logs
sudo journalctl -u dna-spectrum-app -n 50
```

### Port 3000 Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 PID

# Or change port in .env.local
nano ~/dna-spectrum-app/.env.local
# Set: PORT=3001
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep dna-spectrum-db

# Test connection
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "SELECT 1;"

# Check DATABASE_URL in .env.local
cat ~/dna-spectrum-app/.env.local | grep DATABASE_URL
```

### Cloudflare Tunnel Not Working

```bash
# Check tunnel status
sudo systemctl status cloudflared

# Check tunnel config
cat ~/.cloudflared/config.yml | grep -A2 dna.iyeska.net

# Restart tunnel
sudo systemctl restart cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f
```

### 502 Bad Gateway

This usually means Next.js isn't running:

```bash
# Check if port 3000 is listening
ss -tlnp | grep :3000

# Check PM2 status
pm2 status

# Check application logs
pm2 logs dna-spectrum
```

### Build Errors

```bash
# Clean build cache
cd ~/dna-spectrum-app
rm -rf .next node_modules

# Reinstall and rebuild
npm install
npm run build
```

---

## Performance Optimization

### Production Build

The deployment script runs `npm run build` which:
- Optimizes images
- Minifies JavaScript/CSS
- Generates static pages where possible
- Enables React production mode

### Caching

Next.js automatically caches:
- Static assets (images, CSS, JS)
- API responses (if configured)
- Static pages

### Resource Usage

Expected usage:
- **Memory**: 150-300 MB
- **CPU**: <5% idle, spikes to 20-30% under load
- **Disk**: ~500 MB (including node_modules)

Monitor with:
```bash
pm2 monit
# or
docker stats
```

---

## Security Considerations

### Environment Variables

**Never commit** `.env.local` to git!

The `.gitignore` already excludes:
- `.env.local`
- `.env*.local`
- `.env.production`

### Database Access

Production uses localhost connection:
- No network exposure needed
- Faster than TCP connection
- More secure

### HTTPS

All traffic goes through Cloudflare tunnel:
- Automatic HTTPS/TLS
- No need to manage certificates
- DDoS protection included

### Process Isolation

PM2/systemd runs as `guthdx` user (not root):
- Limited file system access
- Cannot modify system files
- Isolated from other services

---

## Monitoring & Alerts

### Health Checks

The database health check script also monitors the app:

```bash
# Check if port 3000 is responding
curl -f http://localhost:3000 || echo "App is down!"

# Add to health-check.sh (optional)
nano ~/dna-spectrum-app/scripts/health-check.sh
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web dashboard (optional)
pm2 install pm2-server-monit
# Access at: http://192.168.11.20:9615
```

### Logs

```bash
# Tail all logs
pm2 logs

# Tail specific app
pm2 logs dna-spectrum

# Flush logs
pm2 flush
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current version
pm2 stop dna-spectrum

# 2. Checkout previous commit
cd ~/dna-spectrum-app
git log --oneline -5  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH

# 3. Rebuild
npm install
npm run build

# 4. Restart
pm2 restart dna-spectrum
```

---

## Backup Before Deployment

Always backup before major updates:

```bash
# Backup database
cd ~/dna-spectrum-app/scripts
./backup-database.sh

# Backup application code (optional)
cd ~
tar -czf dna-spectrum-app-backup-$(date +%Y%m%d).tar.gz dna-spectrum-app/
```

---

## Auto-Deployment (Future)

To set up GitHub Actions auto-deployment:

1. Add server SSH key to GitHub secrets
2. Create `.github/workflows/deploy.yml`
3. On push to `main`, trigger deployment script

(Not implemented yet - manual deployment for now)

---

## Maintenance Schedule

### After Each Deployment
- [ ] Verify https://dna.iyeska.net loads
- [ ] Check PM2 logs for errors
- [ ] Test assessment form functionality
- [ ] Verify database connection

### Weekly
- [ ] Review application logs
- [ ] Check PM2 process uptime
- [ ] Monitor memory/CPU usage

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Update PM2 (`npm install -g pm2@latest`)
- [ ] Review Cloudflare analytics

---

## Support

- **Deployment Logs**: `pm2 logs dna-spectrum`
- **Tunnel Logs**: `sudo journalctl -u cloudflared -f`
- **Database Logs**: `docker logs dna-spectrum-db`
- **Full Infrastructure Guide**: [INFRASTRUCTURE.md](INFRASTRUCTURE.md)
- **GitHub Issues**: https://github.com/guthdx/dna-spectrum/issues
