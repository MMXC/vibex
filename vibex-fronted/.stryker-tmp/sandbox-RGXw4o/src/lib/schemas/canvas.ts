// @ts-nocheck
import { z } from 'zod';

export const BoundedContextSchema = z.object({
  nodeId: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['core', 'supporting', 'generic', 'external']),
  isActive: z.boolean().optional(),
  status: z.string(),
  children: z.array(z.string()),
});

export const FlowStepSchema = z.object({
  stepId: z.string(),
  name: z.string(),
  actor: z.string(),
  order: z.number(),
  isActive: z.boolean().optional(),
  status: z.string(),
});

export const ComponentNodeSchema = z.object({
  nodeId: z.string(),
  flowId: z.string(),
  name: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
  api: z.object({ method: z.string(), path: z.string() }),
  isActive: z.boolean().optional(),
  status: z.string(),
});

export type BoundedContext = z.infer<typeof BoundedContextSchema>;
export type FlowStep = z.infer<typeof FlowStepSchema>;
export type ComponentNode = z.infer<typeof ComponentNodeSchema>;
