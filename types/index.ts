/**
 * H2 DNA Spectrum - Type Definitions
 *
 * Core types for the personality assessment system
 */

// ============================================================================
// ARCHETYPES
// ============================================================================

export type ArchetypeKey =
  | 'competitiveDrivers'
  | 'adaptiveMovers'
  | 'disruptiveInnovators'
  | 'relationalHarmonizers'
  | 'groundedProtectors'
  | 'structuredStrategists';

export interface ArchetypeScores {
  competitiveDrivers: number;        // Ram/Eagle (1-5)
  adaptiveMovers: number;             // Antelope (1-5)
  disruptiveInnovators: number;       // Coyote (1-5)
  relationalHarmonizers: number;      // Deer (1-5)
  groundedProtectors: number;         // Buffalo/Bear (1-5)
  structuredStrategists: number;      // Owl/Fox (1-5)
}

export const ARCHETYPE_LABELS: Record<ArchetypeKey, string> = {
  competitiveDrivers: 'Competitive Drivers',
  adaptiveMovers: 'Adaptive Movers',
  disruptiveInnovators: 'Disruptive Innovators',
  relationalHarmonizers: 'Relational Harmonizers',
  groundedProtectors: 'Grounded Protectors',
  structuredStrategists: 'Structured Strategists',
};

export const ARCHETYPE_ANIMALS: Record<ArchetypeKey, string> = {
  competitiveDrivers: 'Ram / Eagle',
  adaptiveMovers: 'Antelope',
  disruptiveInnovators: 'Coyote',
  relationalHarmonizers: 'Deer',
  groundedProtectors: 'Buffalo / Bear',
  structuredStrategists: 'Owl / Fox',
};

// ============================================================================
// ASSESSMENT QUESTIONS
// ============================================================================

export interface Question {
  id: number;                          // 1-30
  text: string;                        // Question text
  category: QuestionCategory;          // Display grouping
  archetype: ArchetypeKey;             // Maps to archetype score
}

export type QuestionCategory =
  | 'instinct'                         // Instinct & Regulation (Q1-8)
  | 'pressure'                         // Pressure & Control (Q9-16)
  | 'connection'                       // Connection & Safety (Q17-24)
  | 'focus';                           // Focus & Adaptation (Q25-30)

export interface AssessmentResponse {
  questionId: number;                  // 1-30
  score: number;                       // 1-5
}

// ============================================================================
// DUAL STATE PROFILE
// ============================================================================

export interface DualStateProfile {
  profileName: string;                 // e.g., "Adaptive Driver"
  dominanceScore: number;              // 0-10 scale
  adaptivenessScore: number;           // 0-10 scale
  primaryArchetypes: string[];         // Top 2-3 animal archetypes
  secondaryArchetypes: string[];       // Supporting archetypes
  isDualState: boolean;                // Both scores >= 3.5 and within 0.5
}

export type ProfileType =
  | 'adaptive-driver'                  // High Dom + High Adapt
  | 'pure-driver'                      // High Dom, Low Adapt
  | 'pure-adapter'                     // Low Dom, High Adapt
  | 'balanced-observer'                // Moderate both
  | 'grounded-protector'               // High Protection
  | 'strategic-innovator';             // High Innovation + Strategy

// ============================================================================
// ASSESSMENT RESULT
// ============================================================================

export interface AssessmentResult {
  id: string;                          // UUID
  clientName?: string;
  clientEmail?: string;
  responses: AssessmentResponse[];
  scores: ArchetypeScores;
  profile: DualStateProfile;
  interpretation: Interpretation;
  completedAt: Date;
  shareToken?: string;                 // For shareable links
}

export interface Interpretation {
  coreInstinct: string;                // Main behavioral description
  behavioralSignature: string[];       // Key behaviors (bullets)
  strengths: string[];                 // Core strengths
  watchOuts: string[];                 // Areas to monitor
  dualStateCue?: string;               // Coaching tip
  toLeadYourself: string[];            // Self-leadership guidance
  toPartnerWithOthers: string[];       // Collaboration guidance
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Coach {
  id: string;
  email: string;
  name: string;
  organization?: string;
  createdAt: Date;
}

export interface Assessment {
  id: string;
  coachId?: string;
  clientName: string;
  clientEmail?: string;
  responses: AssessmentResponse[];
  scores?: ArchetypeScores;
  profileData?: DualStateProfile;
  shareToken?: string;
  status: 'pending' | 'completed';
  completedAt?: Date;
  createdAt: Date;
}

export interface Report {
  id: string;
  assessmentId: string;
  pdfPath: string;
  generatedAt: Date;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface AssessmentFormData {
  clientName?: string;
  responses: Record<number, number>;   // questionId -> score
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SubmitAssessmentRequest {
  clientName?: string;
  clientEmail?: string;
  responses: AssessmentResponse[];
}

export interface SubmitAssessmentResponse {
  assessmentId: string;
  result: AssessmentResult;
}

export interface GeneratePDFRequest {
  assessmentId: string;
}

export interface GeneratePDFResponse {
  pdfUrl: string;
}
