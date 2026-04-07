/**
 * templateLoader — 需求模板加载器
 * E4-F10: 需求模板库
 *
 * 从 /public/templates/ 目录加载 JSON 模板
 */

import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from './types';

/** 模板元信息（不含完整数据，仅用于展示） */
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 模板文件路径 */
  file: string;
}

/** 完整模板数据 */
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
}

/** 内置模板列表 */
export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'e-commerce',
    name: '电商平台',
    description: '完整的电商平台模板，包含用户、商品、订单、支付等核心模块',
    icon: '🛒',
    file: '/templates/e-commerce.json',
  },
  {
    id: 'saas',
    name: 'SaaS 管理后台',
    description: '多租户 SaaS 管理后台模板，包含租户、认证、计费、内容等模块',
    icon: '☁️',
    file: '/templates/saas.json',
  },
  {
    id: 'social',
    name: '社交网络',
    description: '社区社交平台模板，包含用户关系、动态发布、互动评论等模块',
    icon: '🌐',
    file: '/templates/social.json',
  },
];

/**
 * 加载模板元信息列表
 */
export async function loadTemplateList(): Promise<TemplateMeta[]> {
  return TEMPLATES;
}

/**
 * 加载指定模板的完整数据
 * @param templateId 模板 ID
 * @returns 模板数据，如果不存在则返回 null
 */
export async function loadTemplate(templateId: string): Promise<CanvasTemplate | null> {
  const meta = TEMPLATES.find((t) => t.id === templateId);
  if (!meta) return null;

  try {
    const res = await fetch(meta.file);
    if (!res.ok) {
      return null;
    }
    const data: CanvasTemplate = await res.json();
    return data;
  } catch {
    return null;
  }
}
