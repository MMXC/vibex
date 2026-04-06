/**
 * Project Snapshot API
 * 
 * GET /api/projects?id=&include=snapshot - Get complete project snapshot
 * 
 * Based on: docs/vibex-simplified-flow/specs/SPEC-03-project-snapshot.md
 */

import { Hono } from 'hono'
import { queryDB, queryOne, Env } from '@/lib/db'
import { safeError } from '@/lib/log-sanitizer';

import type {
  ProjectSnapshot,
  SnapshotMeta,
  BusinessDomain,
  Feature,
  FlowData,
  UINode,
  ChangeEntry,
  StepState,
} from '@/types/simplified-flow'

const projectSnapshot = new Hono<{ Bindings: Env }>()

// ==================== GET /api/projects?id=&include=snapshot ====================
// This is an extension of the existing /api/projects route
// The actual route is registered in index.ts

export async function getProjectSnapshot(
  env: Env,
  projectId: string,
  version?: number
): Promise<{ success: boolean; data?: ProjectSnapshot; error?: string; code?: string }> {
  try {
    // Get project
    const projectRows = await queryDB<any>(
      env,
      'SELECT * FROM Project WHERE id = ? AND deletedAt IS NULL',
      [projectId]
    )

    if (!projectRows || projectRows.length === 0) {
      return { success: false, error: 'Project not found', code: 'NOT_FOUND' }
    }

    const project = projectRows[0]

    // E2-S1: Query actual step state from StepState table
    const stepStateRows = await queryDB<any>(
      env,
      'SELECT * FROM StepState WHERE projectId = ?',
      [projectId]
    );
    let stepState: StepState = {
      projectId,
      currentStep: 1,
      version: 1,
      lastModified: project.updatedAt,
      lastModifiedBy: project.userId,
      step1: null,
      step2: null,
      step3: null,
    };
    if (stepStateRows && stepStateRows.length > 0) {
      const ss = stepStateRows[0];
      stepState = {
        projectId: ss.projectId,
        currentStep: ss.currentStep as 1 | 2 | 3,
        version: ss.version,
        lastModified: ss.updatedAt,
        lastModifiedBy: ss.lastModifiedBy,
        step1: ss.step1Data ? JSON.parse(ss.step1Data) : null,
        step2: ss.step2Data ? JSON.parse(ss.step2Data) : null,
        step3: ss.step3Data ? JSON.parse(ss.step3Data) : null,
      };
    }

    // E2-S1: Query actual domains from BusinessDomain table
    const domainRows = await queryDB<any>(
      env,
      'SELECT * FROM BusinessDomain WHERE projectId = ? AND deletedAt IS NULL',
      [projectId]
    );
    const domains = (domainRows || []) as any[];

    // E2-S1: Query actual flow from FlowData table
    const flowRows = await queryDB<any>(
      env,
      'SELECT * FROM FlowData WHERE projectId = ? AND deletedAt IS NULL LIMIT 1',
      [projectId]
    );
    let flow: FlowData | undefined;
    if (flowRows && flowRows.length > 0) {
      const f = flowRows[0] as any;
      flow = {
        id: f.id,
        projectId: f.projectId,
        nodes: f.nodes ? JSON.parse(f.nodes) : [],
        edges: f.edges ? JSON.parse(f.edges) : [],
        metadata: {},
      } as any;
    }

    // E2-S1: Query actual UI nodes from UINode table
    const uiNodeRows = await queryDB<any>(
      env,
      'SELECT * FROM UINode WHERE projectId = ? AND deletedAt IS NULL',
      [projectId]
    );
    const uiNodes = (uiNodeRows || []) as any[];

    // E2-S1: Query actual history from ChangeLog table
    const historyRows = await queryDB<any>(
      env,
      'SELECT * FROM ChangeLog WHERE projectId = ? ORDER BY version DESC LIMIT 50',
      [projectId]
    );
    const history = (historyRows || []) as any[];

    // Compute snapshot meta
    const snapshotMeta: SnapshotMeta = {
      totalDomains: domains.length,
      totalFeatures: domains.reduce((sum, d) => sum + d.features.length, 0),
      totalNodes: flow?.nodes.length ?? 0,
      totalUINodes: uiNodes.length,
      checkedFeaturesCount: domains.reduce(
        (sum: number, d: any) => sum + ((d.features || []).filter((f: any) => f.isSelected).length),
        0
      ),
      lastModified: stepState.lastModified,
      historyCount: history.length,
    }

    const snapshot: ProjectSnapshot = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        status: 'draft',
        userId: project.userId,
        version: 1,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        isTemplate: false,
      },
      stepState,
      domains,
      flow,
      uiNodes,
      history,
      snapshotMeta,
    }

    return { success: true, data: snapshot }
  } catch (error) {
    safeError('Error getting project snapshot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get snapshot',
      code: 'INTERNAL_ERROR',
    }
  }
}

export default projectSnapshot
