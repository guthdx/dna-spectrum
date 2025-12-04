#!/bin/bash

# H2 DNA Spectrum - Database Setup Script
#
# This script creates the database and applies the schema

set -e

echo "🗄️  H2 DNA Spectrum - Database Setup"
echo "===================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable not set"
  echo ""
  echo "Please set DATABASE_URL in your environment or .env file:"
  echo "export DATABASE_URL='postgresql://user:password@192.168.11.20:5432/dna_spectrum'"
  echo ""
  exit 1
fi

echo "📡 Database URL: $DATABASE_URL"
echo ""

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "📊 Database name: $DB_NAME"
echo ""

# Test connection
echo "🔌 Testing database connection..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Database connection successful"
else
  echo "❌ Failed to connect to database"
  echo ""
  echo "Please check:"
  echo "1. PostgreSQL is running on 192.168.11.20"
  echo "2. Database '$DB_NAME' exists"
  echo "3. User credentials are correct"
  echo "4. Network connectivity (NetBird VPN if needed)"
  exit 1
fi

echo ""
echo "📋 Applying database schema..."
psql "$DATABASE_URL" -f schema.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema applied successfully"
else
  echo "❌ Failed to apply schema"
  exit 1
fi

echo ""
echo "🔍 Verifying tables..."
psql "$DATABASE_URL" -c "\dt" | grep -E "(coaches|assessments|reports)"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with DATABASE_URL"
echo "2. Run: npm run dev"
echo "3. Take an assessment to test database integration"
echo ""
