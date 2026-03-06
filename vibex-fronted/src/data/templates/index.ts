/**
 * VibeX Requirement Templates - Index
 * 
 * 模板数据统一导出入口
 */

import { 
  RequirementTemplate, 
  TemplateGroup, 
  TemplateCategory,
  CategoryOption 
} from './types';

// 导入所有行业模板
import ecommerceTemplate from './industry/ecommerce.json';
import socialTemplate from './industry/social.json';
import saasTemplate from './industry/saas.json';
import educationTemplate from './industry/education.json';
import contentTemplate from './industry/content.json';

// 导入所有场景模板
import userManagementTemplate from './scenario/user-management.json';
import contentManagementTemplate from './scenario/content-management.json';
import transactionTemplate from './scenario/transaction.json';

/** 所有模板列表 */
export const templates: RequirementTemplate[] = [
  // 行业模板
  ecommerceTemplate as RequirementTemplate,
  socialTemplate as RequirementTemplate,
  saasTemplate as RequirementTemplate,
  educationTemplate as RequirementTemplate,
  contentTemplate as RequirementTemplate,
  // 场景模板
  userManagementTemplate as RequirementTemplate,
  contentManagementTemplate as RequirementTemplate,
  transactionTemplate as RequirementTemplate,
];

/** 分类标签映射 */
export const categoryLabels: Record<TemplateCategory, string> = {
  ecommerce: '电商',
  social: '社交',
  saas: 'SaaS',
  education: '教育',
  content: '内容',
  finance: '金融',
  healthcare: '医疗',
  logistics: '物流',
  restaurant: '餐饮',
  scenario: '通用场景',
};

/** 按分类获取模板 */
export function getTemplatesByCategory(category: TemplateCategory): RequirementTemplate[] {
  return templates.filter(t => t.category === category);
}

/** 搜索模板 */
export function searchTemplates(query: string): RequirementTemplate[] {
  if (!query.trim()) return templates;
  
  const lowerQuery = query.toLowerCase();
  return templates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.displayName.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/** 获取模板分组（用于展示） */
export function getTemplateGroups(): TemplateGroup[] {
  return Object.entries(categoryLabels)
    .map(([category, label]) => ({
      category: category as TemplateCategory,
      label,
      templates: getTemplatesByCategory(category as TemplateCategory),
    }))
    .filter(group => group.templates.length > 0);
}

/** 获取分类选项（带数量） */
export function getCategoryOptions(): CategoryOption[] {
  const groups = getTemplateGroups();
  const allCount = templates.length;
  
  return [
    { value: 'all' as const, label: '全部', count: allCount },
    ...groups.map(g => ({
      value: g.category,
      label: g.label,
      count: g.templates.length,
    })),
  ];
}

/** 根据 ID 获取模板 */
export function getTemplateById(id: string): RequirementTemplate | undefined {
  return templates.find(t => t.id === id);
}

/** 获取行业模板 */
export function getIndustryTemplates(): RequirementTemplate[] {
  return templates.filter(t => t.category !== 'scenario');
}

/** 获取场景模板 */
export function getScenarioTemplates(): RequirementTemplate[] {
  return templates.filter(t => t.category === 'scenario');
}

/** 过滤模板 */
export function filterTemplates(
  category: TemplateCategory | 'all',
  query: string
): RequirementTemplate[] {
  let result = templates;
  
  if (category !== 'all') {
    result = result.filter(t => t.category === category);
  }
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.displayName.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  return result;
}

// 导出类型
export * from './types';
