/**
 * Requirement Status Service
 * 
 * Handles automatic status transitions for requirements based on
 * various events in the system lifecycle.
 */
// @ts-nocheck


import { Env, queryOne, executeDB } from '@/lib/db';

/**
 * Requirement status types
 */
export type RequirementStatus = 'draft' | 'analyzing' | 'clarified' | 'confirmed';

/**
 * Status transition events
 */
export type StatusEvent = 
  | 'created'           // New requirement created
  | 'analysis_started'  // AI analysis began
  | 'analysis_complete' // AI analysis finished
  | 'clarification_complete' // User finished clarifications
  | 'user_confirmed'    // User confirmed the model
  | 'reset';            // Reset to draft

/**
 * Valid status transitions map
 */
const VALID_TRANSITIONS: Record<RequirementStatus, StatusEvent[]> = {
  draft: ['analysis_started'],
  analyzing: ['analysis_complete', 'reset'],
  clarified: ['user_confirmed', 'reset'],
  confirmed: ['reset'],
};

/**
 * Status transition result
 */
export interface StatusTransitionResult {
  success: boolean;
  previousStatus: RequirementStatus | null;
  newStatus: RequirementStatus | null;
  error?: string;
}

/**
 * Get the next status based on current status and event
 */
function getNextStatus(currentStatus: RequirementStatus, event: StatusEvent): RequirementStatus | null {
  const transitions: Record<string, Partial<Record<StatusEvent, RequirementStatus>>> = {
    draft: {
      analysis_started: 'analyzing',
    },
    analyzing: {
      analysis_complete: 'clarified',
      reset: 'draft',
    },
    clarified: {
      user_confirmed: 'confirmed',
      reset: 'draft',
    },
    confirmed: {
      reset: 'draft',
    },
  };

  return transitions[currentStatus]?.[event] || null;
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(currentStatus: RequirementStatus, event: StatusEvent): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(event) || false;
}

/**
 * Transition requirement status
 * 
 * @param env - Environment bindings
 * @param requirementId - The requirement ID
 * @param event - The event triggering the transition
 * @returns Status transition result
 */
export async function transitionRequirementStatus(
  env: Env,
  requirementId: string,
  event: StatusEvent
): Promise<StatusTransitionResult> {
  try {
    // Get current requirement
    const requirement = await queryOne<{ status: string }>(
      env,
      'SELECT status FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return {
        success: false,
        previousStatus: null,
        newStatus: null,
        error: 'Requirement not found',
      };
    }

    const currentStatus = requirement.status as RequirementStatus;

    // Handle reset event specially
    if (event === 'reset') {
      await executeDB(
        env,
        'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
        ['draft', new Date().toISOString(), requirementId]
      );

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: 'draft',
      };
    }

    // Check if transition is valid
    if (!isValidTransition(currentStatus, event)) {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: null,
        error: `Invalid transition from ${currentStatus} on event ${event}`,
      };
    }

    // Get next status
    const newStatus = getNextStatus(currentStatus, event);

    if (!newStatus) {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: null,
        error: 'No valid next status',
      };
    }

    // Update status
    await executeDB(
      env,
      'UPDATE Requirement SET status = ?, updatedAt = ? WHERE id = ?',
      [newStatus, new Date().toISOString(), requirementId]
    );

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus,
    };
  } catch (error) {
    console.error('Error transitioning requirement status:', error);
    return {
      success: false,
      previousStatus: null,
      newStatus: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch update status for multiple requirements
 * 
 * @param env - Environment bindings
 * @param requirementIds - Array of requirement IDs
 * @param event - The event triggering the transition
 * @returns Array of transition results
 */
export async function batchTransitionStatus(
  env: Env,
  requirementIds: string[],
  event: StatusEvent
): Promise<StatusTransitionResult[]> {
  const results: StatusTransitionResult[] = [];

  for (const id of requirementIds) {
    const result = await transitionRequirementStatus(env, id, event);
    results.push(result);
  }

  return results;
}

/**
 * Get requirements by status
 */
export async function getRequirementsByStatus(
  env: Env,
  status: RequirementStatus,
  projectId?: string
): Promise<{ id: string; rawInput: string; status: string }[]> {
  let sql = 'SELECT id, rawInput, status FROM Requirement WHERE status = ?';
  const params: string[] = [status];

  if (projectId) {
    sql += ' AND projectId = ?';
    params.push(projectId);
  }

  sql += ' ORDER BY updatedAt DESC';

  const results = await queryOne<{ id: string; rawInput: string; status: string }[]>(
    env,
    sql,
    params
  );

  return results || [];
}

/**
 * Auto-transition based on data state
 * 
 * This function checks the current state of requirement data and
 * automatically determines if a status transition should occur.
 */
export async function autoTransitionBasedOnState(
  env: Env,
  requirementId: string
): Promise<StatusTransitionResult> {
  try {
    const requirement = await queryOne<{
      status: string;
      parsedData: string | null;
    }>(
      env,
      'SELECT status, parsedData FROM Requirement WHERE id = ?',
      [requirementId]
    );

    if (!requirement) {
      return {
        success: false,
        previousStatus: null,
        newStatus: null,
        error: 'Requirement not found',
      };
    }

    const currentStatus = requirement.status as RequirementStatus;

    // If analyzing and parsedData exists, transition to clarified
    if (currentStatus === 'analyzing' && requirement.parsedData) {
      try {
        const parsed = JSON.parse(requirement.parsedData);
        if (parsed.entities && parsed.relations) {
          return await transitionRequirementStatus(env, requirementId, 'analysis_complete');
        }
      } catch {
        // parsedData is not valid JSON, stay in analyzing
      }
    }

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus: currentStatus,
    };
  } catch (error) {
    console.error('Error in auto transition:', error);
    return {
      success: false,
      previousStatus: null,
      newStatus: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  transitionRequirementStatus,
  batchTransitionStatus,
  getRequirementsByStatus,
  autoTransitionBasedOnState,
  isValidTransition,
};