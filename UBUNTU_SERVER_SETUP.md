# DNA Spectrum - Ubuntu Server Setup Complete ✅

**Server**: Ubuntu 24.04.3 LTS @ 192.168.11.20
**Date**: December 3, 2025
**Status**: Production-ready infrastructure deployed

---

## What's Running

### PostgreSQL Database
- **Container**: `dna-spectrum-db` (PostgreSQL 16-alpine)
- **Status**: Healthy and running
- **Port**: `5432` (exposed on all interfaces)
- **Database**: `dna_spectrum`
- **Admin User**: `postgres` / `dna_spectrum_2024`
- **App User**: Not yet created (run script when needed)

**Current Data**:
- Coaches: 0
- Assessments: 1 (test data)
- Reports: 0
- Database size: 7.8 MB

### Automated Systems

#### Backups ✅
- **Schedule**: Daily at 2:00 AM (cron)
- **Retention**: 30 days
- **Location**: `/home/guthdx/dna-spectrum/backups/`
- **First backup**: Completed successfully (4.0K)
- **Script**: `scripts/backup-database.sh`

#### Health Monitoring ✅
- **Schedule**: Every 10 minutes (cron)
- **Checks**: Container health, database connectivity, disk usage, backup status
- **Alerting**: Optional n8n webhook (not configured yet)
- **Script**: `scripts/health-check.sh`

#### System Management ✅
- **Systemd service**: Available (not yet installed)
- **Log rotation**: Available (not yet installed)
- **Auto-restart**: Enabled via Docker (`restart: unless-stopped`)

---

## For Next.js Development (Mac)

### 1. Clone Repository (if not already done)

```bash
git clone https://github.com/guthdx/dna-spectrum.git
cd dna-spectrum
git pull origin main  # Get latest infrastructure scripts
```

### 2. Create Environment File

Create `.env.local`:

```bash
# For development: Use admin user
DATABASE_URL="postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum"

# For production: Create app user first
# DATABASE_URL="postgresql://dna_app:PASSWORD@192.168.11.20:5432/dna_spectrum"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Test Database Connection

```bash
# Install psql (if needed)
brew install postgresql

# Test connection
psql "postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum" -c "SELECT version();"
```

**Expected output**: PostgreSQL 16.x on Linux

### 4. Install Dependencies & Run

```bash
npm install
npm run dev
```

**Next.js will run on**: `http://localhost:3000`

---

## Creating Production App User (When Ready)

When you're ready to use a less-privileged user:

**On Ubuntu server**:

```bash
cd ~/dna-spectrum-app/scripts
./create-app-user.sh "YOUR_SECURE_PASSWORD_HERE"
```

This creates `dna_app` user with:
- ✅ Read/write access to tables
- ❌ Cannot create/drop schemas
- ❌ Cannot access system catalogs

**On Mac** - update `.env.local`:

```bash
DATABASE_URL="postgresql://dna_app:YOUR_PASSWORD@192.168.11.20:5432/dna_spectrum"
```

---

## Infrastructure Scripts Reference

All scripts are in `scripts/` directory:

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-database.sh` | Manual/automated backups | `./backup-database.sh` |
| `restore-database.sh` | Disaster recovery | `./restore-database.sh [file]` |
| `health-check.sh` | Manual health check | `./health-check.sh` |
| `create-app-user.sh` | Create production user | `./create-app-user.sh "PASSWORD"` |
| `setup-cron.sh` | Install cron jobs | `./setup-cron.sh` ✅ Done |
| `install-systemd-service.sh` | Install systemd service | `sudo ./install-systemd-service.sh` |
| `install-logrotate.sh` | Install log rotation | `sudo ./install-logrotate.sh` |

---

## Optional: Install Systemd Service

For auto-start on boot and better system integration:

```bash
cd ~/dna-spectrum-app/scripts
sudo ./install-systemd-service.sh
```

Then manage with:
```bash
sudo systemctl status dna-spectrum-db
sudo systemctl restart dna-spectrum-db
```

---

## Optional: Cloudflare Tunnel (dna.iyeska.net)

When ready to expose via Cloudflare:

1. **Edit** `~/.cloudflared/config.yml`:
   ```yaml
   ingress:
     - hostname: dna.iyeska.net
       service: http://localhost:3000
     # ... other services ...
     - service: http_status:404
   ```

2. **Add DNS**: CNAME `dna` → `TUNNEL_ID.cfargotunnel.com`

3. **Restart tunnel**: `sudo systemctl restart cloudflared`

---

## Current Cron Jobs

```bash
# Backup at 2 AM daily
0 2 * * * /home/guthdx/dna-spectrum-app/scripts/backup-database.sh

# Health check every 10 minutes
*/10 * * * * /home/guthdx/dna-spectrum-app/scripts/health-check.sh --alert
```

---

## Logs

```bash
# Application logs
tail -f ~/dna-spectrum-app/logs/backup.log
tail -f ~/dna-spectrum-app/logs/health.log

# Container logs
docker logs -f dna-spectrum-db

# Cron logs
grep dna-spectrum /var/log/syslog
```

---

## Quick Health Check

```bash
# Run health check
cd ~/dna-spectrum-app/scripts
./health-check.sh

# Check database connection
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "SELECT COUNT(*) FROM assessments;"

# Check disk usage
df -h /
du -sh /home/guthdx/dna-spectrum/backups/
```

---

## Network Access

**Requirements**:
- ✅ NetBird VPN connected
- ✅ Server at 192.168.11.20 reachable
- ✅ Port 5432 accessible

**Test connectivity**:
```bash
ping 192.168.11.20
nc -zv 192.168.11.20 5432
```

---

## Next Steps for Mac Development

1. ✅ Pull latest code from GitHub
2. ✅ Create `.env.local` with database URL
3. ✅ Test database connection
4. 🔲 Install Next.js dependencies (`npm install`)
5. 🔲 Run development server (`npm run dev`)
6. 🔲 Build assessment form UI
7. 🔲 Test with real assessments
8. 🔲 Generate PDF reports

---

## Full Documentation

See **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)** for complete production deployment guide including:

- Backup and restore procedures
- Security hardening
- Troubleshooting
- Maintenance checklists
- Cloudflare tunnel setup

---

**Infrastructure maintained by Ubuntu server Claude**
**Application development by Mac Claude**

Let's build something great! 🚀
