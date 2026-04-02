/**
 * @fileoverview Auth Zod Schemas
 * 
 * Part of: api-input-validation-layer / Epic E1
 * Validates authentication-related requests
 */

import { z } from 'zod';
import { emailSchema, passwordSchema, optionalStringSchema, nonEmptyStringSchema } from './common';

// ==================== Register ====================

/**
 * Register request body schema
 * - Strict mode rejects extra fields
 * - All refine() calls have message parameters
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: optionalStringSchema,
  })
  .strict(); // Reject extra fields

export type RegisterInput = z.infer<typeof registerSchema>;

// ==================== Login ====================

/**
 * Login request body schema
 */
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

// ==================== User Response ====================

/**
 * User object in responses
 */
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

// ==================== Auth Response ====================

/**
 * Login/Register success response
 */
export const authSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    token: z.string(),
    user: userResponseSchema,
  }),
});

export type AuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;

// ==================== Me (Current User) ====================

/**
 * Get current user response
 */
export const meResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: userResponseSchema,
  }),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
