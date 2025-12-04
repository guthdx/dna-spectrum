import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentById } from '@/lib/db';
import type { ApiResponse, AssessmentResult } from '@/types';

/**
 * GET /api/assessment/[id]
 *
 * Retrieves an assessment by ID from the database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment ID is required',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Get assessment from database
    const result = await getAssessmentById(id);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment not found',
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Return assessment
    return NextResponse.json({
      success: true,
      data: result,
    } as ApiResponse<AssessmentResult>);
  } catch (error) {
    console.error('Error retrieving assessment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve assessment',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
