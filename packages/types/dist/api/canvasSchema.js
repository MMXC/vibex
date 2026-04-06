/**
 * @fileoverview Canvas API Zod Schemas — Shared between frontend and backend
 *
 * Used by both:
 *   - frontend: src/lib/canvas/api/canvasApiValidation.ts
 *   - backend:  API response validation
 *
 * Schema definitions for Epic: Zod Schema 统一 (E1)
 */
import { z } from 'zod';
// =============================================================================
// Contexts API
// =============================================================================
export const BoundedContextSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['core', 'supporting', 'generic', 'external']),
});
export const GenerateContextsResponseSchema = z.object({
    success: z.boolean(),
    contexts: z.array(BoundedContextSchema),
    generationId: z.string(),
    confidence: z.number(),
    error: z.string().optional(),
});
// =============================================================================
// Flows API
// =============================================================================
export const BusinessFlowStepSchema = z.object({
    name: z.string(),
    actor: z.string(),
    description: z.string(),
    order: z.number(),
});
export const BusinessFlowSchema = z.object({
    name: z.string(),
    contextId: z.string(),
    description: z.string().optional(),
    steps: z.array(BusinessFlowStepSchema),
});
export const GenerateFlowsResponseSchema = z.object({
    success: z.boolean(),
    flows: z.array(BusinessFlowSchema),
    confidence: z.number(),
    error: z.string().optional(),
});
// =============================================================================
// Components API
// =============================================================================
export const ComponentApiSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string(),
    params: z.array(z.string()),
});
export const ComponentSchema = z.object({
    name: z.string(),
    flowId: z.string(),
    type: z.enum(['page', 'form', 'list', 'detail', 'modal']),
    description: z.string().optional(),
    api: ComponentApiSchema.optional(),
});
export const GenerateComponentsResponseSchema = z.object({
    success: z.boolean(),
    components: z.array(ComponentSchema),
    confidence: z.number(),
    error: z.string().optional(),
});
// =============================================================================
// Validators (type guard wrappers)
// =============================================================================
export function isValidGenerateContextsResponse(value) {
    return GenerateContextsResponseSchema.safeParse(value).success;
}
export function isValidGenerateFlowsResponse(value) {
    return GenerateFlowsResponseSchema.safeParse(value).success;
}
export function isValidGenerateComponentsResponse(value) {
    return GenerateComponentsResponseSchema.safeParse(value).success;
}
