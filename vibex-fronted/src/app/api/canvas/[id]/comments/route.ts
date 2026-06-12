/**
 * /api/canvas/[id]/comments — Canvas Comment Thread API
 * S92-E3: Canvas Comment Thread
 *
 * GET  — list comments for a canvas (with x, y position, resolved status)
 * POST — create a new canvas comment bubble at specified (x, y)
 *
 * Schema: id, canvas_id, node_id, author_id, author_name, author_avatar,
 *         content, x, y, resolved, created_at, mentions (JSON array)
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export interface CanvasComment {
  id: string;
  canvas_id: string;
  node_id: string | null;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  x: number;
  y: number;
  resolved: boolean;
  created_at: number;
  mentions: string[];
  replies?: CanvasComment[];
}

// In-memory store for demo (production: D1 database)
const _commentStore = new Map<string, CanvasComment[]>();

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getComments(canvasId: string): CanvasComment[] {
  return _commentStore.get(canvasId) ?? [];
}

/**
 * GET /api/canvas/[id]/comments
 * Query params: ?resolved=true|false (optional filter)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: canvasId } = await params;
  const { searchParams } = req.nextUrl;
  const resolvedFilter = searchParams.get('resolved');

  let comments = getComments(canvasId);

  if (resolvedFilter === 'true') {
    comments = comments.filter(c => c.resolved);
  } else if (resolvedFilter === 'false') {
    comments = comments.filter(c => !c.resolved);
  }

  // Build threaded structure: root comments + replies
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const threaded = rootComments.map(root => ({
    ...root,
    replies: replies.filter(r => r.parent_id === root.id),
  }));

  return NextResponse.json({ success: true, comments: threaded, total: threaded.length });
}

export interface CreateCommentBody {
  content: string;
  x: number;
  y: number;
  node_id?: string | null;
  parent_id?: string | null;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  mentions?: string[];
}

/**
 * POST /api/canvas/[id]/comments
 * Body: CreateCommentBody
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: canvasId } = await params;

  let body: CreateCommentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, x, y, node_id, parent_id, author_id, author_name, author_avatar, mentions = [] } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (typeof x !== 'number' || typeof y !== 'number') {
    return NextResponse.json({ error: 'x and y are required numbers' }, { status: 400 });
  }
  if (!author_id?.trim()) {
    return NextResponse.json({ error: 'author_id is required' }, { status: 400 });
  }

  const comment: CanvasComment = {
    id: generateId(),
    canvas_id: canvasId,
    node_id: node_id ?? null,
    parent_id: parent_id ?? null,
    author_id,
    author_name: author_name ?? 'Anonymous',
    author_avatar: author_avatar ?? '👤',
    content: content.trim(),
    x,
    y,
    resolved: false,
    created_at: Date.now(),
    mentions,
  };

  const existing = _commentStore.get(canvasId) ?? [];
  _commentStore.set(canvasId, [...existing, comment]);

  return NextResponse.json({ success: true, comment }, { status: 201 });
}
