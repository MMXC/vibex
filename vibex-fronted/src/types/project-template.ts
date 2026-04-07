/**
 * DDD Project Template Types
 * 
 * 领域驱动设计项目模板类型定义
 * 用于从预设模板快速创建 DDD 项目结构
 */

/** 模板分类 */
export type ProjectTemplateCategory = 
  | 'business'    // 业务系统
  | 'user'        // 用户管理
  | 'ecommerce'   // 电商
  | 'general';   // 通用

/** 限界上下文模板 */
export interface TemplateContext {
  name: string;
  description: string;
  entities?: string[];
}

/** 业务流程模板 */
export interface TemplateFlow {
  name: string;
  context: string;
  steps: string[];
}

/** 组件模板 */
export interface TemplateComponent {
  name: string;
  type: ComponentType;
  description: string;
}

export type ComponentType = 
  | 'Service' 
  | 'Controller' 
  | 'Repository' 
  | 'Entity' 
  | 'ValueObject' 
  | 'Event';

/** DDD 项目模板 */
export interface ProjectTemplate {
  id: string;
  version: 1;
  name: string;
  description: string;
  thumbnail: string;
  category: ProjectTemplateCategory;
  contexts: TemplateContext[];
  flows: TemplateFlow[];
  components?: TemplateComponent[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** 模板筛选条件 */
export interface ProjectTemplateFilter {
  category?: ProjectTemplateCategory | 'all';
  search?: string;
  tags?: string[];
}

/** 模板列表响应 */
export interface ProjectTemplateListResponse {
  templates: ProjectTemplate[];
  total: number;
}

/** 模板应用请求 */
export interface ApplyProjectTemplateRequest {
  templateId: string;
  projectName: string;
}

/** 模板应用响应 */
export interface ApplyProjectTemplateResponse {
  success: boolean;
  projectId?: string;
  message?: string;
}
