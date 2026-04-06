/**
 * Domain Model Class Diagram API
 * 
 * API endpoint for generating Mermaid classDiagram from domain entities.
 * Integrates with bounded context diagram data.
 * 
 * @module app/api/domain-model/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateClassDiagram, getDiagramMetadata, ClassDiagramOptions } from '@/services/domain-model';
import { DomainEntity } from '@/services/domain-entities';
import { EntityRelation } from '@/services/entity-relations';

import { safeError } from '@/lib/log-sanitizer';

/**
 * GET /api/domain-model/:projectId
 * Generate class diagram for a project from provided entities
 * 
 * Query params:
 * - projectId: Project ID to generate diagram for
 * - showProperties: Whether to show properties (default: true)
 * - showRelations: Whether to show relations (default: true)
 * - showStereotypes: Whether to show stereotypes (default: true)
 * - title: Optional diagram title
 * 
 * Body (POST alternative):
 * - entities: Array of domain entities
 * - relations: Array of entity relations
 */

// Auth helper
function checkAuth(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET || 'vibex-dev-secret';
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { auth: null, error: 'Unauthorized: authentication required' };
  }
  const token = authHeader.substring(7);
  try {
    const jwt = require('jsonwebtoken');
    const auth = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    return { auth, error: null };
  } catch {
    return { auth: null, error: 'Invalid or expired token' };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // E1: Authentication check
  const { auth, error } = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse options from query params
    const options: ClassDiagramOptions = {
      showProperties: searchParams.get('showProperties') !== 'false',
      showRelations: searchParams.get('showRelations') !== 'false',
      showStereotypes: searchParams.get('showStereotypes') !== 'false',
      title: searchParams.get('title') || undefined,
    };

    // For now, return a placeholder - frontend will pass entities in POST
    // This endpoint can be extended to fetch from DB when needed
    return NextResponse.json({
      success: true,
      data: {
        projectId,
        diagram: '',
        metadata: {
          entityCount: 0,
          relationCount: 0,
          aggregateRootCount: 0,
          entityCountByType: {
            aggregateRoot: 0,
            entity: 0,
            valueObject: 0,
          },
        },
        options,
        message: 'Use POST to generate diagram with entities',
      },
    });
  } catch (error) {
    safeError('Error generating class diagram:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate class diagram', code: 'GENERATION_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domain-model
 * Generate class diagram from provided entities and relations
 * 
 * Body:
 * - entities: Array of domain entities
 * - relations: Array of entity relations
 * - options: Diagram generation options
 */
export async function POST(request: NextRequest) {
  // E1: Authentication check
  const { auth, error } = checkAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { entities, relations, options = {} } = body;

    // Validate input
    if (!Array.isArray(entities)) {
      return NextResponse.json(
        { success: false, error: 'entities must be an array', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate the class diagram
    const diagram = generateClassDiagram(entities, relations || [], options);
    
    // Get metadata about the diagram
    const metadata = getDiagramMetadata(entities, relations || []);

    return NextResponse.json({
      success: true,
      data: {
        diagram,
        metadata,
      },
    });
  } catch (error) {
    safeError('Error generating class diagram:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate class diagram', code: 'GENERATION_ERROR' },
      { status: 500 }
    );
  }
}
