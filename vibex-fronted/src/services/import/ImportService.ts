/**
 * ImportService — 画布数据导入 + Round-trip 验证
 * E3-U3: Round-trip 验证
 */

import yaml from 'js-yaml';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

/** 导入格式 */
export type ImportFormat = 'json' | 'yaml';

/** 导出的画布数据结构 */
export interface CanvasExportData {
  exportedAt: string;
  version: string;
  projectId: string | null;
  phase?: string;
  contextNodes?: BoundedContextNode[];
  flowNodes?: BusinessFlowNode[];
  componentNodes?: ComponentNode[];
}

/** 导入错误类型 */
export interface ImportError {
  type: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'SCHEMA_ERROR';
  message: string;
  detail?: string;
}

/** 导入结果 */
export interface ImportResult {
  success: boolean;
  data?: CanvasExportData;
  error?: ImportError;
}

/**
 * 验证并标准化导入数据
 */
function validateAndNormalize(data: unknown): ImportResult {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: { type: 'VALIDATION_ERROR', message: '无效的导入格式，数据必须是对象' },
    };
  }

  const obj = data as Record<string, unknown>;

  // Check for required version field
  if (!obj.version) {
    return {
      success: false,
      error: { type: 'VALIDATION_ERROR', message: '缺少 version 字段，不是有效的 VibeX 导出文件' },
    };
  }

  // Normalize data structure
  const normalized: CanvasExportData = {
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    version: String(obj.version),
    projectId: typeof obj.projectId === 'string' ? obj.projectId : null,
    phase: typeof obj.phase === 'string' ? obj.phase : undefined,
    contextNodes: Array.isArray(obj.contextNodes) ? (obj.contextNodes as BoundedContextNode[]) : [],
    flowNodes: Array.isArray(obj.flowNodes) ? (obj.flowNodes as BusinessFlowNode[]) : [],
    componentNodes: Array.isArray(obj.componentNodes) ? (obj.componentNodes as ComponentNode[]) : [],
  };

  return { success: true, data: normalized };
}

/**
 * 解析 JSON 格式
 */
export function parseJSON(content: string): ImportResult {
  if (!content || content.trim().length === 0) {
    return {
      success: false,
      error: { type: 'PARSE_ERROR', message: '文件内容为空' },
    };
  }
  try {
    const data = JSON.parse(content);
    return validateAndNormalize(data);
  } catch (err) {
    return {
      success: false,
      error: {
        type: 'PARSE_ERROR',
        message: 'JSON 解析失败',
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/**
 * 解析 YAML 格式
 */
export function parseYAML(content: string): ImportResult {
  if (!content || content.trim().length === 0) {
    return {
      success: false,
      error: { type: 'PARSE_ERROR', message: '文件内容为空' },
    };
  }
  try {
    const data = yaml.load(content) as CanvasExportData;
    return validateAndNormalize(data);
  } catch (err) {
    return {
      success: false,
      error: {
        type: 'PARSE_ERROR',
        message: 'YAML 解析失败',
        detail: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/**
 * Round-trip 测试：序列化 → 反序列化 → 对比
 * @param data - 原始导出数据
 * @returns true 如果 round-trip 无损
 */
export function roundTripTest(data: CanvasExportData): boolean {
  try {
    // JSON round-trip
    const jsonStr = JSON.stringify(data);
    const parsedJson = JSON.parse(jsonStr);
    const jsonRoundTrip = JSON.stringify(parsedJson) === jsonStr;

    // YAML round-trip
    const yamlStr = yaml.dump(data, { indent: 2, lineWidth: -1 });
    const parsedYaml = yaml.load(yamlStr) as CanvasExportData;
    const yamlRoundTrip =
      parsedYaml.contextNodes?.length === data.contextNodes?.length &&
      parsedYaml.flowNodes?.length === data.flowNodes?.length &&
      parsedYaml.componentNodes?.length === data.componentNodes?.length;

    return jsonRoundTrip && yamlRoundTrip;
  } catch {
    return false;
  }
}

/**
 * 解析文件内容（自动检测格式）
 */
export function parseFile(content: string, filename: string): ImportResult {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'yaml' || ext === 'yml') {
    return parseYAML(content);
  }
  return parseJSON(content);
}
