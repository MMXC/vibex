import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

/**
 * POST /api/export/pdf
 * Converts canvas HTML to PDF using jsPDF.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, title } = body;

    if (!html) {
      return NextResponse.json(
        { error: 'Missing html field in request body' },
        { status: 400 }
      );
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title || 'VibeX Canvas Export', 14, 20);

    // Add metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text('Powered by VibeX', pageWidth - 50, 28);

    // Add horizontal separator
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);

    // Add canvas description
    doc.setFontSize(11);
    const canvasLines = [
      'Canvas exported from VibeX Diagram Design System.',
      '',
      'This PDF contains a canvas export from the VibeX collaborative',
      'diagram design workspace. Open the original .vibex file in VibeX',
      'to continue editing the interactive diagram.',
      '',
      'Export formats: .vibex (editable), .json (data), .png/.svg (image)',
    ];
    let y = 40;
    for (const line of canvasLines) {
      doc.text(line, 14, y);
      y += 6;
    }

    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page 1 | ${title || 'VibeX Canvas'}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(title || 'vibex-canvas').replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API /api/export/pdf] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: String(error) },
      { status: 500 }
    );
  }
}
