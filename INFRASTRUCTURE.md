# DNA Spectrum Infrastructure Guide

This document covers production infrastructure setup for the DNA Spectrum assessment tool.

## Table of Contents

1. [Server Setup](#server-setup)
2. [Automated Backups](#automated-backups)
3. [Health Monitoring](#health-monitoring)
4. [Security Hardening](#security-hardening)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Server Setup

**Host**: Ubuntu server at 192.168.11.20
**Database**: PostgreSQL 16 in Docker
**Container**: `dna-spectrum-db`
**Database Name**: `dna_spectrum`

### Directory Structure

```
/home/guthdx/
├── dna-spectrum/              # Database runtime
│   ├── docker-compose.yml
│   ├── schema.sql
│   └── backups/              # Daily backups (30-day retention)
│
└── dna-spectrum-app/         # Repository clone
    ├── scripts/              # Infrastructure scripts
    └── logs/                 # Application logs
```

---

## Automated Backups

### Backup System

**Script**: `scripts/backup-database.sh`

**Features**:
- Daily automated backups at 2:00 AM
- 30-day retention policy (automatic cleanup)
- Compressed SQL dumps (gzip)
- Integrity checking
- Detailed logging

**Backup Location**: `/home/guthdx/dna-spectrum/backups/`

**Backup Format**: `dna_spectrum_YYYYMMDD_HHMMSS.sql.gz`

### Manual Backup

```bash
cd ~/dna-spectrum-app/scripts
./backup-database.sh
```

### Restore from Backup

```bash
# List available backups
./restore-database.sh

# Restore specific backup (with safety backup)
./restore-database.sh /home/guthdx/dna-spectrum/backups/dna_spectrum_20251203_020000.sql.gz
```

**Safety Features**:
- Creates pre-restore safety backup
- Requires explicit confirmation
- Automatic rollback on failure

### Verify Backups

```bash
# Check latest backup
ls -lh /home/guthdx/dna-spectrum/backups/ | tail -1

# Test backup integrity
gunzip -t /home/guthdx/dna-spectrum/backups/dna_spectrum_20251203_020000.sql.gz
```

---

## Health Monitoring

### Health Check System

**Script**: `scripts/health-check.sh`

**Monitors**:
- PostgreSQL container status and health
- Database connectivity and query performance
- Disk usage (alerts at 80%)
- Container resource usage (CPU, memory)
- Database statistics (size, record counts)
- Backup status (warns if > 2 days old)

**Automated Checks**: Every 10 minutes via cron

### Manual Health Check

```bash
cd ~/dna-spectrum-app/scripts
./health-check.sh
```

### Health Check with Alerting

```bash
# Enable alerts to n8n webhook
./health-check.sh --alert
```

**To enable alerts**:
1. Uncomment `N8N_WEBHOOK` in `health-check.sh`
2. Set webhook URL: `https://n8n.iyeska.net/webhook/dna-spectrum-alerts`
3. Create n8n workflow to handle alerts → Slack

### View Logs

```bash
# Backup logs
tail -f ~/dna-spectrum-app/logs/backup.log

# Health check logs
tail -f ~/dna-spectrum-app/logs/health.log
```

---

## Security Hardening

### 1. Network Security

**Current State**:
- PostgreSQL exposed on `0.0.0.0:5432` (all interfaces)
- Protected by NetBird VPN mesh network
- Only accessible from NetBird-connected machines

**Recommended (Production)**:

Edit `~/dna-spectrum/docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "192.168.11.20:5432:5432"  # Bind to specific IP only
```

Then restart:
```bash
cd ~/dna-spectrum
docker compose down
docker compose up -d
```

**Firewall Rules (Optional)**:

```bash
# Allow only from NetBird subnet
sudo ufw allow from 100.64.0.0/10 to any port 5432 proto tcp

# Or specific IPs
sudo ufw allow from YOUR_MAC_IP to any port 5432 proto tcp
```

### 2. Application Database User

**Create less-privileged user** for the Next.js application:

```bash
cd ~/dna-spectrum-app/scripts
./create-app-user.sh "your_secure_password_here"
```

This creates user `dna_app` with:
- ✅ Read/write access to tables (SELECT, INSERT, UPDATE, DELETE)
- ✅ Can use sequences (auto-generated IDs)
- ❌ Cannot create/drop tables or schemas
- ❌ Cannot access system catalogs

**Connection String** (for Next.js `.env.local`):
```
DATABASE_URL="postgresql://dna_app:PASSWORD@192.168.11.20:5432/dna_spectrum"
```

### 3. PostgreSQL Configuration

**Security Settings** (already configured in Docker image):
- SSL: Disabled (protected by NetBird VPN tunnel)
- Max connections: 100 (default)
- Authentication: Password (md5)

**Access Control** (`pg_hba.conf`):
```
# Default PostgreSQL Docker settings
host    all             all             all                 md5
```

**To restrict further** (if needed):

```bash
# Access container
docker exec -it dna-spectrum-db bash

# Edit pg_hba.conf
echo "host    dna_spectrum    dna_app    100.64.0.0/10    md5" >> /var/lib/postgresql/data/pgdata/pg_hba.conf

# Reload configuration
docker exec dna-spectrum-db psql -U postgres -c "SELECT pg_reload_conf();"
```

### 4. Environment Variables

**Secure Secrets Management**:

On server (`~/dna-spectrum/.env`):
```bash
POSTGRES_PASSWORD=dna_spectrum_2024
```

On Mac (Next.js `.env.local`):
```bash
DATABASE_URL=postgresql://dna_app:PASSWORD@192.168.11.20:5432/dna_spectrum
```

**Never commit**:
- `.env` files
- Passwords in configuration files
- Database credentials

---

## Deployment

### Systemd Service

**Install** (enables auto-start on boot):

```bash
cd ~/dna-spectrum-app/scripts
sudo ./install-systemd-service.sh
```

**Service Commands**:

```bash
# Start database
sudo systemctl start dna-spectrum-db

# Stop database
sudo systemctl stop dna-spectrum-db

# Restart database
sudo systemctl restart dna-spectrum-db

# Check status
sudo systemctl status dna-spectrum-db

# View logs
sudo journalctl -u dna-spectrum-db -f
```

**Auto-Restart**: Service automatically restarts on failure (10s delay)

### Log Rotation

**Install**:

```bash
cd ~/dna-spectrum-app/scripts
sudo ./install-logrotate.sh
```

**Configuration**:
- Application logs: Rotated daily, 30-day retention
- Docker container logs: Rotated daily, 7-day retention
- Logs compressed after rotation

**Manual rotation**:
```bash
sudo logrotate -f /etc/logrotate.d/dna-spectrum-logs
```

### Cron Jobs

**Install**:

```bash
cd ~/dna-spectrum-app/scripts
./setup-cron.sh
```

**Scheduled Tasks**:
- Daily backups: 2:00 AM
- Health checks: Every 10 minutes

**View crontab**:
```bash
crontab -l | grep dna-spectrum
```

---

## Cloudflare Tunnel Setup

To expose the Next.js app at `https://dna.iyeska.net`:

### 1. Add Tunnel Ingress Rule

Edit `~/.cloudflared/config.yml`:

```yaml
tunnel: 1e02b2ec-7f02-4cf5-962f-0db3558e270c
credentials-file: /home/guthdx/.cloudflared/1e02b2ec-7f02-4cf5-962f-0db3558e270c.json

ingress:
  # DNA Spectrum Next.js App
  - hostname: dna.iyeska.net
    service: http://localhost:3000

  # ... existing services ...

  # Catch-all rule (must be last)
  - service: http_status:404
```

### 2. Configure DNS

In Cloudflare dashboard:
1. Go to DNS settings for `iyeska.net`
2. Add CNAME record:
   - Name: `dna`
   - Target: `1e02b2ec-7f02-4cf5-962f-0db3558e270c.cfargotunnel.com`
   - Proxy: Enabled (orange cloud)

### 3. Restart Tunnel

```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -f
```

### 4. Verify

```bash
curl -I https://dna.iyeska.net
```

**Note**: Next.js app must be running on `localhost:3000` for tunnel to work.

---

## Troubleshooting

### Database Won't Start

```bash
# Check container status
docker ps -a | grep dna-spectrum

# View logs
docker logs dna-spectrum-db

# Check if port is in use
sudo lsof -i :5432

# Restart container
cd ~/dna-spectrum
docker compose restart
```

### Connection Refused from Mac

**Checklist**:
1. Is container running? `docker ps | grep dna-spectrum`
2. Is NetBird connected? `netbird status`
3. Can you ping server? `ping 192.168.11.20`
4. Is port open? `nc -zv 192.168.11.20 5432`

**Test connection**:
```bash
# From Mac
psql "postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum" -c "SELECT 1;"
```

### Backup Failures

```bash
# Check backup logs
tail -50 ~/dna-spectrum-app/logs/backup.log

# Check disk space
df -h

# Verify backup directory permissions
ls -ld /home/guthdx/dna-spectrum/backups

# Manual backup test
cd ~/dna-spectrum-app/scripts
./backup-database.sh
```

### Health Check Issues

```bash
# Run manual check
cd ~/dna-spectrum-app/scripts
./health-check.sh

# Check cron logs
grep dna-spectrum /var/log/syslog
```

### Performance Issues

```bash
# Check container resources
docker stats dna-spectrum-db

# Check database size
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c \
  "SELECT pg_size_pretty(pg_database_size('dna_spectrum'));"

# Check active connections
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'dna_spectrum';"

# View slow queries (if enabled)
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c \
  "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## Maintenance Checklist

### Daily (Automated)
- ✅ Database backup (2:00 AM)
- ✅ Health checks (every 10 minutes)

### Weekly (Manual)
- [ ] Review health check logs
- [ ] Verify backups are working
- [ ] Check disk usage trends

### Monthly (Manual)
- [ ] Test backup restoration
- [ ] Review security logs
- [ ] Update Docker images if needed
- [ ] Clean up old logs manually (if needed)

---

## Support

For infrastructure issues, contact:
- **GitHub**: https://github.com/guthdx/dna-spectrum
- **Server**: 192.168.11.20 (NetBird VPN required)
