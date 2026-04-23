import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { TEMPLATES } from '@/lib/template-data';
import { safeError } from '@/lib/log-sanitizer';

/**
 * GET /api/templates — List all project templates
 *
 * Returns the built-in template library for the project template feature (E2).
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Auth check
    const { success, user } = getAuthUserFromRequest(request);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    return NextResponse.json({ templates: TEMPLATES });
  } catch (error) {
    safeError('[Templates] Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}