/**
 * Requirement Templates - Type Definitions
 * 需求模板类型定义
 */
// @ts-nocheck


export type TemplateCategory = 
  | 'saas'           // SaaS 产品
  | 'ecommerce'      // 电商平台
  | 'fintech'       // 金融科技
  | 'healthcare'    // 医疗健康
  | 'education'      // 在线教育
  | 'social'         // 社交网络
  | 'game'           // 游戏
  | 'iot'            // 物联网
  | 'enterprise'     // 企业服务
  | 'mobile'         // 移动应用
  | 'content'        // 内容平台
  | 'logistics'      // 物流
  | 'restaurant'    // 餐饮
  | 'custom';        // 自定义

export type TemplateScene = 
  | 'b2b'            // B2B
  | 'b2c'            // B2C
  | 'marketplace'    // 交易市场
  | 'api';           // API 服务

export type RequirementType = 
  | 'epic'
  | 'feature'
  | 'story'
  | 'task'
  | 'bug';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type Status = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'in-progress'
  | 'done'
  | 'archived';

export interface TemplateEntity {
  name: string;
  type: 'aggregate' | 'entity' | 'valueObject';
  attributes: string[];
  description: string;
}

export interface TemplateFeature {
  name: string;
  priority: 'core' | 'important' | 'normal';
  description: string;
  entities: string[];
}

export interface TemplateMetadata {
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  techStack: string[];
  tags: string[];
}

export interface RequirementTemplate {
  /** 唯一标识 */
  id: string;
  /** 模板名称 */
  name: string;
  /** 显示名称 */
  displayName?: string;
  /** 描述 */
  description: string;
  /** 行业分类 */
  category: TemplateCategory;
  /** 图标 */
  icon?: string;
  /** 场景 */
  scenes: TemplateScene[];
  /** 标签 */
  tags: string[];
  /** 需求内容文本 */
  content?: string;
  /** 领域实体 */
  entities?: TemplateEntity[];
  /** 功能列表 */
  features?: TemplateFeature[];
  /** 元数据 */
  metadata?: TemplateMetadata;
  /** 需求项列表 */
  items?: RequirementTemplateItem[];
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

export interface RequirementTemplateItem {
  /** 唯一标识 */
  id: string;
  /** 所属模板 ID */
  templateId: string;
  /** 需求类型 */
  type: RequirementType;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 优先级 */
  priority: Priority;
  /** 验收标准 */
  acceptanceCriteria: string[];
  /** 依赖项 */
  dependencies: string[];
  /** 技术备注 */
  technicalNotes?: string;
  /** 状态 */
  status: Status;
}

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface TemplateSceneInfo {
  id: TemplateScene;
  name: string;
  description: string;
}

// 行业分类配置
export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: 'saas', name: 'SaaS 产品', description: '软件即服务产品', icon: '☁️', color: '#3B82F6' },
  { id: 'ecommerce', name: '电商平台', description: '在线购物平台', icon: '🛒', color: '#10B981' },
  { id: 'fintech', name: '金融科技', description: '金融服务应用', icon: '💰', color: '#F59E0B' },
  { id: 'healthcare', name: '医疗健康', description: '健康医疗应用', icon: '🏥', color: '#EF4444' },
  { id: 'education', name: '在线教育', description: '教育学习平台', icon: '📚', color: '#8B5CF6' },
  { id: 'social', name: '社交网络', description: '社交媒体平台', icon: '👥', color: '#EC4899' },
  { id: 'game', name: '游戏', description: '游戏应用', icon: '🎮', color: '#14B8A6' },
  { id: 'iot', name: '物联网', description: 'IoT 设备管理', icon: '📡', color: '#6366F1' },
  { id: 'enterprise', name: '企业服务', description: 'B2B 服务', icon: '🏢', color: '#64748B' },
  { id: 'mobile', name: '移动应用', description: '移动端应用', icon: '📱', color: '#F97316' },
  { id: 'content', name: '内容平台', description: '内容发布与管理', icon: '📝', color: '#06B6D4' },
  { id: 'custom', name: '自定义', description: '自定义模板', icon: '⚙️', color: '#71717A' },
];

// 场景配置
export const TEMPLATE_SCENES: TemplateSceneInfo[] = [
  { id: 'b2b', name: 'B2B', description: '企业对企业业务' },
  { id: 'b2c', name: 'B2C', description: '企业对消费者业务' },
  { id: 'marketplace', name: '交易市场', description: '多边平台' },
  { id: 'api', name: 'API 服务', description: 'API 接口服务' },
];

// 默认标签
export const DEFAULT_TAGS = [
  'user-auth',      // 用户认证
  'payment',        // 支付
  'notification',   // 通知
  'analytics',      // 分析
  'admin',         // 管理后台
  'search',        // 搜索
  'media',         // 媒体
  'security',      // 安全
  'performance',   // 性能
  'i18n',         // 国际化
];

// 组件 Props 类型导出
export interface TemplateCardProps {
  template: RequirementTemplate;
  selected?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
}

export interface TemplateCategoriesProps {
  categories: { value: string; label: string; count: number }[];
  selected: string;
  onSelect: (value: string) => void;
}

export interface TemplateSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TemplateDetailProps {
  template: RequirementTemplate;
  onApply?: () => void;
  onClose?: () => void;
}

// 兼容旧版本的类型别名
export type TemplateGroup = RequirementTemplate;
export type CategoryOption = TemplateCategoryInfo;
