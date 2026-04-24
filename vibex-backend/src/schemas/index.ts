/**
 * @fileoverview Schema Exports
 * 
 * Part of: api-input-validation-layer / Epic E1
 * Central export point for all Zod schemas
 */

// Common schemas
export * from './common';

// Auth schemas (use explicit to avoid conflict with security.ts)
export {
  registerSchema,
  type RegisterInput,
  loginSchema,
  type LoginInput,
  userResponseSchema,
  type UserResponse,
  authSuccessResponseSchema,
  type AuthSuccessResponse,
  meResponseSchema,
  type MeResponse,
} from './auth';

// Security schemas (E2: 高风险路由) — explicit to avoid conflict with auth.ts
export {
  githubOwnerSchema,
  githubRepoSchema,
  githubPathSchema,
  githubRepoParamsSchema,
  githubContentsParamsSchema,
  INJECTION_KEYWORDS,
  chatMessageSchema,
  type ChatMessage,
  planAnalyzeSchema,
  type PlanAnalyzeInput,
  loginSchema as securityLoginSchema,
  registerSchema as securityRegisterSchema,
  type LoginInput as SecurityLoginInput,
  type RegisterInput as SecurityRegisterInput,
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './security';

// Project schemas (E3: 中风险路由)
export * from './project';

// Canvas schemas (E3: 中风险路由)
export * from './canvas';
