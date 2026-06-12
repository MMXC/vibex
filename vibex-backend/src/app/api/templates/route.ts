/**
 * /api/templates — Template Publishing API
 *
 * S85-E5: 模板发布与评分系统
 * S92-E2: Template Marketplace 2.0 — synonym search + tag filtering
 *
 * GET  /api/templates     — List published templates (with sort/filter)
 *                           Extended: search param (synonym match), multi-tag AND filter
 * POST /api/templates     — Publish a canvas as a template
 *   Body: {
 *     name: string;
 *     description?: string;
 *     tags?: string[];
 *     thumbnail?: string;   // base64 or URL
 *     canvasId?: string;
 *     contentJson?: string; // serialized canvas data
 *   }
 *   Returns: { ok: boolean; template?: TemplateRow; error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { executeDB, queryDB, queryOne, generateId, safeError, Env } from '@/lib/db';

/**
 * S92-E2: Synonym mapping for smart search
 * Key → array of synonyms. Search for any key returns results for all synonyms too.
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

/**
 * S92-E2: Expand a query term into all related terms (itself + all synonyms)
 */
function expandSynonyms(term: string): string[] {
  const normalized = term.trim().toLowerCase();
  const allTerms = new Set<string>([normalized]);

  // Check if the term matches any key
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (key === normalized || synonyms.some((s) => s.toLowerCase() === normalized)) {
      allTerms.add(key.toLowerCase());
      for (const s of synonyms) {
        allTerms.add(s.toLowerCase());
      }
    }
  }

  // Also check reverse: if the term is a synonym, include its key and other synonyms
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (synonyms.some((s) => s.toLowerCase() === normalized)) {
      allTerms.add(key.toLowerCase());
      for (const s of synonyms) {
        allTerms.add(s.toLowerCase());
      }
    }
  }

  return [...allTerms];
}

/**
 * S92-E2: Build LIKE conditions for synonym search
 * Returns { conditions: string[], params: string[] }
 */
function buildSynonymConditions(
  searchTerms: string[]
): { conditions: string[]; params: string[] } {
  const allExpandedTerms = searchTerms.flatMap(expandSynonyms);
  const conditions: string[] = [];
  const params: string[] = [];

  for (const term of allExpandedTerms) {
    // Match term in name, description, or tags
    conditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
    const likePattern = `%${term}%`;
    params.push(likePattern, likePattern, likePattern);
  }

  return { conditions, params };
}

export const dynamic = 'force-dynamic';

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  author_id: string;
  author_name: string;
  tags: string;
  thumbnail: string | null;
  canvas_id: string | null;
  usage_count: number;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  published_at: string;
}

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'recent'; // recent | rating | usage
    const tagsParam = searchParams.get('tags'); // comma-separated, OR query
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    // S92-E2: Synonym search
    const search = searchParams.get('search')?.trim() || '';
    // S92-E2: Multi-tag AND filter (comma-separated)
    const filterTagsParam = searchParams.get('filterTags');

    let orderBy = 'published_at DESC';
    if (sort === 'rating') orderBy = 'avg_rating DESC, rating_count DESC';
    else if (sort === 'usage') orderBy = 'usage_count DESC';

    let whereConditions: string[] = [];
    let queryParams: (string | number)[] = [];

    // S92-E2: Synonym search — search term expanded via synonym map
    if (search.length > 0) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        const { conditions, params } = buildSynonymConditions(searchTerms);
        // All search terms must match (AND between terms, but each term uses OR across fields)
        const combinedConditions = conditions.map((c) => `(${c})`).join(' AND ');
        whereConditions.push(`(${combinedConditions})`);
        queryParams.push(...params);
      }
    }

    // Build WHERE clause for tags (multi-tag OR filter — existing behavior)
    if (tagsParam && tagsParam.trim().length > 0) {
      const tagList = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        const tagConditions = tagList.map(() => `tags LIKE ?`).join(' OR ');
        whereConditions.push(`(${tagConditions})`);
        queryParams.push(...tagList.map((tag) => `%${tag}%`));
      }
    }

    // S92-E2: Multi-tag AND filter (strict — template must have ALL specified tags)
    if (filterTagsParam && filterTagsParam.trim().length > 0) {
      const filterTagList = filterTagsParam.split(',').map((t) => t.trim()).filter(Boolean);
      for (const tag of filterTagList) {
        whereConditions.push(`(tags LIKE ?)`);
        queryParams.push(`%"${tag}"%`);
      }
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const rows = await queryDB<TemplateRow>(
      env,
      `SELECT id, name, description, author_id, author_name, tags,
              thumbnail, canvas_id, usage_count, avg_rating, rating_count,
              created_at, published_at
       FROM templates
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ?`,
      [...queryParams, limit]
    );

    return NextResponse.json({
      ok: true,
      templates: rows.map((r) => ({ ...r, tags: JSON.parse(r.tags || '[]') })),
    });
  } catch (err) {
    safeError('[Templates GET] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;

    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      name?: string;
      description?: string;
      tags?: string[];
      thumbnail?: string;
      canvasId?: string;
      contentJson?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, description = '', tags = [], thumbnail, canvasId, contentJson = '{}' } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Template name is required' }, { status: 400 });
    }
    if (name.trim().length > 200) {
      return NextResponse.json({ ok: false, error: 'Template name too long (max 200 chars)' }, { status: 400 });
    }

    const templateId = generateId();
    const tagsJson = JSON.stringify(tags);

    await executeDB(
      env,
      `INSERT INTO templates (id, name, description, author_id, author_name, tags,
                              thumbnail, canvas_id, content_json, usage_count, avg_rating, rating_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [templateId, name.trim(), description.trim(), user.id, user.name || 'Anonymous', tagsJson,
       thumbnail || null, canvasId || null, contentJson]
    );

    const template = await queryOne<TemplateRow>(
      env,
      `SELECT id, name, description, author_id, author_name, tags,
              thumbnail, canvas_id, usage_count, avg_rating, rating_count,
              created_at, published_at
       FROM templates WHERE id = ?`,
      [templateId]
    );

    return NextResponse.json({
      ok: true,
      template: template ? { ...template, tags: JSON.parse(template.tags || '[]') } : null,
    });
  } catch (err) {
    safeError('[Templates POST] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
