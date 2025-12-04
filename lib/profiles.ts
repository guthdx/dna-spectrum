/**
 * H2 DNA Spectrum - Profile Interpretations
 *
 * Generates personalized interpretations based on Dual State profiles
 */

import type { DualStateProfile, ArchetypeScores, Interpretation } from '@/types';

/**
 * Generate full interpretation for an assessment result
 */
export function generateInterpretation(
  profile: DualStateProfile,
  scores: ArchetypeScores
): Interpretation {
  const { profileName, isDualState, dominanceScore, adaptivenessScore } = profile;

  // Determine profile-specific content
  const interpretation = getProfileInterpretation(
    profileName,
    isDualState,
    dominanceScore,
    adaptivenessScore,
    scores
  );

  return interpretation;
}

/**
 * Get interpretation based on profile type
 */
function getProfileInterpretation(
  profileName: string,
  isDualState: boolean,
  dominanceScore: number,
  adaptivenessScore: number,
  scores: ArchetypeScores
): Interpretation {
  // Adaptive Driver profile (like Jake's example)
  if (profileName === 'Adaptive Driver') {
    return {
      coreInstinct:
        'Moves first, but not blindly. Reads people and environments in real time, then channels courage and empathy into decisive movement. Thrives in change, tension, and growth cycles.',
      behavioralSignature: [
        'Reacts fast but adjusts mid-stride when new data appears',
        'Challenges systems or leaders when integrity or purpose feel off',
        'Feels most alive when there\'s something to prove and someone to protect',
        'Balances confidence with emotional literacy; naturally builds loyalty through authenticity',
      ],
      strengths: [
        'Drives transformation without burning bridges',
        'Reads the emotional and strategic field simultaneously',
        'Inspires followership by modeling composure under pressure',
        'Uses humor and creativity as pressure valves during conflict',
      ],
      watchOuts: [
        'May over-extend trying to be everything for everyone',
        'Can suppress personal needs until exhaustion hits',
        'Occasionally moves so fast that others can\'t feel included',
        'When unsupported, toggles between intensity and withdrawal',
      ],
      dualStateCue:
        'Slow your breath before you speed your plan. You thrive when you pause just long enough for others to join your movement.',
      toLeadYourself: [
        'Choose rhythm over reaction — your nervous system prefers cadence',
        'When doubt rises, ground yourself in purpose, not control',
        'Protect your recovery cycles; adaptability requires restoration',
      ],
      toPartnerWithOthers: [
        'Pair with detail-minded Builders or Observers to sustain your pace',
        'Seek honest mirrors who can name when your drive overshadows your empathy',
        'Build psychological safety through clarity — your power is safest when transparent',
      ],
    };
  }

  // Competitive Driver profile
  if (profileName === 'Competitive Driver') {
    return {
      coreInstinct:
        'Takes charge decisively and drives toward results. Thrives in competitive environments and pushes through obstacles with determination.',
      behavioralSignature: [
        'Makes quick decisions and takes immediate action',
        'Confronts problems head-on without hesitation',
        'Sets high standards for self and others',
        'Energized by challenges and competition',
      ],
      strengths: [
        'Decisive leadership in crisis situations',
        'High energy and drive for results',
        'Willing to take calculated risks',
        'Naturally assumes responsibility',
      ],
      watchOuts: [
        'May prioritize results over relationships',
        'Can become impatient with slower processes',
        'Risk of burnout from constant intensity',
        'May miss subtle emotional cues from others',
      ],
      toLeadYourself: [
        'Build in recovery time between major pushes',
        'Develop patience for processes that can\'t be rushed',
        'Practice active listening before acting',
      ],
      toPartnerWithOthers: [
        'Partner with Relational Harmonizers for balance',
        'Value input from those who see details you might miss',
        'Communicate your reasoning, not just your decisions',
      ],
    };
  }

  // Adaptive Harmonizer profile
  if (profileName === 'Adaptive Harmonizer') {
    return {
      coreInstinct:
        'Reads people and situations with remarkable accuracy, adapting seamlessly to create harmony and connection. Thrives when facilitating understanding between others.',
      behavioralSignature: [
        'Senses emotional shifts before others verbalize them',
        'Naturally mediates conflicts and finds common ground',
        'Adjusts communication style to meet people where they are',
        'Creates safe spaces for honest dialogue',
      ],
      strengths: [
        'Exceptional emotional intelligence and empathy',
        'Builds strong, lasting relationships naturally',
        'Adapts quickly to changing social dynamics',
        'Facilitates collaboration and team cohesion',
      ],
      watchOuts: [
        'May avoid necessary confrontation to preserve harmony',
        'Can absorb others\' emotions and become overwhelmed',
        'Risk of neglecting own needs while caring for others',
        'May struggle with making unpopular decisions',
      ],
      toLeadYourself: [
        'Set clear boundaries to protect your energy',
        'Practice saying "no" without guilt',
        'Remember that healthy conflict can strengthen relationships',
      ],
      toPartnerWithOthers: [
        'Partner with Competitive Drivers who can handle tough conversations',
        'Share your insights — your perceptions are valuable',
        'Trust that people can handle honest feedback',
      ],
    };
  }

  // Grounded Protector profile
  if (profileName === 'Grounded Protector') {
    return {
      coreInstinct:
        'Provides steady, reliable support and protection for people and projects. Thrives when creating security and stability for others.',
      behavioralSignature: [
        'Steps in to protect when others are vulnerable',
        'Provides calm, grounding presence in chaos',
        'Builds trust through consistent reliability',
        'Endures through difficult situations others can\'t',
      ],
      strengths: [
        'Unwavering loyalty and commitment',
        'Exceptional endurance and resilience',
        'Creates psychological safety for teams',
        'Trusted guardian of important work',
      ],
      watchOuts: [
        'May take on too much responsibility for others',
        'Can become depleted without recognizing limits',
        'May freeze or withdraw when overwhelmed',
        'Risk of carrying burdens that aren\'t yours to carry',
      ],
      toLeadYourself: [
        'Honor your need for recovery and restoration',
        'Recognize when to ask for support',
        'Remember that protecting yourself enables protecting others',
      ],
      toPartnerWithOthers: [
        'Allow others to protect you sometimes',
        'Partner with those who can share the load',
        'Communicate when you\'re reaching capacity',
      ],
    };
  }

  // Strategic Innovator profile
  if (profileName === 'Strategic Innovator') {
    return {
      coreInstinct:
        'Challenges existing systems while carefully analyzing the best path forward. Combines creative disruption with strategic thinking.',
      behavioralSignature: [
        'Questions norms to find better solutions',
        'Balances innovation with practical implementation',
        'Observes patterns others miss',
        'Tests ideas thoroughly before committing',
      ],
      strengths: [
        'Innovative problem-solving',
        'Strategic long-term thinking',
        'Balances creativity with analysis',
        'Sees opportunities for improvement others overlook',
      ],
      watchOuts: [
        'May get stuck in analysis without action',
        'Can be seen as contrarian or difficult',
        'Risk of perfectionism delaying progress',
        'May isolate while developing ideas',
      ],
      toLeadYourself: [
        'Set deadlines to move from planning to action',
        'Share work-in-progress, not just finished products',
        'Balance innovation with appreciation for what works',
      ],
      toPartnerWithOthers: [
        'Partner with Competitive Drivers who can execute quickly',
        'Explain your reasoning to bring others along',
        'Value the wisdom in existing systems before changing them',
      ],
    };
  }

  // Balanced Observer profile (default)
  return {
    coreInstinct:
      'Maintains equilibrium across different behavioral modes, adapting approach based on situation rather than operating from a fixed pattern.',
    behavioralSignature: [
      'Flexible and situationally aware',
      'Draws from multiple behavioral strategies',
      'Observes before committing to action',
      'Balances competing priorities effectively',
    ],
    strengths: [
      'Versatility in different situations',
      'Balanced perspective on challenges',
      'Able to mediate between different approaches',
      'Adapts style to what the situation needs',
    ],
    watchOuts: [
      'May lack a strong default mode when needed',
      'Can struggle with identity clarity',
      'Risk of being seen as inconsistent',
      'May need time to calibrate in new situations',
    ],
    toLeadYourself: [
      'Identify which contexts bring out your best',
      'Develop signature strengths within your flexibility',
      'Trust your ability to read situations accurately',
    ],
    toPartnerWithOthers: [
      'Communicate your adaptive approach to avoid confusion',
      'Partner with those who have clear, complementary styles',
      'Use your versatility as a bridge between different people',
    ],
  };
}
