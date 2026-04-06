"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateComponentsResponseSchema = exports.ComponentSchema = exports.ComponentApiSchema = exports.GenerateFlowsResponseSchema = exports.BusinessFlowSchema = exports.BusinessFlowStepSchema = exports.GenerateContextsResponseSchema = exports.BoundedContextSchema = void 0;
exports.isValidGenerateContextsResponse = isValidGenerateContextsResponse;
exports.isValidGenerateFlowsResponse = isValidGenerateFlowsResponse;
exports.isValidGenerateComponentsResponse = isValidGenerateComponentsResponse;
/**
 * @fileoverview Canvas API Zod Schemas — Shared between frontend and backend
 *
 * Used by both:
 *   - frontend: src/lib/canvas/api/canvasApiValidation.ts
 *   - backend:  API response validation
 *
 * Schema definitions for Epic: Zod Schema 统一 (E1)
 */
const zod_1 = require("zod");
// =============================================================================
// Contexts API
// =============================================================================
exports.BoundedContextSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.enum(['core', 'supporting', 'generic', 'external']),
});
exports.GenerateContextsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    contexts: zod_1.z.array(exports.BoundedContextSchema),
    generationId: zod_1.z.string(),
    confidence: zod_1.z.number(),
    error: zod_1.z.string().optional(),
});
// =============================================================================
// Flows API
// =============================================================================
exports.BusinessFlowStepSchema = zod_1.z.object({
    name: zod_1.z.string(),
    actor: zod_1.z.string(),
    description: zod_1.z.string(),
    order: zod_1.z.number(),
});
exports.BusinessFlowSchema = zod_1.z.object({
    name: zod_1.z.string(),
    contextId: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    steps: zod_1.z.array(exports.BusinessFlowStepSchema),
});
exports.GenerateFlowsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    flows: zod_1.z.array(exports.BusinessFlowSchema),
    confidence: zod_1.z.number(),
    error: zod_1.z.string().optional(),
});
// =============================================================================
// Components API
// =============================================================================
exports.ComponentApiSchema = zod_1.z.object({
    method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: zod_1.z.string(),
    params: zod_1.z.array(zod_1.z.string()),
});
exports.ComponentSchema = zod_1.z.object({
    name: zod_1.z.string(),
    flowId: zod_1.z.string(),
    type: zod_1.z.enum(['page', 'form', 'list', 'detail', 'modal']),
    description: zod_1.z.string().optional(),
    api: exports.ComponentApiSchema.optional(),
});
exports.GenerateComponentsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    components: zod_1.z.array(exports.ComponentSchema),
    confidence: zod_1.z.number(),
    error: zod_1.z.string().optional(),
});
// =============================================================================
// Validators (type guard wrappers)
// =============================================================================
function isValidGenerateContextsResponse(value) {
    return exports.GenerateContextsResponseSchema.safeParse(value).success;
}
function isValidGenerateFlowsResponse(value) {
    return exports.GenerateFlowsResponseSchema.safeParse(value).success;
}
function isValidGenerateComponentsResponse(value) {
    return exports.GenerateComponentsResponseSchema.safeParse(value).success;
}
