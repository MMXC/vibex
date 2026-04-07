/**
 * Type guards for canvas data validation.
 * Part of: canvas-phase0-cleanup E1 Type Guards
 */

import type { BoundedContextNode, BusinessFlowNode, ComponentNode, FlowStep } from './types';

export function isValidContextNode(data: unknown): data is BoundedContextNode {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodeId' in data &&
    'name' in data
  );
}

export function isValidContextNodes(data: unknown): data is BoundedContextNode[] {
  return Array.isArray(data) && data.every(isValidContextNode);
}

export function isValidFlowNode(data: unknown): data is BusinessFlowNode {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodeId' in data &&
    'name' in data &&
    'steps' in data
  );
}

export function isValidFlowNodes(data: unknown): data is BusinessFlowNode[] {
  return Array.isArray(data) && data.every(isValidFlowNode);
}

export function isValidComponentNode(data: unknown): data is ComponentNode {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodeId' in data &&
    'name' in data
  );
}

export function isValidComponentNodes(data: unknown): data is ComponentNode[] {
  return Array.isArray(data) && data.every(isValidComponentNode);
}

export function isValidFlowStep(data: unknown): data is FlowStep {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data
  );
}
