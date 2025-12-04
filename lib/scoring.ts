/**
 * H2 DNA Spectrum - Scoring Engine
 *
 * Calculates archetype scores and Dual State profiles from assessment responses
 */

import {
  AssessmentResponse,
  ArchetypeScores,
  DualStateProfile,
  ProfileType,
} from '@/types';
import { QUESTION_ARCHETYPE_MAP } from './questions';

/**
 * Calculate average of an array of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Round to 2 decimal places
 */
function round(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate archetype scores from responses
 *
 * Each archetype is the average of 5 questions (scale 1-5)
 */
export function calculateArchetypeScores(
  responses: AssessmentResponse[]
): ArchetypeScores {
  // Group responses by archetype
  const archetypeResponses: Record<string, number[]> = {
    competitiveDrivers: [],
    adaptiveMovers: [],
    disruptiveInnovators: [],
    relationalHarmonizers: [],
    groundedProtectors: [],
    structuredStrategists: [],
  };

  // Distribute each response to its archetype
  responses.forEach(({ questionId, score }) => {
    const archetype = QUESTION_ARCHETYPE_MAP[questionId];
    if (archetype && archetypeResponses[archetype]) {
      archetypeResponses[archetype].push(score);
    }
  });

  // Calculate averages
  return {
    competitiveDrivers: round(average(archetypeResponses.competitiveDrivers)),
    adaptiveMovers: round(average(archetypeResponses.adaptiveMovers)),
    disruptiveInnovators: round(average(archetypeResponses.disruptiveInnovators)),
    relationalHarmonizers: round(average(archetypeResponses.relationalHarmonizers)),
    groundedProtectors: round(average(archetypeResponses.groundedProtectors)),
    structuredStrategists: round(average(archetypeResponses.structuredStrategists)),
  };
}

/**
 * Calculate Dual State profile from archetype scores
 */
export function calculateDualStateProfile(
  scores: ArchetypeScores
): DualStateProfile {
  // Calculate dominance (average of Competitive Drivers + Disruptive Innovators)
  const dominance =
    (scores.competitiveDrivers + scores.disruptiveInnovators) / 2;

  // Calculate adaptiveness (average of Adaptive Movers + Relational Harmonizers)
  const adaptiveness =
    (scores.adaptiveMovers + scores.relationalHarmonizers) / 2;

  // Convert 1-5 scale to 0-10 scale
  // Formula: (score - 1) * 2.5
  // 1.0 → 0, 3.0 → 5, 5.0 → 10
  const dominanceScore = Math.round((dominance - 1) * 2.5);
  const adaptivenessScore = Math.round((adaptiveness - 1) * 2.5);

  // Determine if Dual State (both high and balanced)
  const isDualState =
    dominance >= 3.5 &&
    adaptiveness >= 3.5 &&
    Math.abs(dominance - adaptiveness) <= 0.5;

  // Determine profile type
  const profileType = determineProfileType(
    dominance,
    adaptiveness,
    scores,
    isDualState
  );

  // Get profile name
  const profileName = getProfileName(profileType, isDualState);

  // Get primary and secondary archetypes
  const { primary, secondary } = getPrimaryArchetypes(scores);

  return {
    profileName,
    dominanceScore,
    adaptivenessScore,
    primaryArchetypes: primary,
    secondaryArchetypes: secondary,
    isDualState,
  };
}

/**
 * Determine profile type based on scores
 */
function determineProfileType(
  dominance: number,
  adaptiveness: number,
  scores: ArchetypeScores,
  isDualState: boolean
): ProfileType {
  // Dual State: High in both dominance and adaptiveness
  if (isDualState) {
    return 'adaptive-driver';
  }

  // Pure Driver: High dominance, lower adaptiveness
  if (dominance >= 4.0 && adaptiveness < 3.5) {
    return 'pure-driver';
  }

  // Pure Adapter: High adaptiveness, lower dominance
  if (adaptiveness >= 4.0 && dominance < 3.5) {
    return 'pure-adapter';
  }

  // Grounded Protector: High in protection
  if (scores.groundedProtectors >= 4.0) {
    return 'grounded-protector';
  }

  // Strategic Innovator: High in both innovation and strategy
  if (
    scores.disruptiveInnovators >= 4.0 &&
    scores.structuredStrategists >= 4.0
  ) {
    return 'strategic-innovator';
  }

  // Default: Balanced Observer
  return 'balanced-observer';
}

/**
 * Get human-readable profile name
 */
function getProfileName(profileType: ProfileType, isDualState: boolean): string {
  const names: Record<ProfileType, string> = {
    'adaptive-driver': 'Adaptive Driver',
    'pure-driver': 'Competitive Driver',
    'pure-adapter': 'Adaptive Harmonizer',
    'grounded-protector': 'Grounded Protector',
    'strategic-innovator': 'Strategic Innovator',
    'balanced-observer': 'Balanced Observer',
  };

  return names[profileType];
}

/**
 * Get primary and secondary animal archetypes based on scores
 */
function getPrimaryArchetypes(scores: ArchetypeScores): {
  primary: string[];
  secondary: string[];
} {
  // Sort archetypes by score
  const sorted = Object.entries(scores)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);

  // Map to animal names
  const animalMap: Record<string, string[]> = {
    competitiveDrivers: ['Ram', 'Eagle'],
    adaptiveMovers: ['Antelope'],
    disruptiveInnovators: ['Coyote'],
    relationalHarmonizers: ['Deer'],
    groundedProtectors: ['Buffalo', 'Bear'],
    structuredStrategists: ['Owl', 'Fox'],
  };

  // Primary: Top 2 archetypes (score >= 3.5)
  const primaryArchetypes = sorted
    .filter((item) => item.value >= 3.5)
    .slice(0, 2)
    .flatMap((item) => animalMap[item.key] || []);

  // Secondary: Next 2 archetypes (score >= 3.0)
  const secondaryArchetypes = sorted
    .filter((item) => item.value >= 3.0 && item.value < 3.5)
    .slice(0, 2)
    .flatMap((item) => animalMap[item.key] || []);

  return {
    primary: primaryArchetypes,
    secondary: secondaryArchetypes,
  };
}

/**
 * Validate Jake's example scores
 * Expected:
 * - Competitive Drivers: 4.25
 * - Adaptive Movers: 4.2
 * - Disruptive Innovators: 4.0
 * - Relational Harmonizers: 4.0
 * - Grounded Protectors: 3.8
 * - Structured Strategists: 3.25
 */
export function testJakesScores(): void {
  // Jake's responses (inferred from his scores)
  const jakesResponses: AssessmentResponse[] = [
    // Competitive Drivers (Q1, 5, 9, 25, 28): avg 4.25 → 5,5,4,4,4
    { questionId: 1, score: 5 },
    { questionId: 5, score: 5 },
    { questionId: 9, score: 4 },
    { questionId: 25, score: 4 },
    { questionId: 28, score: 4 },

    // Adaptive Movers (Q3, 7, 20, 26, 27): avg 4.2 → 4,5,4,4,4
    { questionId: 3, score: 4 },
    { questionId: 7, score: 5 },
    { questionId: 20, score: 4 },
    { questionId: 26, score: 4 },
    { questionId: 27, score: 4 },

    // Disruptive Innovators (Q13, 14, 16, 22, 24): avg 4.0 → all 4s
    { questionId: 13, score: 4 },
    { questionId: 14, score: 4 },
    { questionId: 16, score: 4 },
    { questionId: 22, score: 4 },
    { questionId: 24, score: 4 },

    // Relational Harmonizers (Q2, 15, 17, 19, 21): avg 4.0 → all 4s
    { questionId: 2, score: 4 },
    { questionId: 15, score: 4 },
    { questionId: 17, score: 4 },
    { questionId: 19, score: 4 },
    { questionId: 21, score: 4 },

    // Grounded Protectors (Q11, 18, 23, 29, 30): avg 3.8 → 3,4,4,4,4
    { questionId: 11, score: 3 },
    { questionId: 18, score: 4 },
    { questionId: 23, score: 4 },
    { questionId: 29, score: 4 },
    { questionId: 30, score: 4 },

    // Structured Strategists (Q4, 6, 8, 10, 12): avg 3.25 → 3,3,3,3,4
    { questionId: 4, score: 3 },
    { questionId: 6, score: 3 },
    { questionId: 8, score: 3 },
    { questionId: 10, score: 3 },
    { questionId: 12, score: 4 },
  ];

  const scores = calculateArchetypeScores(jakesResponses);
  const profile = calculateDualStateProfile(scores);

  console.log('=== Jake\'s Test Results ===');
  console.log('Archetype Scores:', scores);
  console.log('Expected: CD=4.25, AM=4.2, DI=4.0, RH=4.0, GP=3.8, SS=3.25');
  console.log('\nProfile:', profile);
  console.log('Expected: Adaptive Driver, Dom=7, Adapt=7, Dual State=true');
}
