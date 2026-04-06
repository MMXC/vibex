/**
 * @fileoverview Canvas Zod Schemas
 * 
 * Part of: api-input-validation-layer / Epic E3
 * Validates canvas API requests (bounded contexts, flows, components)
 */

import { z } from 'zod';
import { nonEmptyStringSchema } from './common';

// ==================== Bounded Context ====================

/**
 * Bounded context schema (used in flow/component generation)
 */
export const boundedContextSchema = z.object({
  id: z.string(),
  name: nonEmptyStringSchema,
  description: z.string(),
  type: z.enum(['core', 'supporting', 'generic', 'external']).default('core'),
});

export type BoundedContextInput = z.infer<typeof boundedContextSchema>;

// ==================== Flow Step ====================

/**
 * Flow step schema
 */
export const flowStepSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyStringSchema,
  actor: nonEmptyStringSchema,
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export type FlowStepInput = z.infer<typeof flowStepSchema>;

// ==================== Business Flow ====================

/**
 * Business flow schema
 */
export const businessFlowSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyStringSchema,
  contextId: z.string(),
  description: z.string().optional(),
  steps: z.array(flowStepSchema),
  confidence: z.number().optional(),
});

export type BusinessFlowInput = z.infer<typeof businessFlowSchema>;

// ==================== Generate Contexts Request ====================

/**
 * Generate bounded contexts request body
 */
export const generateContextsSchema = z.object({
  requirementText: nonEmptyStringSchema,
  projectId: z.string().optional(),
}).strict();

export type GenerateContextsInput = z.infer<typeof generateContextsSchema>;

// ==================== Generate Flows Request ====================

/**
 * Generate business flows request body
 */
export const generateFlowsSchema = z.object({
  contexts: z.array(boundedContextSchema).min(1, 'At least one context is required'),
  sessionId: z.string(),
}).strict();

export type GenerateFlowsInput = z.infer<typeof generateFlowsSchema>;

// ==================== Generate Components Request ====================

/**
 * Generate components request body
 */
export const generateComponentsSchema = z.object({
  contexts: z.array(boundedContextSchema).min(1, 'At least one context is required'),
  flows: z.array(businessFlowSchema).min(1, 'At least one flow is required'),
  sessionId: z.string(),
}).strict();

export type GenerateComponentsInput = z.infer<typeof generateComponentsSchema>;

// ==================== Response Schemas ====================

/**
 * Canvas generation success response base
 */
const canvasSuccessBaseSchema = z.object({
  success: z.literal(true),
  generationId: z.string(),
});

/**
 * Generate contexts response
 */
export const generateContextsResponseSchema = z.object({
  success: z.literal(true),
  contexts: z.array(boundedContextSchema),
  generationId: z.string(),
  confidence: z.number(),
});

export type GenerateContextsResponse = z.infer<typeof generateContextsResponseSchema>;

/**
 * Generate flows response
 */
export const generateFlowsResponseSchema = canvasSuccessBaseSchema.extend({
  flows: z.array(businessFlowSchema),
  confidence: z.number(),
});

export type GenerateFlowsResponse = z.infer<typeof generateFlowsResponseSchema>;

/**
 * Component API definition
 */
export const componentApiSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
  params: z.array(z.string()),
});

export type ComponentApi = z.infer<typeof componentApiSchema>;

/**
 * Component node schema
 */
export const componentNodeSchema = z.object({
  flowId: z.string(),
  name: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
  api: componentApiSchema,
});

export type ComponentNode = z.infer<typeof componentNodeSchema>;

/**
 * Generate components response
 */
export const generateComponentsResponseSchema = canvasSuccessBaseSchema.extend({
  components: z.array(componentNodeSchema),
});

export type GenerateComponentsResponse = z.infer<typeof generateComponentsResponseSchema>;
