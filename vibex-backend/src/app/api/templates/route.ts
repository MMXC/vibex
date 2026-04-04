/**
 * GET /api/templates — List all project templates
 *
 * Returns the built-in template library for the project template feature (E2).
 */

import { NextRequest, NextResponse } from 'next/server';
import { TEMPLATES } from '@/lib/template-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ templates: TEMPLATES });
  } catch (error) {
    console.error('[Templates] Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
