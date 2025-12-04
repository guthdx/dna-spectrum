# PostgreSQL Database Setup

This guide will help you set up the PostgreSQL database for the DNA Spectrum assessment tool.

## Prerequisites

- PostgreSQL 12+ installed and running
- Access to your PostgreSQL server (192.168.11.20 via NetBird VPN)
- Database user with CREATE DATABASE privileges

## Quick Setup

### 1. Create the Database

Connect to your PostgreSQL server and create the database:

```bash
# Via NetBird VPN
psql -h 192.168.11.20 -U postgres

# Or locally
psql -U postgres
```

```sql
CREATE DATABASE dna_spectrum;
\q
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and update the DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:your_password@192.168.11.20:5432/dna_spectrum
```

**Format**: `postgresql://username:password@host:port/database`

### 3. Run the Setup Script

```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

This script will:
- Test the database connection
- Apply the schema from `schema.sql`
- Create tables: `coaches`, `assessments`, `reports`
- Set up indexes and triggers
- Verify the installation

### 4. Verify Setup

Check that tables were created:

```bash
psql "$DATABASE_URL" -c "\dt"
```

You should see:
- `coaches` - Coach/consultant accounts
- `assessments` - Assessment results
- `reports` - PDF report cache

## Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Apply schema
psql "$DATABASE_URL" -f schema.sql

# Verify tables
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

## Database Schema

### Tables

**coaches**
- `id` (UUID, primary key)
- `email` (TEXT, unique)
- `name` (TEXT)
- `organization` (TEXT, optional)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**assessments**
- `id` (UUID, primary key)
- `coach_id` (UUID, foreign key, optional)
- `client_name` (TEXT, optional)
- `client_email` (TEXT, optional)
- `responses` (JSONB) - 30 question responses
- `scores` (JSONB) - Archetype scores
- `profile_data` (JSONB) - Dual State profile
- `interpretation` (JSONB) - Generated interpretation
- `share_token` (TEXT, unique, optional)
- `status` (TEXT) - 'pending' or 'completed'
- `completed_at`, `created_at`, `updated_at` (TIMESTAMPTZ)

**reports**
- `id` (UUID, primary key)
- `assessment_id` (UUID, foreign key)
- `pdf_path` (TEXT)
- `file_size` (INTEGER)
- `generated_at` (TIMESTAMPTZ)

### Indexes

Optimized for common queries:
- `idx_coaches_email` - Fast email lookups
- `idx_assessments_coach_id` - Coach's assessments
- `idx_assessments_share_token` - Shareable links
- `idx_assessments_created_at` - Recent assessments
- `idx_reports_assessment_id` - PDF lookup

## Testing the Connection

Test if the app can connect:

```bash
npm run dev
```

Check the console for:
```
✅ Assessment saved to database: [UUID]
```

Or if DATABASE_URL is not set:
```
⚠️  Database save failed, continuing without persistence
```

## Troubleshooting

### Connection Refused

**Problem**: `Error: connect ECONNREFUSED`

**Solutions**:
1. Check PostgreSQL is running: `systemctl status postgresql`
2. Verify NetBird VPN is connected
3. Test network: `ping 192.168.11.20`
4. Check PostgreSQL allows remote connections: `postgresql.conf` → `listen_addresses`
5. Check `pg_hba.conf` allows your IP/VPN

### Authentication Failed

**Problem**: `Error: password authentication failed`

**Solutions**:
1. Verify username/password in DATABASE_URL
2. Check `pg_hba.conf` authentication method
3. Reset password: `ALTER USER postgres PASSWORD 'new_password';`

### Database Does Not Exist

**Problem**: `Error: database "dna_spectrum" does not exist`

**Solution**:
```sql
CREATE DATABASE dna_spectrum;
```

### Permission Denied

**Problem**: `Error: permission denied for table assessments`

**Solution**:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

## Backup & Restore

### Backup

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql "$DATABASE_URL" < backup_20231203.sql
```

## Production Considerations

1. **Connection Pooling**: Already configured with `pg` pool (max 20 connections)
2. **SSL**: Enabled in production (see `lib/db.ts`)
3. **Indexes**: Optimized for coach/client queries
4. **Auto-timestamps**: `updated_at` triggers configured
5. **Cascading Deletes**: Reports deleted when assessment deleted

## Useful Queries

### View Recent Assessments

```sql
SELECT
  id,
  client_name,
  (profile_data->>'profileName') as profile,
  created_at
FROM assessments
ORDER BY created_at DESC
LIMIT 10;
```

### Assessment Statistics

```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
FROM assessments
WHERE status = 'completed';
```

### Top Profiles

```sql
SELECT
  profile_data->>'profileName' as profile,
  COUNT(*) as count
FROM assessments
WHERE status = 'completed'
GROUP BY profile_data->>'profileName'
ORDER BY count DESC;
```

## Next Steps

After database setup:
1. ✅ Test by taking an assessment
2. ✅ Verify results are persisted
3. ✅ Check assessments table has data
4. 🔜 Set up coach authentication
5. 🔜 Build coach dashboard

---

**Need Help?**
- Check logs: `docker logs postgres` (if using Docker)
- PostgreSQL docs: https://www.postgresql.org/docs/
- Project issues: https://github.com/guthdx/dna-spectrum/issues
