/**
 * Template Types
 * 
 * 模板系统数据类型定义
 */

/** 模板分类 */
export type TemplateCategory = 
  | 'ecommerce'      // 电商
  | 'education'      // 教育
  | 'healthcare'     // 医疗健康
  | 'finance'        // 金融
  | 'social'         // 社交社区
  | 'enterprise'     // 企业官网
  | 'blog'           // 博客资讯
  | 'portfolio'      // 作品集
  | 'booking'        // 预约预订
  | 'saas';          // SaaS 应用

/** 模板难度等级 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** 模板价格 */
export type TemplatePrice = 'free' | 'premium';

/** 模板页面类型 */
export interface TemplatePage {
  id: string;
  name: string;
  route: string;
  description?: string;
  components?: string[];
}

/** 模板组件配置 */
export interface TemplateComponent {
  id: string;
  name: string;
  type: string;
  props?: Record<string, unknown>;
  children?: TemplateComponent[];
}

/** 模板数据模型 */
export interface Template {
  /** 模板唯一 ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description: string;
  /** 分类 */
  category: TemplateCategory;
  /** 标签 */
  tags: string[];
  /** 缩略图 URL */
  thumbnail: string;
  /** 预览图 URL 列表 */
  previewImages: string[];
  /** 作者 */
  author: {
    name: string;
    avatar?: string;
  };
  /** 价格 */
  price: TemplatePrice;
  /** 难度 */
  difficulty: TemplateDifficulty;
  /** 页面列表 */
  pages: TemplatePage[];
  /** 组件配置 */
  components: TemplateComponent[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 下载量 */
  downloads: number;
  /** 评分 */
  rating: number;
  /** 是否推荐 */
  featured?: boolean;
}

/** 模板筛选条件 */
export interface TemplateFilter {
  category?: TemplateCategory;
  difficulty?: TemplateDifficulty;
  price?: TemplatePrice;
  search?: string;
  tags?: string[];
  featured?: boolean;
}

/** 模板列表响应 */
export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** 模板加载状态 */
export type TemplateLoadStatus = 'idle' | 'loading' | 'success' | 'error';

/** 模板缓存 */
export interface TemplateCache {
  templates: Template[];
  lastUpdated: number;
  expiresAt: number;
}

/** 模板应用请求 */
export interface ApplyTemplateRequest {
  templateId: string;
  variables: Record<string, string>;
  projectName: string;
}

/** 模板应用响应 */
export interface ApplyTemplateResponse {
  success: boolean;
  projectId?: string;
  message?: string;
}

/** 模板变量 */
export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'image' | 'color';
  required: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  description?: string;
}
