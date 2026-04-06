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
import { warn } from '@/lib/logger';

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
      async (msg) => {
        // E6-S1: Use AST-based scanner + keyword detection
        const result = await detectPromptInjection(msg, true)
        return !result.blocked
      },
      { message: 'Message contains suspicious patterns — possible prompt injection' }
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
      async (req) => {
        // E6-S1: Use AST-based scanner + keyword detection
        const result = await detectPromptInjection(req, true)
        return !result.blocked
      },
      { message: 'Requirement contains suspicious patterns — possible prompt injection' }
    ),
  context: z.object({
    projectId: z.string().uuid('Invalid project ID').optional(),
    previousPlans: z.array(z.record(z.string(), z.unknown())).optional(),
  }).strict().optional(),
}).strict();

/**
 * PlanAnalyze 类型导出
 */
export type PlanAnalyzeInput = z.infer<typeof planAnalyzeSchema>;

/**
 * S3.1: Auth Route Validation Schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
}).strict();

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 chars').max(128, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * S3.2: Projects Route Validation Schemas
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
}).strict();

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
}).strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// =============================================================================
// E6: AST-based Prompt Security Scanner
// =============================================================================

/**
 * Dangerous code pattern detected by AST scanner (E6-S1)
 */
export interface ASTDangerousPattern {
  type: 'DANGEROUS_FUNCTION' | 'TEMPLATE_LITERAL_EVAL' | 'NEW_FUNCTION' | 'INDIRECT_EVAL'
  line: number
  column?: number
  description: string
}

/**
 * AST scan result for prompt security
 */
export interface ASTScanResult {
  clean: boolean
  patterns: ASTDangerousPattern[]
}

/**
 * E6-S1: AST-based dangerous pattern scanner
 * 
 * Uses Babel AST to detect:
 * - eval() calls
 * - new Function() calls
 * - Indirect eval (passing "eval" as identifier)
 * - Template literals with eval
 * 
 * This replaces string matching with proper AST analysis.
 * Falls back gracefully when Babel is not available.
 */
export async function scanForDangerousPatterns(code: string): Promise<ASTScanResult> {
  const patterns: ASTDangerousPattern[] = []

  try {
    // Dynamic import to avoid breaking when Babel is unavailable
    const [{ parse }, { default: traverse }] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
    ])

    const ast = parse(code, {
      sourceType: 'script',
      plugins: [],
      errorRecovery: true,
    })

    traverse(ast, {
      CallExpression(path) {
        const node = path.node as any
        const callee = node.callee as any
        const nodeLoc = node.loc as any

        // Direct eval: eval("...")
        if (
          callee?.type === 'Identifier' &&
          callee?.name === 'eval'
        ) {
          patterns.push({
            type: 'DANGEROUS_FUNCTION',
            line: nodeLoc?.start?.line ?? 0,
            column: nodeLoc?.start?.column,
            description: 'Direct eval() call detected — code injection risk',
          })
          path.skip()
          return
        }

        // Indirect eval: (0, eval)("...") — bypasses local scope
        if (callee?.type === 'SequenceExpression') {
          const exprs = callee.expressions as any[]
          if (
            Array.isArray(exprs) &&
            exprs.length >= 2 &&
            exprs[1]?.type === 'Identifier' &&
            exprs[1]?.name === 'eval'
          ) {
            patterns.push({
              type: 'INDIRECT_EVAL',
              line: nodeLoc?.start?.line ?? 0,
              column: nodeLoc?.start?.column,
              description: 'Indirect eval() — bypasses local scope, code injection risk',
            })
            path.skip()
            return
          }
        }

        // new Function("...") — dynamic code creation
        if (
          callee?.type === 'Identifier' &&
          callee?.name === 'Function'
        ) {
          patterns.push({
            type: 'NEW_FUNCTION',
            line: nodeLoc?.start?.line ?? 0,
            column: nodeLoc?.start?.column,
            description: 'new Function() detected — dynamic code creation risk',
          })
          path.skip()
          return
        }
      },

      NewExpression(path) {
        const node = path.node as any
        const callee = node.callee as any
        const nodeLoc = node.loc as any

        // new Function("...") — explicit dynamic code creation
        if (
          callee?.type === 'Identifier' &&
          callee?.name === 'Function'
        ) {
          patterns.push({
            type: 'NEW_FUNCTION',
            line: nodeLoc?.start?.line ?? 0,
            column: nodeLoc?.start?.column,
            description: 'new Function() detected — dynamic code creation risk',
          })
          path.skip()
          return
        }
      },

      Identifier(path) {
        const node = path.node as any
        const nodeLoc = node.loc as any
        const parent = path.parent as any

        // Check for "eval" passed as argument to other functions
        // e.g., setTimeout("eval", 0) or window["eval"]
        if (node.name === 'eval' && !path.isReferencedIdentifier()) {
          if (
            parent?.type === 'MemberExpression' ||
            parent?.type === 'OptionalMemberExpression'
          ) {
            patterns.push({
              type: 'INDIRECT_EVAL',
              line: nodeLoc?.start?.line ?? 0,
              column: nodeLoc?.start?.column,
              description: 'Indirect eval reference via member expression — code injection risk',
            })
          }
        }
      },
    })
  } catch {
    // If AST parsing fails, fall back to empty scan (log warning in production)
    // This prevents the scanner from blocking legitimate prompts due to parse errors
    warn('[ASTScanner] Failed to parse code, skipping AST scan')
  }

  return {
    clean: patterns.length === 0,
    patterns,
  }
}

/**
 * E6-S1: Combined injection detection
 * 
 * Runs both string-based keyword detection AND AST-based dangerous pattern scan.
 * Returns true if EITHER method detects issues.
 * 
 * @param msg - The prompt message to scan
 * @param enableAST - Whether to enable AST scanning (default: true)
 */
export async function detectPromptInjection(
  msg: string,
  enableAST = true
): Promise<{ blocked: boolean; reason?: string; astPatterns?: ASTDangerousPattern[] }> {
  // Step 1: String-based keyword detection (fast, always runs)
  if (detectInjection(msg)) {
    return {
      blocked: true,
      reason: 'Keyword-based prompt injection detected',
    }
  }

  // Step 2: AST-based dangerous pattern scan (E6-S1)
  if (enableAST && msg.length > 20) {
    // Only scan non-trivial messages (avoid overhead for short messages)
    const astResult = await scanForDangerousPatterns(msg)
    if (!astResult.clean) {
      return {
        blocked: true,
        reason: `AST scan detected dangerous patterns: ${astResult.patterns.map((p) => p.type).join(', ')}`,
        astPatterns: astResult.patterns,
      }
    }
  }

  return { blocked: false }
}
