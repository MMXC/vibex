/**
 * @fileoverview Canvas API Input Validation
 *
 * Epic 2: Backend Middleware
 * 基于 packages/types/api/canvas.ts 的 API 契约
 */
// @ts-nocheck


export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidateContextsResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * 校验 generateFlows 请求的 contexts
 * 规则:
 * 1. contexts 必须是数组且非空
 * 2. 至少有一个 context type === 'core'
 * 3. 每个 context 必须有 id, name
 */
export function validateContexts(contexts: unknown): ValidateContextsResult {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(contexts)) {
    issues.push({ field: 'contexts', message: 'contexts 必须是数组' });
    return { valid: false, issues };
  }

  if (contexts.length === 0) {
    issues.push({ field: 'contexts', message: 'contexts 不能为空' });
    return { valid: false, issues };
  }

  let hasCore = false;
  for (let i = 0; i < contexts.length; i++) {
    const ctx = contexts[i] as Record<string, unknown>;

    if (typeof ctx !== 'object' || ctx === null) {
      issues.push({
        field: `contexts[${i}]`,
        message: `contexts[${i}] 必须是对象`,
      });
      continue;
    }

    if (typeof ctx.id !== 'string' || ctx.id.trim() === '') {
      issues.push({
        field: `contexts[${i}].id`,
        message: `contexts[${i}].id 必须是非空字符串`,
      });
    }

    if (typeof ctx.name !== 'string' || ctx.name.trim() === '') {
      issues.push({
        field: `contexts[${i}].name`,
        message: `contexts[${i}].name 必须是字符串`,
      });
    }

    if (typeof ctx.type === 'string' && ctx.type === 'core') {
      hasCore = true;
    }

    const validTypes = ['core', 'supporting', 'generic', 'external'];
    if (typeof ctx.type !== 'string' || !validTypes.includes(ctx.type)) {
      issues.push({
        field: `contexts[${i}].type`,
        message: `contexts[${i}].type 必须是 ${validTypes.join('|')} 之一`,
      });
    }
  }

  if (!hasCore) {
    issues.push({
      field: 'contexts',
      message: '至少需要一个 type 为 core 的上下文',
    });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * 校验 generateFlows 完整请求体
 */
export function validateGenerateFlowsRequest(body: unknown): ValidateContextsResult {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      issues: [{ field: 'body', message: '请求体必须是对象' }],
    };
  }

  const obj = body as Record<string, unknown>;
  return validateContexts(obj.contexts);
}
