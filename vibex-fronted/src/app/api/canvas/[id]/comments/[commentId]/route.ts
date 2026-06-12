/**
 * /api/canvas/[id]/comments/[commentId] — Single Comment API
 * S92-E3: Canvas Comment Thread
 *
 * PATCH — update comment (content, x, y, resolved)
 * DELETE — delete a comment
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { CanvasComment } from '../route';

// Shared in-memory store (same as parent route — module-level for demo)
// In production, this would be D1 database
declare global {
  // eslint-disable-next-line no-var
  var _canvasComments: Map<string, CanvasComment[]> | undefined;
}

function getComments(canvasId: string): CanvasComment[] {
  if (!global._canvasComments) {
    global._canvasComments = new Map();
  }
  return global._canvasComments!.get(canvasId) ?? [];
}

function saveComments(canvasId: string, comments: CanvasComment[]) {
  if (!global._canvasComments) {
    global._canvasComments = new Map();
  }
  global._canvasComments!.set(canvasId, comments);
}

export interface UpdateCommentBody {
  content?: string;
  x?: number;
  y?: number;
  resolved?: boolean;
  mentions?: string[];
}

/**
 * PATCH /api/canvas/[id]/comments/[commentId]
 * Body: UpdateCommentBody
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: canvasId, commentId } = await params;

  let body: UpdateCommentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const comments = getComments(canvasId);
  const idx = comments.findIndex(c => c.id === commentId);

  if (idx === -1) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const updated: CanvasComment = {
    ...comments[idx],
    ...(body.content !== undefined && { content: body.content }),
    ...(body.x !== undefined && { x: body.x }),
    ...(body.y !== undefined && { y: body.y }),
    ...(body.resolved !== undefined && { resolved: body.resolved }),
    ...(body.mentions !== undefined && { mentions: body.mentions }),
  };

  const next = [...comments];
  next[idx] = updated;
  saveComments(canvasId, next);

  return NextResponse.json({ success: true, comment: updated });
}

/**
 * DELETE /api/canvas/[id]/comments/[commentId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: canvasId, commentId } = await params;

  const comments = getComments(canvasId);
  const idx = comments.findIndex(c => c.id === commentId);

  if (idx === -1) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const next = comments.filter(c => c.id !== commentId);
  saveComments(canvasId, next);

  return NextResponse.json({ success: true });
}
