/**
 * Requirements Clarifications API
 * GET /api/requirements/:requirementId/clarifications
 * 
 * Retrieves clarifications for a requirement from the Requirement.parsedData JSON field.
 * 
 * @module app/api/requirements/[requirementId]/clarifications
 */
// @ts-nocheck


import { NextRequest, NextResponse } from 'next/server';
import { getLocalEnv } from '@/lib/env';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RequirementRow {
  id: string;
  projectId: string;
  rawInput: string;
  parsedData: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requirementId: string }> }
): Promise<NextResponse> {
  try {
    const { requirementId } = await params;
    const env = getLocalEnv();

    const requirement = await queryOne<RequirementRow>(
      env,
      'SELECT * FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    // Extract clarification data from parsedData JSON
    let clarifications: unknown[] = [];
    if (requirement.parsedData) {
      try {
        const parsed = JSON.parse(requirement.parsedData);
        if (parsed.clarification?.questions) {
          clarifications = parsed.clarification.questions;
        }
      } catch {
        // Invalid JSON, return empty clarifications
      }
    }

    return NextResponse.json({
      success: true,
      requirementId,
      clarifications,
      requirement: {
        id: requirement.id,
        status: requirement.status,
        rawInput: requirement.rawInput,
        createdAt: requirement.createdAt,
        updatedAt: requirement.updatedAt,
      },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Requirements Clarifications] Error:', errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch clarifications: ${errorMessage}` },
      { status: 500 }
    );
  }
}
