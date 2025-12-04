# DNA Spectrum - Quick Reference Guide

**Ubuntu Server**: 192.168.11.20 (NetBird VPN required)
**Last Updated**: December 3, 2025

---

## Database Connection

```bash
# From Mac (development)
DATABASE_URL="postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum"

# Test connection
psql "postgresql://postgres:dna_spectrum_2024@192.168.11.20:5432/dna_spectrum" -c "SELECT version();"
```

---

## Common Commands

### Health & Status

```bash
# Quick health check
cd ~/dna-spectrum-app/scripts && ./health-check.sh

# Container status
docker ps | grep dna-spectrum

# Database connection test
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "SELECT current_database();"

# View logs
docker logs -f dna-spectrum-db
tail -f ~/dna-spectrum-app/logs/backup.log
tail -f ~/dna-spectrum-app/logs/health.log
```

### Backup & Restore

```bash
# Create backup manually
cd ~/dna-spectrum-app/scripts && ./backup-database.sh

# List available backups
./restore-database.sh

# Restore from backup
./restore-database.sh /home/guthdx/dna-spectrum/backups/dna_spectrum_YYYYMMDD_HHMMSS.sql.gz
```

### Database Management

```bash
# Access PostgreSQL shell
docker exec -it dna-spectrum-db psql -U postgres -d dna_spectrum

# Run SQL file
docker exec -i dna-spectrum-db psql -U postgres -d dna_spectrum < schema.sql

# Database statistics
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Container Management

```bash
# Start/stop/restart
cd ~/dna-spectrum && docker compose up -d
cd ~/dna-spectrum && docker compose down
cd ~/dna-spectrum && docker compose restart

# View resource usage
docker stats dna-spectrum-db

# Update container
cd ~/dna-spectrum
docker compose pull
docker compose up -d
```

---

## Automated Tasks (Cron)

```
0 2 * * *    Daily backup at 2:00 AM
*/10 * * *   Health check every 10 minutes
```

View cron jobs: `crontab -l | grep dna-spectrum`

---

## Security

### Create Production App User

```bash
# On Ubuntu server
cd ~/dna-spectrum-app/scripts
./create-app-user.sh "YOUR_SECURE_PASSWORD_16_CHARS_MIN"

# On Mac - update .env.local
DATABASE_URL="postgresql://dna_app:PASSWORD@192.168.11.20:5432/dna_spectrum"
```

### Network Security

**Current**: Port 5432 exposed on all interfaces (0.0.0.0)
**Protected by**: NetBird VPN mesh network

**To restrict** (optional):
```bash
# Edit docker-compose.yml
cd ~/dna-spectrum
nano docker-compose.yml

# Change:
ports:
  - "192.168.11.20:5432:5432"  # Bind to specific IP only

# Restart
docker compose down && docker compose up -d
```

---

## Optional Installations

### Systemd Service (auto-start on boot)

```bash
cd ~/dna-spectrum-app/scripts
sudo ./install-systemd-service.sh

# Then manage with:
sudo systemctl start dna-spectrum-db
sudo systemctl stop dna-spectrum-db
sudo systemctl restart dna-spectrum-db
sudo systemctl status dna-spectrum-db
```

### Log Rotation (compress old logs)

```bash
cd ~/dna-spectrum-app/scripts
sudo ./install-logrotate.sh

# Test rotation
sudo logrotate -f /etc/logrotate.d/dna-spectrum-logs
```

---

## Cloudflare Tunnel (dna.iyeska.net)

When Next.js app is ready to deploy:

1. **Edit tunnel config**:
   ```bash
   nano ~/.cloudflared/config.yml
   ```

2. **Add ingress** (above catch-all):
   ```yaml
   - hostname: dna.iyeska.net
     service: http://localhost:3000
   ```

3. **Restart tunnel**:
   ```bash
   sudo systemctl restart cloudflared
   ```

4. **Add DNS** in Cloudflare dashboard:
   - Type: CNAME
   - Name: dna
   - Target: 1e02b2ec-7f02-4cf5-962f-0db3558e270c.cfargotunnel.com
   - Proxy: Enabled

---

## Troubleshooting

### Can't connect from Mac

```bash
# 1. Check NetBird
netbird status

# 2. Test connectivity
ping 192.168.11.20
nc -zv 192.168.11.20 5432

# 3. Check container
ssh guthdx@192.168.11.20
docker ps | grep dna-spectrum

# 4. Check logs
docker logs dna-spectrum-db
```

### Backup failed

```bash
# Check logs
tail -50 ~/dna-spectrum-app/logs/backup.log

# Check disk space
df -h

# Test manually
cd ~/dna-spectrum-app/scripts && ./backup-database.sh
```

### Database slow

```bash
# Check connections
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check table sizes
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c \
  "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
   FROM pg_tables WHERE schemaname = 'public';"

# Vacuum database
docker exec dna-spectrum-db psql -U postgres -d dna_spectrum -c "VACUUM ANALYZE;"
```

---

## File Locations

```
/home/guthdx/
├── dna-spectrum/                      # Database runtime
│   ├── docker-compose.yml
│   ├── schema.sql
│   └── backups/                       # Daily backups
│
└── dna-spectrum-app/                  # Git repository
    ├── scripts/                       # Infrastructure scripts
    │   ├── backup-database.sh         ✅ Executable
    │   ├── restore-database.sh        ✅ Executable
    │   ├── health-check.sh            ✅ Executable
    │   ├── create-app-user.sh         ✅ Executable
    │   ├── setup-cron.sh              ✅ Installed
    │   ├── install-systemd-service.sh ⚠️  Not installed
    │   └── install-logrotate.sh       ⚠️  Not installed
    │
    ├── logs/                          # Application logs
    │   ├── backup.log                 ✅ Active
    │   └── health.log                 ✅ Active
    │
    └── docs/                          # Documentation
        ├── INFRASTRUCTURE.md          📖 Full guide
        ├── UBUNTU_SERVER_SETUP.md     📖 Setup summary
        └── QUICK_REFERENCE.md         📖 This file
```

---

## Emergency Procedures

### Database corrupted

```bash
# 1. Stop container
cd ~/dna-spectrum && docker compose down

# 2. Restore from backup
cd ~/dna-spectrum-app/scripts
./restore-database.sh /home/guthdx/dna-spectrum/backups/LATEST_BACKUP.sql.gz

# 3. Restart container
cd ~/dna-spectrum && docker compose up -d
```

### Disk full

```bash
# 1. Check disk usage
df -h
du -sh /home/guthdx/dna-spectrum/backups/*

# 2. Remove old backups (manually)
cd /home/guthdx/dna-spectrum/backups
ls -lt
rm dna_spectrum_YYYYMMDD_HHMMSS.sql.gz  # Delete specific backup

# 3. Check Docker usage
docker system df
docker system prune -a  # Remove unused images/containers
```

### Container won't start

```bash
# Check logs
docker logs dna-spectrum-db

# Check if port is in use
sudo lsof -i :5432

# Remove and recreate
cd ~/dna-spectrum
docker compose down -v  # WARNING: Removes volumes!
docker compose up -d
# Then restore from backup
```

---

## Monitoring & Alerts (Optional)

### Enable n8n Alerts

1. **Create n8n webhook** at `https://n8n.iyeska.net`:
   - Trigger: Webhook
   - Path: `dna-spectrum-alerts`
   - Connect to Slack node

2. **Edit health-check.sh**:
   ```bash
   nano ~/dna-spectrum-app/scripts/health-check.sh

   # Uncomment and set:
   N8N_WEBHOOK="https://n8n.iyeska.net/webhook/dna-spectrum-alerts"
   ```

3. **Test alert**:
   ```bash
   cd ~/dna-spectrum-app/scripts
   ./health-check.sh --alert
   ```

---

## Maintenance Schedule

### Daily (Automated)
- ✅ Database backup at 2:00 AM
- ✅ Health checks every 10 minutes

### Weekly
- [ ] Review backup logs
- [ ] Check disk usage trends
- [ ] Verify latest backup works

### Monthly
- [ ] Test disaster recovery
- [ ] Review security settings
- [ ] Update Docker images
- [ ] Clean up old logs

---

## Support

- **Full Docs**: [INFRASTRUCTURE.md](INFRASTRUCTURE.md)
- **Setup Guide**: [UBUNTU_SERVER_SETUP.md](UBUNTU_SERVER_SETUP.md)
- **GitHub**: https://github.com/guthdx/dna-spectrum
- **Issues**: https://github.com/guthdx/dna-spectrum/issues
