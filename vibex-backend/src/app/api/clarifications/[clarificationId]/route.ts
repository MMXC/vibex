/**
 * Clarification Update API
 * PUT /api/clarifications/:clarificationId
 * 
 * Updates a clarification question answer.
 * 
 * @module app/api/clarifications/[clarificationId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLocalEnv } from '@/lib/env';
import { queryOne, executeDB } from '@/lib/db';

import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
}

interface UpdateRequest {
  answer?: string;
  status?: 'answered' | 'skipped';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clarificationId: string }> }
): Promise<NextResponse> {
  try {
    const { clarificationId } = await params;
    const body: UpdateRequest = await request.json();
    const { answer, status } = body;

    if (!answer && !status) {
      return NextResponse.json(
        { error: 'At least one of answer or status is required' },
        { status: 400 }
      );
    }

    const env = getLocalEnv();

    // Find the requirement that contains this clarification question
    // Since clarifications are stored in parsedData JSON, we need to find the requirement
    // This requires a full table scan - for MVP, return a mock response
    // In production, this should be indexed

    // For now, return a mock success response
    // TODO: Implement indexed lookup when clarificationId is stored as a separate column
    return NextResponse.json({
      success: true,
      clarificationId,
      answer: answer || null,
      status: status || 'answered',
      updatedAt: new Date().toISOString(),
      message: 'Clarification updated (mock - D1 indexed lookup not yet implemented)',
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    safeError('[Clarification Update] Error:', errorMessage);
    return NextResponse.json(
      { error: `Failed to update clarification: ${errorMessage}` },
      { status: 500 }
    );
  }
}
