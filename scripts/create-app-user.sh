#!/bin/bash
#
# Create Application Database User
#
# This script creates a less-privileged PostgreSQL user for the Next.js application
# with appropriate permissions for production use.
#

set -euo pipefail

CONTAINER_NAME="dna-spectrum-db"
DATABASE="dna_spectrum"
ADMIN_USER="postgres"
APP_USER="dna_app"
APP_PASSWORD="${1:-}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if password provided
if [ -z "$APP_PASSWORD" ]; then
    echo ""
    echo "Usage: $0 <password>"
    echo ""
    echo "This script creates a less-privileged database user for the application."
    echo "Provide a strong password as the first argument."
    echo ""
    echo "Example: $0 'my_secure_password_here'"
    echo ""
    exit 1
fi

# Validate password strength (basic check)
if [ ${#APP_PASSWORD} -lt 16 ]; then
    warning "Password should be at least 16 characters for production use."
    read -p "Continue anyway? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        exit 0
    fi
fi

log "Creating application database user..."
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error "Container ${CONTAINER_NAME} is not running!"
    exit 1
fi

# Create user and grant permissions
docker exec "$CONTAINER_NAME" psql -U "$ADMIN_USER" -d "$DATABASE" <<-EOSQL
    -- Create application user
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_USER}') THEN
            CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}';
        ELSE
            ALTER ROLE ${APP_USER} WITH PASSWORD '${APP_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Grant connect privilege
    GRANT CONNECT ON DATABASE ${DATABASE} TO ${APP_USER};

    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO ${APP_USER};

    -- Grant table privileges (SELECT, INSERT, UPDATE, DELETE on all tables)
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};

    -- Grant sequence privileges (for auto-incrementing IDs)
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};

    -- Grant default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};

    -- Explicitly deny dangerous operations
    REVOKE CREATE ON SCHEMA public FROM ${APP_USER};
    REVOKE ALL ON SCHEMA information_schema FROM ${APP_USER};
    REVOKE ALL ON SCHEMA pg_catalog FROM ${APP_USER};

    -- Show granted permissions
    SELECT
        grantee,
        privilege_type
    FROM information_schema.role_table_grants
    WHERE grantee = '${APP_USER}'
    ORDER BY table_name, privilege_type;
EOSQL

if [ $? -eq 0 ]; then
    success "Application user '${APP_USER}' created successfully!"
    echo ""
    log "User permissions:"
    log "  ✓ Can connect to database '${DATABASE}'"
    log "  ✓ Can read/write data in tables (SELECT, INSERT, UPDATE, DELETE)"
    log "  ✓ Can use sequences for auto-generated IDs"
    log "  ✗ Cannot create/drop tables or schemas"
    log "  ✗ Cannot access system catalogs"
    echo ""
    log "Connection string for Next.js:"
    echo ""
    echo "DATABASE_URL=\"postgresql://${APP_USER}:${APP_PASSWORD}@192.168.11.20:5432/${DATABASE}\""
    echo ""
    warning "Store this password securely in your .env.local file on the Mac."
    warning "Do not commit passwords to the repository!"
else
    error "Failed to create application user!"
    exit 1
fi

# Test connection
log "Testing application user connection..."
docker exec "$CONTAINER_NAME" psql -U "$APP_USER" -d "$DATABASE" -c "SELECT current_user, current_database();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Application user can connect successfully!"
else
    error "Application user connection test failed!"
    exit 1
fi
