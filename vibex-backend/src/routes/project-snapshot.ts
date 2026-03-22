/**
 * Project Snapshot API
 * 
 * GET /api/projects?id=&include=snapshot - Get complete project snapshot
 * 
 * Based on: docs/vibex-simplified-flow/specs/SPEC-03-project-snapshot.md
 */

import { Hono } from 'hono'
import { queryDB, queryOne, Env } from '@/lib/db'
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

    // TODO: In production, query actual step state from StepState table
    // For now, return empty/default state
    const stepState: StepState = {
      projectId,
      currentStep: 1,
      version: 1,
      lastModified: project.updatedAt,
      lastModifiedBy: project.userId,
      step1: null,
      step2: null,
      step3: null,
    }

    // TODO: Query actual domains from DomainEntity table
    const domains: (BusinessDomain & { features: Feature[] })[] = []

    // TODO: Query actual flow from FlowData table
    const flow: FlowData | undefined = undefined

    // TODO: Query actual UI nodes
    const uiNodes: UINode[] = []

    // TODO: Query actual history from ChangeLog table
    const history: ChangeEntry[] = []

    // Compute snapshot meta
    const snapshotMeta: SnapshotMeta = {
      totalDomains: domains.length,
      totalFeatures: domains.reduce((sum, d) => sum + d.features.length, 0),
      totalNodes: flow?.nodes.length ?? 0,
      totalUINodes: uiNodes.length,
      checkedFeaturesCount: domains.reduce(
        (sum, d) => sum + d.features.filter(f => f.isSelected).length,
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
    console.error('Error getting project snapshot:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get snapshot',
      code: 'INTERNAL_ERROR',
    }
  }
}

export default projectSnapshot
