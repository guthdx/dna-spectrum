import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { AssessmentPDFDocument } from '@/components/PDFTemplate';
import type { AssessmentResult } from '@/types';

/**
 * POST /api/pdf/generate
 *
 * Generates a PDF report from assessment results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result } = body as { result: AssessmentResult };

    if (!result) {
      return NextResponse.json(
        { error: 'No result provided' },
        { status: 400 }
      );
    }

    // Generate PDF using @react-pdf/renderer (call component as function)
    const stream = await renderToStream(
      AssessmentPDFDocument({ result })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determine filename
    const filename = result.clientName
      ? `${result.clientName.replace(/[^a-z0-9]/gi, '_')}_DNA_Spectrum.pdf`
      : `DNA_Spectrum_Assessment_${result.id.substring(0, 8)}.pdf`;

    // Return PDF as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
