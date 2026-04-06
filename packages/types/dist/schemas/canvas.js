/**
 * @fileoverview Canvas Zod Schemas — Shared across packages
 *
 * Part of: E3-packages/types
 * Validates canvas API requests (bounded contexts, flows, components)
 *
 * Usage in backend:
 *   import { boundedContextSchema } from '@vibex/types/schemas/canvas'
 */
import { z } from 'zod';
import { nonEmptyStringSchema } from './common.js';
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
// ==================== Generate Contexts Request ====================
/**
 * Generate bounded contexts request body
 */
export const generateContextsSchema = z.object({
    requirementText: nonEmptyStringSchema,
    projectId: z.string().optional(),
}).strict();
// ==================== Generate Flows Request ====================
/**
 * Generate business flows request body
 */
export const generateFlowsSchema = z.object({
    contexts: z.array(boundedContextSchema).min(1, 'At least one context is required'),
    sessionId: z.string(),
}).strict();
// ==================== Generate Components Request ====================
/**
 * Generate components request body
 */
export const generateComponentsSchema = z.object({
    contexts: z.array(boundedContextSchema).min(1, 'At least one context is required'),
    flows: z.array(businessFlowSchema).min(1, 'At least one flow is required'),
    sessionId: z.string(),
}).strict();
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
/**
 * Generate flows response
 */
export const generateFlowsResponseSchema = canvasSuccessBaseSchema.extend({
    flows: z.array(businessFlowSchema),
    confidence: z.number(),
});
/**
 * Component API definition
 */
export const componentApiSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string(),
    params: z.array(z.string()),
});
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
/**
 * Generate components response
 */
export const generateComponentsResponseSchema = canvasSuccessBaseSchema.extend({
    components: z.array(componentNodeSchema),
});
// ==================== Canvas Generate ====================
/**
 * Canvas generate request body (POST /api/v1/canvas/generate)
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 */
export const canvasGenerateSchema = z.object({
    projectId: z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format'),
    pageIds: z.array(z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format')).min(1, 'pageIds must have at least one element'),
    mode: z.enum(['parallel', 'sequential']).optional().default('parallel'),
}).strict();
