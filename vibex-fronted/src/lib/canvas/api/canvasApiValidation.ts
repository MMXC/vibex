/**
 * @fileoverview Canvas API Response Validation using Zod
 *
 * Epic: Zod Schema 统一 (E1)
 * Converts manual validators to Zod schema-based validation.
 */
import { z } from 'zod';
import type { GenerateContextsOutput, GenerateFlowsOutput, GenerateComponentsOutput } from '../types';

// =============================================================================
// Schemas
// =============================================================================

export const BoundedContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['core', 'supporting', 'generic', 'external']),
});

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

export const ComponentApiSchema = z.object({
  method: z.enum(['GET', 'POST']),
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

export const GenerateContextsResponseSchema = z.object({
  success: z.boolean(),
  contexts: z.array(BoundedContextSchema),
  generationId: z.string(),
  confidence: z.number(),
  error: z.string().optional(),
});

export const GenerateFlowsResponseSchema = z.object({
  success: z.boolean(),
  flows: z.array(BusinessFlowSchema),
  confidence: z.number(),
  error: z.string().optional(),
});

export const GenerateComponentsResponseSchema = z.object({
  success: z.boolean(),
  components: z.array(ComponentSchema),
  confidence: z.number(),
  error: z.string().optional(),
});

// =============================================================================
// Validators
// =============================================================================

export function isValidGenerateContextsResponse(value: unknown): value is GenerateContextsOutput {
  return GenerateContextsResponseSchema.safeParse(value).success;
}

export function isValidGenerateFlowsResponse(value: unknown): value is GenerateFlowsOutput {
  return GenerateFlowsResponseSchema.safeParse(value).success;
}

export function isValidGenerateComponentsResponse(value: unknown): value is GenerateComponentsOutput {
  return GenerateComponentsResponseSchema.safeParse(value).success;
}
