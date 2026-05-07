/**
 * POST /api/v1/canvas/from-prd — E05 S05.1 PRD → Canvas 自动映射
 *
 * 接收 PRDDocument JSON，返回 Canvas 三栏节点 + edges。
 *
 * 映射规则（AGENTS.md 9.5）：
 *   PRDChapter     → 左栏 (type: 'context')
 *   PRDStep        → 中栏 (type: 'flow')
 *   PRDRequirement → 右栏 (type: 'design')
 *   Edges: chapter → step → requirement
 *
 * MVP：只处理单层 chapter，不处理嵌套
 */

import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/log-sanitizer';

// =============================================================================
// Types
// =============================================================================

export interface PRDRequirement {
  id: string;
  text: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface PRDStep {
  id: string;
  title: string;
  requirements: PRDRequirement[];
}

export interface PRDChapter {
  id: string;
  title: string;
  steps: PRDStep[];
}

export interface PRDDocument {
  id: string;
  title: string;
  chapters: PRDChapter[];
}

export interface CanvasNode {
  id: string;
  type: 'context' | 'flow' | 'design';
  label: string;
  metadata: {
    sourceType: 'chapter' | 'step' | 'requirement';
    sourceId: string;
    priority?: 'P0' | 'P1' | 'P2';
    text?: string;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface FromPRDResponse {
  nodes: {
    leftPanel: CanvasNode[];    // chapters → context
    centerPanel: CanvasNode[];  // steps → flow
    rightPanel: CanvasNode[];    // requirements → design
  };
  edges: CanvasEdge[];
}

export interface FromPRDRequest {
  prd: PRDDocument;
}

// =============================================================================
// Mapping Logic
// =============================================================================

function generateNodeId(prefix: string, sourceId: string): string {
  return `${prefix}-${sourceId}`;
}

/**
 * mapPRDToCanvas — 将 PRDDocument 映射为 Canvas 三栏节点 + edges
 *
 * MVP 约束：只处理单层 chapter，忽略嵌套结构
 */
export function mapPRDToCanvas(prd: PRDDocument): FromPRDResponse {
  const leftPanel: CanvasNode[] = [];    // PRD chapters
  const centerPanel: CanvasNode[] = [];  // PRD steps
  const rightPanel: CanvasNode[] = [];   // PRD requirements
  const edges: CanvasEdge[] = [];

  let edgeCounter = 0;

  for (const chapter of prd.chapters) {
    // Chapter → 左栏 context 节点
    const chapterNodeId = generateNodeId('ctx', chapter.id);
    leftPanel.push({
      id: chapterNodeId,
      type: 'context',
      label: chapter.title,
      metadata: {
        sourceType: 'chapter',
        sourceId: chapter.id,
      },
    });

    for (const step of chapter.steps) {
      // Step → 中栏 flow 节点
      const stepNodeId = generateNodeId('flow', step.id);
      centerPanel.push({
        id: stepNodeId,
        type: 'flow',
        label: step.title,
        metadata: {
          sourceType: 'step',
          sourceId: step.id,
        },
      });

      // Edge: chapter → step
      edges.push({
        id: `edge-${++edgeCounter}`,
        source: chapterNodeId,
        target: stepNodeId,
        type: 'chapter-to-step',
      });

      for (const req of step.requirements) {
        // Requirement → 右栏 design 节点
        const reqNodeId = generateNodeId('design', req.id);
        rightPanel.push({
          id: reqNodeId,
          type: 'design',
          label: req.text,
          metadata: {
            sourceType: 'requirement',
            sourceId: req.id,
            priority: req.priority,
            text: req.text,
          },
        });

        // Edge: step → requirement
        edges.push({
          id: `edge-${++edgeCounter}`,
          source: stepNodeId,
          target: reqNodeId,
          type: 'step-to-requirement',
        });
      }
    }
  }

  return { nodes: { leftPanel, centerPanel, rightPanel }, edges };
}

// =============================================================================
// Route Handler
// =============================================================================

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: FromPRDRequest = await request.json();
    const { prd } = body;

    // Validation
    if (!prd || typeof prd !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid PRD document' },
        { status: 400 }
      );
    }

    if (!Array.isArray(prd.chapters)) {
      return NextResponse.json(
        { success: false, error: 'prd.chapters must be an array' },
        { status: 400 }
      );
    }

    // Map PRD to Canvas
    const result = mapPRDToCanvas(prd);

    // AGENTS.md E05 验收标准
    // - nodes.leftPanel.length === prd.chapters.length
    // - nodes.centerPanel.length === total steps
    // - nodes.rightPanel.length === total requirements
    // - edges.length > 0

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    safeError('[/api/v1/canvas/from-prd] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
