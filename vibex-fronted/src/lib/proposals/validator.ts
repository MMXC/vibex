/**
 * Proposal Validator — Validate agent proposal format and content.
 *
 * Validates structured proposals (from parser.ts output) against format rules.
 */

import type { Proposal } from './parser';

export const VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
export const VALID_EFFORTS = ['S', 'M', 'L', 'XL', 'XXL', '1d', '2d', '3d', '5d', '1w', '2w'] as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  proposalId: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  total: number;
  validCount: number;
  invalidCount: number;
  errors: ValidationError[];
}

// ── Core validation ───────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof Proposal)[] = ['title', 'description', 'priority'];

function validateProposal(proposal: Proposal): ValidationError[] {
  const errors: ValidationError[] = [];
  const pid = proposal.id || 'unknown';

  // Required field checks
  for (const field of REQUIRED_FIELDS) {
    if (!proposal[field] || String(proposal[field]).trim() === '') {
      errors.push({
        field,
        message: `Missing required field '${field}'`,
        proposalId: pid,
        severity: 'error',
      });
    }
  }

  // Priority validation
  const priority = proposal.priority ?? '';
  if (priority && !VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number])) {
    errors.push({
      field: 'priority',
      message: `Invalid priority '${priority}'. Expected one of ${VALID_PRIORITIES.join(', ')}`,
      proposalId: pid,
      severity: 'error',
    });
  }

  // Effort validation
  const effort = proposal.effort ?? '';
  if (effort && !VALID_EFFORTS.includes(effort as typeof VALID_EFFORTS[number])) {
    errors.push({
      field: 'effort',
      message: `Unusual effort '${effort}'. Expected one of ${VALID_EFFORTS.join(', ')}`,
      proposalId: pid,
      severity: 'warning',
    });
  }

  // Title length
  const title = proposal.title ?? '';
  if (title && title.length < 5) {
    errors.push({
      field: 'title',
      message: 'Title too short (< 5 chars)',
      proposalId: pid,
      severity: 'error',
    });
  }
  if (title && title.length > 200) {
    errors.push({
      field: 'title',
      message: 'Title too long (> 200 chars)',
      proposalId: pid,
      severity: 'warning',
    });
  }

  // Description length
  const description = proposal.description ?? '';
  if (description && description.length < 10) {
    errors.push({
      field: 'description',
      message: 'Description too short (< 10 chars)',
      proposalId: pid,
      severity: 'error',
    });
  }

  // Tags validation
  const tags = proposal.tags ?? [];
  if (tags && !Array.isArray(tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      proposalId: pid,
      severity: 'error',
    });
  } else if (tags && tags.length > 10) {
    errors.push({
      field: 'tags',
      message: 'Too many tags (> 10)',
      proposalId: pid,
      severity: 'warning',
    });
  }

  return errors;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validate a list of proposals.
 */
export function validateProposals(proposals: Proposal[]): ValidationResult {
  let validCount = 0;
  const allErrors: ValidationError[] = [];

  for (const proposal of proposals) {
    const errors = validateProposal(proposal);
    allErrors.push(...errors);
    if (errors.filter((e) => e.severity === 'error').length === 0) {
      validCount++;
    }
  }

  const errorErrors = allErrors.filter((e) => e.severity === 'error');

  return {
    valid: errorErrors.length === 0,
    total: proposals.length,
    validCount,
    invalidCount: proposals.length - validCount,
    errors: allErrors,
  };
}

export default { validateProposals };
