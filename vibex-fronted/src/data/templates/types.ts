/**
 * VibeX Requirement Templates - Type Definitions
 * 
 * 模板数据结构类型定义
 */

/** 模板分类 */
export type TemplateCategory = 
  | 'ecommerce'    // 电商
  | 'social'       // 社交
  | 'saas'         // SaaS
  | 'education'    // 教育
  | 'content'      // 内容
  | 'finance'      // 金融
  | 'healthcare'   // 医疗
  | 'logistics'    // 物流
  | 'restaurant'   // 餐饮
  | 'scenario';    // 通用场景

/** 模板复杂度 */
export type TemplateComplexity = 'simple' | 'medium' | 'complex';

/** 实体类型 */
export type EntityType = 'aggregate' | 'entity' | 'valueObject' | 'service';

/** 功能优先级 */
export type FeaturePriority = 'core' | 'important' | 'optional';

/** 模板实体 */
export interface TemplateEntity {
  name: string;           // 实体名称
  type: EntityType;       // 实体类型
  attributes: string[];   // 核心属性
  description?: string;
}

/** 模板功能 */
export interface TemplateFeature {
  name: string;           // 功能名称
  priority: FeaturePriority;
  description: string;
  entities: string[];     // 涉及的实体
}

/** 模板元数据 */
export interface TemplateMetadata {
  complexity: TemplateComplexity;
  estimatedTime: string;  // 预估开发时间
  techStack?: string[];   // 推荐技术栈
  tags: string[];         // 搜索标签
}

/** 完整模板结构 */
export interface RequirementTemplate {
  id: string;
  name: string;
  displayName: string;
  category: TemplateCategory;
  icon: string;           // emoji 图标
  description: string;
  content: string;        // 模板需求文本（带占位符）
  entities: TemplateEntity[];
  features: TemplateFeature[];
  metadata: TemplateMetadata;
  
  // 统计数据（Phase 3）
  usageCount?: number;
  rating?: number;
  ratingCount?: number;
}

/** 模板分组（用于展示） */
export interface TemplateGroup {
  category: TemplateCategory;
  label: string;
  templates: RequirementTemplate[];
}

/** 分类选项 */
export interface CategoryOption {
  value: TemplateCategory | 'all';
  label: string;
  count: number;
}

/** TemplateSelector Props */
export interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: RequirementTemplate) => void;
  initialCategory?: TemplateCategory | 'all';
}

/** TemplateCard Props */
export interface TemplateCardProps {
  template: RequirementTemplate;
  selected?: boolean;
  onClick: () => void;
  onPreview?: () => void;
}

/** TemplateDetail Props */
export interface TemplateDetailProps {
  template: RequirementTemplate;
  onApply: () => void;
  onClose: () => void;
}

/** TemplateSearch Props */
export interface TemplateSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** TemplateCategories Props */
export interface TemplateCategoriesProps {
  categories: CategoryOption[];
  selected: TemplateCategory | 'all';
  onSelect: (category: TemplateCategory | 'all') => void;
}
