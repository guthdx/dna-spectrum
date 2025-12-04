/**
 * H2 DNA Spectrum - Database Connection
 *
 * PostgreSQL connection pool for assessment storage
 */

import { Pool, QueryResult } from 'pg';
import type {
  Assessment,
  AssessmentResult,
  AssessmentResponse,
  ArchetypeScores,
  DualStateProfile,
  Interpretation,
} from '@/types';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Save assessment to database
 */
export async function saveAssessment(
  result: AssessmentResult
): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO assessments (
        id,
        client_name,
        client_email,
        responses,
        scores,
        profile_data,
        interpretation,
        completed_at,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      result.id,
      result.clientName || null,
      result.clientEmail || null,
      JSON.stringify(result.responses),
      JSON.stringify(result.scores),
      JSON.stringify(result.profile),
      JSON.stringify(result.interpretation),
      result.completedAt,
      'completed',
    ];

    const res = await client.query(query, values);

    await client.query('COMMIT');
    return res.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving assessment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get assessment by ID
 */
export async function getAssessmentById(
  id: string
): Promise<AssessmentResult | null> {
  try {
    const query = `
      SELECT
        id,
        client_name,
        client_email,
        responses,
        scores,
        profile_data,
        interpretation,
        completed_at,
        share_token
      FROM assessments
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      responses: row.responses as AssessmentResponse[],
      scores: row.scores as ArchetypeScores,
      profile: row.profile_data as DualStateProfile,
      interpretation: row.interpretation as Interpretation,
      completedAt: row.completed_at,
      shareToken: row.share_token,
    };
  } catch (error) {
    console.error('Error getting assessment:', error);
    throw error;
  }
}

/**
 * Get all assessments (with optional filters)
 */
export async function getAssessments(options?: {
  coachId?: string;
  limit?: number;
  offset?: number;
}): Promise<Assessment[]> {
  try {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = `
      SELECT
        id,
        coach_id,
        client_name,
        client_email,
        responses,
        scores,
        profile_data,
        share_token,
        status,
        completed_at,
        created_at
      FROM assessments
    `;

    const values: any[] = [];
    const conditions: string[] = [];

    if (options?.coachId) {
      conditions.push(`coach_id = $${values.length + 1}`);
      values.push(options.coachId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return result.rows.map((row) => ({
      id: row.id,
      coachId: row.coach_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      responses: row.responses,
      scores: row.scores,
      profileData: row.profile_data,
      shareToken: row.share_token,
      status: row.status,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error getting assessments:', error);
    throw error;
  }
}

/**
 * Delete assessment by ID
 */
export async function deleteAssessment(id: string): Promise<boolean> {
  try {
    const query = 'DELETE FROM assessments WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
}

/**
 * Get assessment statistics
 */
export async function getAssessmentStats(): Promise<{
  total: number;
  thisWeek: number;
  thisMonth: number;
}> {
  try {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month
      FROM assessments
      WHERE status = 'completed'
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      thisWeek: parseInt(row.this_week),
      thisMonth: parseInt(row.this_month),
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
