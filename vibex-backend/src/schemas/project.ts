/**
 * @fileoverview Project Zod Schemas
 * 
 * Part of: api-input-validation-layer / Epic E3
 * Validates project-related requests (Auth, Projects, Canvas routes)
 */

import { z } from 'zod';
import { nonEmptyStringSchema, optionalStringSchema } from './common';

// ==================== Create Project ====================

/**
 * Create project request body schema
 * - Strict mode rejects extra fields
 * - All refine() calls have message parameters
 */
export const createProjectSchema = z.object({
  name: nonEmptyStringSchema,
  description: optionalStringSchema,
  userId: nonEmptyStringSchema,
}).strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ==================== Update Project ====================

/**
 * Update project request body schema
 * - All fields optional (partial update)
 * - status enum validated
 */
export const updateProjectSchema = z.object({
  name: nonEmptyStringSchema.optional(),
  description: optionalStringSchema,
  status: z.enum(['draft', 'active', 'converted', 'archived']).optional(),
  version: z.number().int().positive('Version must be a positive integer'),
}).strict();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ==================== Project Response ====================

/**
 * Project object in responses
 */
export const projectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  userId: z.string(),
  status: z.enum(['draft', 'active', 'converted', 'archived']),
  version: z.number().int(),
  isTemplate: z.boolean(),
  parentDraftId: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectResponse = z.infer<typeof projectResponseSchema>;

// ==================== Project List Query ====================

/**
 * Project list query parameters
 */
export const projectListQuerySchema = z.object({
  userId: z.string().optional(),
  include: z.enum(['snapshot']).optional(),
  id: z.string().optional(),
  version: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined) return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : num;
  }),
}).strict();

export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

// ==================== Project List Response ====================

/**
 * Project list response schema
 */
export const projectListResponseSchema = z.object({
  success: z.literal(true).optional(),
  projects: z.array(projectResponseSchema),
});

export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
