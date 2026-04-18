/**
 * GET /api/designs — List all designs
 * POST /api/designs — Create a new design
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DesignMetadata } from '@/types/design';

// In-memory store (replace with DB when backend is ready)
const designsStore: DesignMetadata[] = [];

export async function GET(_req: NextRequest) {
  return NextResponse.json({ designs: designsStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, fileUrl, source, canvasType } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const design: DesignMetadata = {
      id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileUrl,
      source: source ?? 'manual',
      canvasType: canvasType ?? 'prototype',
    };

    designsStore.unshift(design);
    return NextResponse.json({ design }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
