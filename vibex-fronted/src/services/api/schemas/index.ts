/**
 * API Response Types - Zod Schemas
 * 
 * This file defines precise API response types using Zod for runtime validation.
 * All API responses should be validated against these schemas.
 */

import { z } from 'zod';

// ==================== Common Types ====================

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });

// ==================== Auth Types ====================

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: AuthUserSchema,
});

export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  user: AuthUserSchema,
});

// ==================== Agent Types ====================

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(), // 'assistant' | 'user' | 'system'
  status: z.string(), // 'active' | 'inactive' | 'deleted'
  userId: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const AgentCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  userId: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const AgentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const AgentListResponseSchema = z.object({
  agents: z.array(AgentSchema),
});

export const AgentResponseSchema = z.object({
  agent: AgentSchema,
});

// ==================== Project Types ====================

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.string(), // 'draft' | 'active' | 'completed' | 'archived'
  userId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string(),
});

export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
});

export const ProjectResponseSchema = z.object({
  project: ProjectSchema,
});

// ==================== Page Types ====================

export const PageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  path: z.string(),
  type: z.string(), // 'page' | 'layout' | 'component'
  content: z.unknown().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const PageCreateSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  path: z.string(),
  type: z.string(),
  content: z.unknown().optional(),
});

export const PageUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  path: z.string().optional(),
  content: z.unknown().optional(),
});

export const PageListResponseSchema = z.object({
  pages: z.array(PageSchema),
});

export const PageResponseSchema = z.object({
  page: PageSchema,
});

// ==================== Message Types ====================

export const MessageSchema = z.object({
  id: z.string(),
  role: z.string(), // 'user' | 'assistant' | 'system'
  content: z.string(),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export const MessageCreateSchema = z.object({
  role: z.string(),
  content: z.string().min(1),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
});

export const MessageListResponseSchema = z.object({
  messages: z.array(MessageSchema),
});

// ==================== User Types ====================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const UserResponseSchema = z.object({
  user: UserSchema,
});

// ==================== Flow Types ====================

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.unknown()),
});

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  label: z.string().optional(),
});

export const FlowSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const FlowCreateSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  nodes: z.array(FlowNodeSchema).optional(),
  edges: z.array(FlowEdgeSchema).optional(),
});

export const FlowResponseSchema = z.object({
  flow: FlowSchema,
});

// ==================== DDD Types ====================

export const BoundedContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const DomainModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(), // 'entity' | 'valueObject' | 'aggregate' | 'service'
  properties: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
  })),
  projectId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const BusinessFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(z.object({
    order: z.number(),
    action: z.string(),
    actor: z.string().optional(),
  })),
  projectId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const BoundedContextResponseSchema = z.object({
  boundedContext: BoundedContextSchema,
});

export const DomainModelResponseSchema = z.object({
  domainModel: DomainModelSchema,
});

export const BusinessFlowResponseSchema = z.object({
  businessFlow: BusinessFlowSchema,
});

// ==================== Requirement Types ====================

export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(), // 'draft' | 'clarifying' | 'confirmed' | 'implemented'
  priority: z.string().optional(), // 'low' | 'medium' | 'high'
  projectId: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const RequirementCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  priority: z.string().optional(),
});

export const RequirementListResponseSchema = z.object({
  requirements: z.array(RequirementSchema),
});

export const RequirementResponseSchema = z.object({
  requirement: RequirementSchema,
});

// ==================== Prototype Types ====================

export const PrototypeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  type: z.string(), // 'static' | 'interactive'
  url: z.string().url().optional(),
  createdAt: z.string().datetime().optional(),
});

export const PrototypeResponseSchema = z.object({
  prototype: PrototypeSchema,
});

// ==================== Type Exports ====================

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type AgentCreate = z.infer<typeof AgentCreateSchema>;
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>;
export type AgentListResponse = z.infer<typeof AgentListResponseSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type Page = z.infer<typeof PageSchema>;
export type PageCreate = z.infer<typeof PageCreateSchema>;
export type PageUpdate = z.infer<typeof PageUpdateSchema>;
export type PageListResponse = z.infer<typeof PageListResponseSchema>;
export type PageResponse = z.infer<typeof PageResponseSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessageListResponse = z.infer<typeof MessageListResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type FlowCreate = z.infer<typeof FlowCreateSchema>;
export type FlowResponse = z.infer<typeof FlowResponseSchema>;
export type BoundedContext = z.infer<typeof BoundedContextSchema>;
export type DomainModel = z.infer<typeof DomainModelSchema>;
export type BusinessFlow = z.infer<typeof BusinessFlowSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementCreate = z.infer<typeof RequirementCreateSchema>;
export type RequirementListResponse = z.infer<typeof RequirementListResponseSchema>;
export type Prototype = z.infer<typeof PrototypeSchema>;
export type PrototypeResponse = z.infer<typeof PrototypeResponseSchema>;

// ==================== Response Union Type ====================

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// ==================== Validation Helper ====================

export function validateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

export function safeValidateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}