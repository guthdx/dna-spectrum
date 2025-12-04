import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { calculateArchetypeScores, calculateDualStateProfile } from '@/lib/scoring';
import { generateInterpretation } from '@/lib/profiles';
import { saveAssessment } from '@/lib/db';
import type {
  SubmitAssessmentRequest,
  AssessmentResult,
  ApiResponse,
} from '@/types';

/**
 * POST /api/assessment/submit
 *
 * Calculates assessment scores and returns results
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitAssessmentRequest = await request.json();

    const { clientName, clientEmail, responses } = body;

    // Validate responses
    if (!responses || responses.length !== 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid responses. Expected 30 answers.',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate all scores are 1-5
    const invalidScores = responses.filter((r) => r.score < 1 || r.score > 5);
    if (invalidScores.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid scores. All responses must be between 1 and 5.',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Calculate archetype scores
    const scores = calculateArchetypeScores(responses);

    // Calculate Dual State profile
    const profile = calculateDualStateProfile(scores);

    // Generate interpretation
    const interpretation = generateInterpretation(profile, scores);

    // Create assessment result
    const assessmentId = uuidv4();
    const result: AssessmentResult = {
      id: assessmentId,
      clientName,
      clientEmail,
      responses,
      scores,
      profile,
      interpretation,
      completedAt: new Date(),
    };

    // Save to database
    try {
      await saveAssessment(result);
      console.log(`✅ Assessment saved to database: ${assessmentId}`);
    } catch (dbError) {
      console.error('⚠️  Database save failed, continuing without persistence:', dbError);
      // Continue anyway - the assessment still works, just won't be persisted
    }

    // Return result
    return NextResponse.json({
      success: true,
      data: {
        assessmentId,
        result,
      },
    } as ApiResponse<{ assessmentId: string; result: AssessmentResult }>);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
