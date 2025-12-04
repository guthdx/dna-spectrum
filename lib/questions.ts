/**
 * H2 DNA Spectrum - Question Database
 *
 * All 30 questions with archetype mappings
 */

import { Question, ArchetypeKey } from '@/types';

export const QUESTIONS: Question[] = [
  // INSTINCT & REGULATION (Fight / Flight Bias) - Questions 1-8
  {
    id: 1,
    text: "When a problem appears suddenly, my first instinct is to take charge before others do.",
    category: 'instinct',
    archetype: 'competitiveDrivers', // Ram - takes charge
  },
  {
    id: 2,
    text: "I notice subtle shifts in people's mood or energy before they say anything.",
    category: 'instinct',
    archetype: 'relationalHarmonizers', // Deer - empathic awareness
  },
  {
    id: 3,
    text: "I stay calm and focused even when others are panicking.",
    category: 'instinct',
    archetype: 'adaptiveMovers', // Antelope - calm under pressure
  },
  {
    id: 4,
    text: "When things feel uncertain, I prefer to observe before acting.",
    category: 'instinct',
    archetype: 'structuredStrategists', // Owl - observe first
  },
  {
    id: 5,
    text: "If something feels unfair, I can't rest until I confront it directly.",
    category: 'instinct',
    archetype: 'competitiveDrivers', // Ram - confronts unfairness
  },
  {
    id: 6,
    text: "I often sense danger or tension that others seem to miss.",
    category: 'instinct',
    archetype: 'structuredStrategists', // Owl - heightened awareness
  },
  {
    id: 7,
    text: "I thrive when things are changing quickly; routine drains me.",
    category: 'instinct',
    archetype: 'adaptiveMovers', // Antelope - thrives in change
  },
  {
    id: 8,
    text: "I need time alone to think before I commit to an action.",
    category: 'instinct',
    archetype: 'structuredStrategists', // Owl - needs reflection
  },

  // PRESSURE & CONTROL - Questions 9-16
  {
    id: 9,
    text: "I tend to take responsibility when a group loses direction.",
    category: 'pressure',
    archetype: 'competitiveDrivers', // Ram - takes responsibility
  },
  {
    id: 10,
    text: "I get frustrated when plans change without explanation.",
    category: 'pressure',
    archetype: 'structuredStrategists', // Owl - needs structure
  },
  {
    id: 11,
    text: "I find myself protecting people or projects I care about, even when it's not my role.",
    category: 'pressure',
    archetype: 'groundedProtectors', // Buffalo - protective
  },
  {
    id: 12,
    text: "I prefer to master one thing deeply rather than juggle many things superficially.",
    category: 'pressure',
    archetype: 'structuredStrategists', // Owl - depth over breadth
  },
  {
    id: 13,
    text: "I test people or systems to see if they're strong enough to trust.",
    category: 'pressure',
    archetype: 'disruptiveInnovators', // Coyote - tests boundaries
  },
  {
    id: 14,
    text: "When I feel cornered, I either fight back or withdraw completely.",
    category: 'pressure',
    archetype: 'disruptiveInnovators', // Coyote - fight or flight extremes
  },
  {
    id: 15,
    text: "I often take the role of peacekeeper when others argue.",
    category: 'pressure',
    archetype: 'relationalHarmonizers', // Deer - peacekeeper
  },
  {
    id: 16,
    text: "I enjoy challenging norms just to see if a better way exists.",
    category: 'pressure',
    archetype: 'disruptiveInnovators', // Coyote - challenges norms
  },

  // CONNECTION & SAFETY - Questions 17-24
  {
    id: 17,
    text: "I read body language and tone more than words.",
    category: 'connection',
    archetype: 'relationalHarmonizers', // Deer - reads body language
  },
  {
    id: 18,
    text: "I recharge by being around people I trust.",
    category: 'connection',
    archetype: 'groundedProtectors', // Buffalo - relational recharge
  },
  {
    id: 19,
    text: "I prefer harmony over winning arguments.",
    category: 'connection',
    archetype: 'relationalHarmonizers', // Deer - values harmony
  },
  {
    id: 20,
    text: "I get restless when things stay the same for too long.",
    category: 'connection',
    archetype: 'adaptiveMovers', // Antelope - needs movement/change
  },
  {
    id: 21,
    text: "I instinctively step in when someone looks uncomfortable or lost.",
    category: 'connection',
    archetype: 'relationalHarmonizers', // Deer - helps others
  },
  {
    id: 22,
    text: "I have a strong sense of territory — spaces or ideas that 'belong' to me.",
    category: 'connection',
    archetype: 'disruptiveInnovators', // Coyote - territorial
  },
  {
    id: 23,
    text: "I avoid conflict unless I know I can win or protect someone.",
    category: 'connection',
    archetype: 'groundedProtectors', // Buffalo - strategic protection
  },
  {
    id: 24,
    text: "I use humor to diffuse tension or test sincerity.",
    category: 'connection',
    archetype: 'disruptiveInnovators', // Coyote - uses humor strategically
  },

  // FOCUS & ADAPTATION - Questions 25-30
  {
    id: 25,
    text: "I make decisions fast and rarely second-guess.",
    category: 'focus',
    archetype: 'competitiveDrivers', // Ram - decisive
  },
  {
    id: 26,
    text: "I notice patterns and connections others overlook.",
    category: 'focus',
    archetype: 'adaptiveMovers', // Antelope - pattern recognition
  },
  {
    id: 27,
    text: "I like experimenting or solving problems with limited resources.",
    category: 'focus',
    archetype: 'adaptiveMovers', // Antelope - resourceful
  },
  {
    id: 28,
    text: "I have a low tolerance for inefficiency or disorganization.",
    category: 'focus',
    archetype: 'competitiveDrivers', // Ram - efficiency-driven
  },
  {
    id: 29,
    text: "I often take on too much because I trust my endurance.",
    category: 'focus',
    archetype: 'groundedProtectors', // Buffalo - endurance
  },
  {
    id: 30,
    text: "When I'm overwhelmed, I tend to shut down or freeze instead of speaking up.",
    category: 'focus',
    archetype: 'groundedProtectors', // Buffalo - freeze response
  },
];

/**
 * Question-to-Archetype mapping for quick lookup
 */
export const QUESTION_ARCHETYPE_MAP: Record<number, ArchetypeKey> = QUESTIONS.reduce(
  (map, question) => {
    map[question.id] = question.archetype;
    return map;
  },
  {} as Record<number, ArchetypeKey>
);

/**
 * Get questions by category (for display grouping)
 */
export function getQuestionsByCategory(category: Question['category']): Question[] {
  return QUESTIONS.filter((q) => q.category === category);
}

/**
 * Get question by ID
 */
export function getQuestionById(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/**
 * Validate that all responses are present
 */
export function validateResponses(responses: Record<number, number>): boolean {
  const allQuestionIds = QUESTIONS.map((q) => q.id);
  return allQuestionIds.every((id) => id in responses && responses[id] >= 1 && responses[id] <= 5);
}
