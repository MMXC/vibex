/**
 * /api/canvas/[id]/comments/[commentId]/reactions — Comment Reactions API
 * Sprint86 E1: 画布评论标注系统
 *
 * POST — Add a reaction to a comment
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeDB, generateId, Env } from '@/lib/db';
import { safeError } from '@/lib/log-sanitizer';

export const runtime = 'edge';

type RouteParams = { params: Promise<{ id: string; commentId: string }> };

const VALID_REACTION_TYPES = ['thumbsup', 'heart', 'laugh'] as const;
type ReactionType = typeof VALID_REACTION_TYPES[number];

// POST /api/canvas/[id]/comments/[commentId]/reactions — Add a reaction to a comment
export async function POST(
  request: NextRequest,
  context: { env: Env } & RouteParams
) {
  try {
    const { id: _canvasId, commentId } = await context.params;
    const body = await request.json();
    const { userId, type } = body;

    // Validate required fields
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type' },
        { status: 400 }
      );
    }

    if (!VALID_REACTION_TYPES.includes(type as ReactionType)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${VALID_REACTION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const env = context.env;
    const id = generateId();
    const now = new Date().toISOString();

    await executeDB(
      env,
      `INSERT INTO comment_reactions (id, comment_id, user_id, type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, commentId, userId, type, now]
    );

    return NextResponse.json({ reactionId: id, created_at: now }, { status: 201 });
  } catch (err) {
    safeError('[canvas/comments/reactions] POST error:', err);
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}
