/**
 * vibex.ts — VibeX 项目导入/导出 Zod Schema
 * E02-U3: Zod schema 校验 + error codes
 */
import { z } from 'zod';

// ==================== Tree Node Schemas ====================

export const UINodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodeType: z.string(),
  description: z.string().optional(),
  linkedFlowNodeId: z.string().optional(),
  children: z.string().optional(),
  annotations: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  checked: z.boolean().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
});

export const BusinessDomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  domainType: z.string().optional(),
  features: z.string().optional(),
  relationships: z.string().optional(),
});

export const FlowDataNodeSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nodes: z.string().optional(),
  position: z.string().optional(),
  style: z.string().optional(),
});

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.string().optional(),
});

// ==================== Page Schema ====================

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string().optional(),
});

// ==================== Main Export Schema ====================

export const VibexExportSchema = z.object({
  version: z.literal('1.0'),
  exportedAt: z.string().datetime(),
  exportedBy: z.string().optional(),
  project: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
  }),
  uiNodes: z.array(UINodeSchema).optional(),
  businessDomains: z.array(BusinessDomainSchema).optional(),
  flowData: z.array(FlowDataNodeSchema).optional(),
  pages: z.array(PageSchema).optional(),
  requirements: z.array(RequirementSchema).optional(),
});

export type VibexExport = z.infer<typeof VibexExportSchema>;

// ==================== Error Codes ====================

export const ExportErrorCodes = {
  INVALID_JSON: 'INVALID_JSON',
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_PROJECT_NAME: 'INVALID_PROJECT_NAME',
  INVALID_TREE_STRUCTURE: 'INVALID_TREE_STRUCTURE',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  IMPORT_FAILED: 'IMPORT_FAILED',
} as const;

export type ExportErrorCode = typeof ExportErrorCodes[keyof typeof ExportErrorCodes];

// ==================== Validation Helpers ====================

export function validateExportJson(data: unknown): { success: true; data: VibexExport } | { success: false; error: ExportErrorCode; message: string } {
  const result = VibexExportSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (issue?.path.includes('version')) {
      return { success: false, error: 'INVALID_VERSION', message: `版本不支持: ${issue.message}` };
    }
    if (issue?.path.includes('project') && issue?.path.includes('name')) {
      return { success: false, error: 'INVALID_PROJECT_NAME', message: `项目名称无效: ${issue.message}` };
    }
    return { success: false, error: 'INVALID_JSON', message: `JSON 格式无效: ${issue?.message}` };
  }
  return { success: true, data: result.data };
}
