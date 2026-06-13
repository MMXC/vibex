/**
 * /api/canvas/:id/webhooks — Canvas Webhook Configuration API
 *
 * S94-E2: Advanced Canvas Sharing
 * - GET: List webhooks for a canvas
 * - POST: Add a webhook (url + event selection)
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryDB, executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/logger/safeError';

const VALID_EVENTS = [
  'share.created',
  'share.accessed',
  'share.expired',
  'share.revoked',
  'canvas.updated',
  'canvas.deleted',
  'canvas.exported',
  'comment.created',
  'comment.updated',
] as const;

type WebhookEvent = typeof VALID_EVENTS[number];

interface WebhookRow {
  id: string;
  canvas_id: string;
  url: string;
  secret: string | null;
  events: string;
  is_active: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// GET /api/canvas/:id/webhooks — List webhooks for a canvas
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    const rows = await queryDB<WebhookRow>(env,
      'SELECT * FROM canvas_webhooks WHERE canvas_id = ? ORDER BY created_at DESC',
      [canvasId]
    );

    const webhooks = rows.map((row) => ({
      id: row.id,
      canvasId: row.canvas_id,
      url: row.url,
      events: JSON.parse(row.events) as WebhookEvent[],
      isActive: row.is_active === 1,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Don't expose secret
    }));

    return NextResponse.json({ webhooks }, { status: 200 });
  } catch (err) {
    safeError('[Webhooks GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvas/:id/webhooks — Create a new webhook
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; env: Env }
) {
  try {
    const { id: canvasId } = await context.params;
    const env = context.env;

    if (!canvasId) {
      return NextResponse.json({ error: 'Missing canvas ID' }, { status: 400 });
    }

    let body: {
      url?: string;
      events?: string[];
      secret?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Validate URL
    try {
      const urlObj = new URL(body.url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return NextResponse.json({ error: 'url must use http or https' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'url is not a valid URL' }, { status: 400 });
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'events must be a non-empty array' }, { status: 400 });
    }

    const invalidEvents = body.events.filter((e) => !VALID_EVENTS.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${VALID_EVENTS.join(', ')}` },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization') ?? '';
    const createdBy = authHeader.replace('Bearer ', '').split('-')[0] || 'anonymous';

    const webhookId = generateId();
    const secret = body.secret || generateId().substring(0, 16); // auto-generate secret if not provided

    await executeDB(env,
      `INSERT INTO canvas_webhooks (id, canvas_id, url, secret, events, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [webhookId, canvasId, body.url, secret, JSON.stringify(body.events), createdBy]
    );

    return NextResponse.json({
      id: webhookId,
      canvasId,
      url: body.url,
      secret,
      events: body.events,
      isActive: true,
      createdBy,
    }, { status: 201 });
  } catch (err) {
    safeError('[Webhooks POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
