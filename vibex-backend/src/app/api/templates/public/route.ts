/**
 * /api/templates/public — Public Template Gallery API
 *
 * S90-E3: Template Sharing & Public Gallery
 * S92-E2: Template Marketplace 2.0 — synonym search + tag AND filtering
 *
 * GET /api/templates/public — List all public templates with pagination
 *   Query params:
 *     - category?: string (matches against tags JSON, OR query)
 *     - sort?: 'recent' | 'rating' | 'usage' (default: 'recent')
 *     - page?: number (default: 1)
 *     - limit?: number (default: 20, max: 100)
 *     - search?: string (S92-E2: synonym search in name/description/tags)
 *     - filterTags?: string (S92-E2: comma-separated, AND filter)
 *   Returns: { ok: boolean; templates: TemplateRow[]; total: number; page: number }
 *
 * No auth required — this is a public endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryDB, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * S92-E2: Synonym mapping for smart search (mirrors route.ts)
 */
const SYNONYM_MAP: Record<string, string[]> = {
  '电商': ['电商网站', '网上商店', '购物', '商城', '零售'],
  '教育': ['在线教育', '课程', '培训', '学习', '教学'],
  '医疗': ['医院', '健康', '诊所', '医疗健康'],
  '金融': ['银行', '保险', '证券', '支付'],
  '社交': ['社交网络', '社区', '论坛', '聊天'],
  '企业': ['企业服务', 'SaaS', 'B2B', '办公'],
  '游戏': ['游戏', '手游', '电竞'],
  '内容': ['内容平台', '博客', '资讯', '媒体'],
  '移动': ['移动应用', 'APP', '手机'],
  '物流': ['配送', '仓储', '供应链'],
  '餐饮': ['餐饮', '外卖', '餐厅'],
};

function expandSynonyms(term: string): string[] {
  const normalized = term.trim().toLowerCase();
  const allTerms = new Set<string>([normalized]);
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (key === normalized || synonyms.some((s) => s.toLowerCase() === normalized)) {
      allTerms.add(key.toLowerCase());
      for (const s of synonyms) allTerms.add(s.toLowerCase());
    }
  }
  return [...allTerms];
}

function buildSynonymConditions(searchTerms: string[]): { conditions: string[]; params: string[] } {
  const allExpandedTerms = searchTerms.flatMap(expandSynonyms);
  const conditions: string[] = [];
  const params: string[] = [];
  for (const term of allExpandedTerms) {
    conditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
    const likePattern = `%${term}%`;
    params.push(likePattern, likePattern, likePattern);
  }
  return { conditions, params };
}

interface PublicTemplate {
  id: string;
  name: string;
  description: string;
  author_name: string;
  tags: string[];
  thumbnail: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  share_token: string | null;
  published_at: string;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { searchParams } = new URL(request.url);

    const sort = searchParams.get('sort') || 'recent';
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    // S92-E2: Synonym search
    const search = searchParams.get('search')?.trim() || '';
    // S92-E2: Multi-tag AND filter
    const filterTagsParam = searchParams.get('filterTags');

    let orderBy = 'published_at DESC';
    if (sort === 'rating') orderBy = 'avg_rating DESC, rating_count DESC';
    else if (sort === 'usage') orderBy = 'usage_count DESC';

    const queryParams: (string | number)[] = [];
    const whereConditions: string[] = ['is_public = 1'];

    // S92-E2: Synonym search
    if (search.length > 0) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        const { conditions, params } = buildSynonymConditions(searchTerms);
        const combined = conditions.map((c) => `(${c})`).join(' AND ');
        whereConditions.push(`(${combined})`);
        queryParams.push(...params);
      }
    }

    if (category && category.trim().length > 0) {
      whereConditions.push(`tags LIKE ?`);
      queryParams.push(`%${category.trim()}%`);
    }

    // S92-E2: Multi-tag AND filter
    if (filterTagsParam && filterTagsParam.trim().length > 0) {
      const filterTagList = filterTagsParam.split(',').map((t) => t.trim()).filter(Boolean);
      for (const tag of filterTagList) {
        whereConditions.push(`(tags LIKE ?)`);
        queryParams.push(`%"${tag}"%`);
      }
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countResult = await queryDB<{ cnt: number }>(
      env,
      `SELECT COUNT(*) as cnt FROM templates ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.cnt ?? 0;

    // Get paginated templates
    const rows = await queryDB<PublicTemplate>(
      env,
      `SELECT id, name, description, author_name, tags, thumbnail,
              usage_count, avg_rating, rating_count, share_token, published_at
       FROM templates
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const templates = rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]') as string[],
    }));

    return NextResponse.json({
      ok: true,
      templates,
      total,
      page,
      limit,
    });
  } catch (err) {
    safeError('[TemplatesPublic GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
