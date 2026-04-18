export const dynamic = "force-static";

/**
 * POST /api/delivery/export — Generate export file
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, format } = body ?? {};

    // Build filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${type}-${id}-${timestamp}.${format === 'pdf' ? 'pdf' : 'md'}`;

    // For markdown, generate placeholder content based on type
    let content = '';
    if (format === 'markdown') {
      content = `# ${type} Export\n\nExported on ${timestamp}\n\nType: ${type}\nID: ${id}\n`;
    }

    // Return as downloadable response
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Filename': filename,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
