/**
 * API Type Definitions
 * 统一 API 类型定义
 */

import { z } from 'zod';

// ============ Auth Types ============
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().optional(),
  }),
  token: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============ Project Types ============
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

// ============ Requirement Types ============
export const RequirementSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  content: z.string(),
  completeness: z.number().min(0).max(100),
  status: z.enum(['pending', 'clarifying', 'confirmed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateRequirementRequestSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1),
});

export type Requirement = z.infer<typeof RequirementSchema>;
export type CreateRequirementRequest = z.infer<typeof CreateRequirementRequestSchema>;

// ============ Domain Entity Types ============
export const DomainEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  type: z.enum(['entity', 'valueObject', 'aggregate', 'service']),
  attributes: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
  })),
  relations: z.array(z.object({
    targetId: z.string(),
    type: z.enum(['hasOne', 'hasMany', 'belongsTo']),
    name: z.string(),
  })),
});

export type DomainEntity = z.infer<typeof DomainEntitySchema>;

// ============ Flow Types ============
export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'end', 'task', 'condition', 'parallel']),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

export const FlowSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
});

export type FlowNode = z.infer<typeof FlowNodeSchema>;
export type FlowEdge = z.infer<typeof FlowEdgeSchema>;
export type Flow = z.infer<typeof FlowSchema>;

// ============ Clarification Types ============
export const ClarifyMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const ClarifyRequestSchema = z.object({
  message: z.string(),
  history: z.array(ClarifyMessageSchema).optional(),
  projectId: z.string().optional(),
});

export const ClarifyResponseSchema = z.object({
  reply: z.string(),
  quickReplies: z.array(z.string()).optional(),
  completeness: z.number().min(0).max(100),
  nextAction: z.enum(['gather_more_info', 'confirm_requirement', 'generate_model', 'done']),
});

export type ClarifyMessage = z.infer<typeof ClarifyMessageSchema>;
export type ClarifyRequest = z.infer<typeof ClarifyRequestSchema>;
export type ClarifyResponse = z.infer<typeof ClarifyResponseSchema>;

// ============ API Response Types ============
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// ============ Utility Types ============
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

export type ApiState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };
