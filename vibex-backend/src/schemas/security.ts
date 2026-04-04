/**
 * @fileoverview Security Zod Schemas — High-Risk Route Validation
 *
 * Part of: api-input-validation-layer / Epic E2 (安全高风险路由)
 *
 * Provides:
 * - S2.1: GitHub 路径白名单正则（防止路径注入）
 * - S2.2: Chat API Prompt Injection 检测
 * - S2.3: Plan API 长度限制 + Prompt Injection 检测
 *
 * 遵守 AGENTS.md 约束:
 * - 所有 schema 导出 TypeScript 类型
 * - 必须使用 .strict() 拒绝额外字段
 * - .refine() 必须提供 message 参数
 */

import { z } from 'zod';

// =============================================================================
// S2.1: GitHub 路径注入防护
// =============================================================================

/**
 * GitHub owner 正则 — 允许 a-z A-Z 0-9 _ . -
 * 拒绝: .. 路径遍历, ${} 模板注入, ; 特殊字符
 */
export const githubOwnerSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid GitHub owner format')
  .max(100, 'Owner name too long');

/**
 * GitHub repo 正则 — 同 owner
 */
export const githubRepoSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid GitHub repo format')
  .max(100, 'Repo name too long');

/**
 * GitHub 文件路径正则 — 允许 a-z A-Z 0-9 . / \ - _
 * 拒绝: .., ${}, ;, <>, 空格
 */
export const githubPathSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_./\-]+$/, 'Invalid GitHub path format')
  .max(1000, 'Path too long')
  .refine(
    (path) => !path.includes('..') && !path.includes('${'),
    { message: 'Path traversal or template injection not allowed' }
  );

/**
 * 完整 GitHub 仓库参数 schema
 */
export const githubRepoParamsSchema = z.object({
  owner: githubOwnerSchema,
  repo: githubRepoSchema,
}).strict();

/**
 * GitHub 仓库 + 路径参数 schema
 */
export const githubContentsParamsSchema = z.object({
  owner: githubOwnerSchema,
  repo: githubRepoSchema,
  path: githubPathSchema,
}).strict();

// =============================================================================
// S2.2: Chat API Prompt Injection 防护
// =============================================================================

/**
 * Prompt Injection 关键词列表
 * 检测常见的提示词劫持模式
 */
export const INJECTION_KEYWORDS = [
  'SYSTEM_PROMPT',
  '##Instructions',
  '/system',
  'You are now',
  '[SYSTEM]',
  '>>>>>',
  '<|im_end|>',
  '<|system|>',
] as const;

/**
 * 检测消息中是否包含注入关键词
 */
function detectInjection(msg: string): boolean {
  const lower = msg.toLowerCase();
  return INJECTION_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Chat POST 请求 body schema
 */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(10000, 'Message too long (max 10000 chars)')
    .refine(
      (msg) => !detectInjection(msg),
      { message: 'Message contains suspicious keywords — possible prompt injection' }
    ),
  conversationId: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
}).strict();

/**
 * ChatMessage 类型导出
 */
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// =============================================================================
// S2.3: Plan API Prompt Injection 防护
// =============================================================================

/**
 * Plan Analyze POST 请求 body schema
 */
export const planAnalyzeSchema = z.object({
  requirement: z
    .string()
    .min(1, 'Requirement cannot be empty')
    .max(50000, 'Requirement too long (max 50000 chars)')
    .refine(
      (req) => req.trim().length > 0,
      { message: 'Requirement cannot be empty or whitespace-only' }
    )
    .refine(
      (req) => !detectInjection(req),
      { message: 'Requirement contains suspicious keywords — possible prompt injection' }
    ),
  context: z.object({
    projectId: z.string().uuid('Invalid project ID').optional(),
    previousPlans: z.array(z.record(z.unknown())).optional(),
  }).strict().optional(),
}).strict();

/**
 * PlanAnalyze 类型导出
 */
export type PlanAnalyzeInput = z.infer<typeof planAnalyzeSchema>;
