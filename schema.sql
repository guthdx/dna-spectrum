-- H2 DNA Spectrum - PostgreSQL Database Schema
--
-- This schema supports the assessment system with persistent storage
-- Run this on your PostgreSQL database at 192.168.11.20

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coaches/Consultants Table
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  client_name TEXT,
  client_email TEXT,

  -- Assessment data stored as JSONB for flexibility
  responses JSONB NOT NULL,
  scores JSONB NOT NULL,
  profile_data JSONB NOT NULL,
  interpretation JSONB NOT NULL,

  -- Shareable link token
  share_token TEXT UNIQUE,

  -- Status tracking
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),

  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assessments_coach_id ON assessments(coach_id);
CREATE INDEX IF NOT EXISTS idx_assessments_share_token ON assessments(share_token);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_client_email ON assessments(client_email);

-- PDF Reports Cache Table (optional - for caching generated PDFs)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  pdf_path TEXT,
  file_size INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample query to verify setup
-- SELECT
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- ORDER BY table_name, ordinal_position;

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

COMMENT ON TABLE coaches IS 'Coaches and consultants who use the assessment platform';
COMMENT ON TABLE assessments IS 'Individual assessment results and responses';
COMMENT ON TABLE reports IS 'Cached PDF reports for assessments';

COMMENT ON COLUMN assessments.responses IS '30 question responses as JSON array';
COMMENT ON COLUMN assessments.scores IS 'Calculated archetype scores';
COMMENT ON COLUMN assessments.profile_data IS 'Dual State profile classification';
COMMENT ON COLUMN assessments.interpretation IS 'Generated personality interpretation';
