import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { safeError } from '@/lib/log-sanitizer';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/templates/marketplace — List pre-configured marketplace templates
 *
 * Returns the built-in marketplace template library from public/data/marketplace-templates.json.
 * Supports optional industry filter via ?industry=saas|ecommerce|social
 */

export const dynamic = 'force-dynamic';

interface MarketplaceTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  entities: unknown[];
  boundedContexts: unknown[];
  sampleRequirement: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MarketplaceData {
  templates: MarketplaceTemplate[];
}

export async function GET(request: NextRequest) {
  // Auth check
  const { success } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');

    const dataPath = join(process.cwd(), 'public', 'data', 'marketplace-templates.json');
    const raw = await readFile(dataPath, 'utf-8');
    const data: MarketplaceData = JSON.parse(raw);

    let templates = data.templates;
    if (industry && ['saas', 'ecommerce', 'social'].includes(industry)) {
      templates = data.templates.filter(t => t.industry === industry);
    }

    return NextResponse.json({ templates });
  } catch (error) {
    safeError('[Marketplace] Error fetching marketplace templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace templates' },
      { status: 500 }
    );
  }
}
