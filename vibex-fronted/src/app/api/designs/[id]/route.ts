/**
 * GET /api/designs/[id] — Get design by ID
 * DELETE /api/designs/[id] — Delete design by ID
 * PATCH /api/designs/[id] — Update design by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DesignMetadata } from '@/types/design';

// Shared in-memory store (same reference as route.ts — Module-level singleton)
// In production, replace with a proper database.
declare global {
  // eslint-disable-next-line no-var
  var __designsStore: DesignMetadata[] | undefined;
}
if (!global.__designsStore) {
  global.__designsStore = [];
}

const designs = global.__designsStore;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const design = designs.find((d) => d.id === id);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json({ design });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = designs.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  designs.splice(idx, 1);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = designs.findIndex((d) => d.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  try {
    const body = await req.json();
    designs[idx] = { ...designs[idx], ...body, updatedAt: Date.now() };
    return NextResponse.json({ design: designs[idx] });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
