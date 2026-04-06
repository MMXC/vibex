"use strict";
/**
 * @fileoverview Canvas Zod Schemas — Shared across packages
 *
 * Part of: E3-packages/types
 * Validates canvas API requests (bounded contexts, flows, components)
 *
 * Usage in backend:
 *   import { boundedContextSchema } from '@vibex/types/schemas/canvas'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasGenerateSchema = exports.generateComponentsResponseSchema = exports.componentNodeSchema = exports.componentApiSchema = exports.generateFlowsResponseSchema = exports.generateContextsResponseSchema = exports.generateComponentsSchema = exports.generateFlowsSchema = exports.generateContextsSchema = exports.businessFlowSchema = exports.flowStepSchema = exports.boundedContextSchema = void 0;
const zod_1 = require("zod");
const common_js_1 = require("./common.js");
// ==================== Bounded Context ====================
/**
 * Bounded context schema (used in flow/component generation)
 */
exports.boundedContextSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: common_js_1.nonEmptyStringSchema,
    description: zod_1.z.string(),
    type: zod_1.z.enum(['core', 'supporting', 'generic', 'external']).default('core'),
});
// ==================== Flow Step ====================
/**
 * Flow step schema
 */
exports.flowStepSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: common_js_1.nonEmptyStringSchema,
    actor: common_js_1.nonEmptyStringSchema,
    description: zod_1.z.string().optional(),
    order: zod_1.z.number().int().optional(),
});
// ==================== Business Flow ====================
/**
 * Business flow schema
 */
exports.businessFlowSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: common_js_1.nonEmptyStringSchema,
    contextId: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    steps: zod_1.z.array(exports.flowStepSchema),
    confidence: zod_1.z.number().optional(),
});
// ==================== Generate Contexts Request ====================
/**
 * Generate bounded contexts request body
 */
exports.generateContextsSchema = zod_1.z.object({
    requirementText: common_js_1.nonEmptyStringSchema,
    projectId: zod_1.z.string().optional(),
}).strict();
// ==================== Generate Flows Request ====================
/**
 * Generate business flows request body
 */
exports.generateFlowsSchema = zod_1.z.object({
    contexts: zod_1.z.array(exports.boundedContextSchema).min(1, 'At least one context is required'),
    sessionId: zod_1.z.string(),
}).strict();
// ==================== Generate Components Request ====================
/**
 * Generate components request body
 */
exports.generateComponentsSchema = zod_1.z.object({
    contexts: zod_1.z.array(exports.boundedContextSchema).min(1, 'At least one context is required'),
    flows: zod_1.z.array(exports.businessFlowSchema).min(1, 'At least one flow is required'),
    sessionId: zod_1.z.string(),
}).strict();
// ==================== Response Schemas ====================
/**
 * Canvas generation success response base
 */
const canvasSuccessBaseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    generationId: zod_1.z.string(),
});
/**
 * Generate contexts response
 */
exports.generateContextsResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    contexts: zod_1.z.array(exports.boundedContextSchema),
    generationId: zod_1.z.string(),
    confidence: zod_1.z.number(),
});
/**
 * Generate flows response
 */
exports.generateFlowsResponseSchema = canvasSuccessBaseSchema.extend({
    flows: zod_1.z.array(exports.businessFlowSchema),
    confidence: zod_1.z.number(),
});
/**
 * Component API definition
 */
exports.componentApiSchema = zod_1.z.object({
    method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: zod_1.z.string(),
    params: zod_1.z.array(zod_1.z.string()),
});
/**
 * Component node schema
 */
exports.componentNodeSchema = zod_1.z.object({
    flowId: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.string(),
    props: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    api: exports.componentApiSchema,
});
/**
 * Generate components response
 */
exports.generateComponentsResponseSchema = canvasSuccessBaseSchema.extend({
    components: zod_1.z.array(exports.componentNodeSchema),
});
// ==================== Canvas Generate ====================
/**
 * Canvas generate request body (POST /api/v1/canvas/generate)
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 */
exports.canvasGenerateSchema = zod_1.z.object({
    projectId: zod_1.z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format'),
    pageIds: zod_1.z.array(zod_1.z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format')).min(1, 'pageIds must have at least one element'),
    mode: zod_1.z.enum(['parallel', 'sequential']).optional().default('parallel'),
}).strict();
