/**
 * POST /api/export/pdf
 * E006: PDF export backend API
 *
 * Receives canvas data as JSON body and returns a minimal valid PDF.
 * File name: canvas-{timestamp}.pdf
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse body - return 400 if missing or invalid
    let canvasData: unknown;
    try {
      canvasData = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    if (!canvasData) {
      return NextResponse.json(
        { error: 'Missing canvas data in request body', code: 'MISSING_BODY' },
        { status: 400 }
      );
    }

    // Generate a minimal valid PDF
    const timestamp = Date.now();
    const filename = `canvas-${timestamp}.pdf`;
    const pdfBuffer = generateMinimalPDF(canvasData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    safeError('[export/pdf] Error generating PDF:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF', code: 'PDF_GENERATION_FAILED', message },
      { status: 500 }
    );
  }
}

/**
 * Generate a minimal valid PDF containing canvas data as text.
 * Uses PDF 1.4 specification with a single page.
 */
function generateMinimalPDF(data: unknown): Buffer {
  const timestamp = new Date().toISOString();
  const dataStr = JSON.stringify(data, null, 2);
  const content = escapePDFString(dataStr);

  // Build PDF content stream
  const streamContent = [
    'BT',
    '/F1 12 Tf',
    '50 750 Td',
    '(Canvas Export) Tj',
    '0 -20 Td',
    '/F1 10 Tf',
    `(${timestamp}) Tj`,
    '0 -30 Td',
    '/F1 9 Tf',
    `(${content}) Tj`,
    'ET',
  ].join('\n');

  const streamLength = streamContent.length;

  const pdf = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length ${streamLength} >>`,
    'stream',
    streamContent,
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    `xref`,
    `0 6`,
    `0000000000 65535 f `,
    `0000000009 00000 n `,
    `0000000058 00000 n `,
    `0000000115 00000 n `,
    `0000000266 00000 n `,
    `0000000355 00000 n `,
    `trailer`,
    `<< /Size 6 /Root 1 0 R >>`,
    `startxref`,
    `${355 + streamLength + 1}`,
    `%%EOF`,
  ].join('\n');

  return Buffer.from(pdf, 'utf-8');
}

/**
 * Escape special characters for PDF string literal
 */
function escapePDFString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
