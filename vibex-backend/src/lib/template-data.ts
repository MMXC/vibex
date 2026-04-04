/**
 * Template Data
 *
 * Backend template data — mirrors the frontend's template-data.ts
 * but uses the ProjectTemplate schema from the spec.
 */

export interface TemplateContext {
  name: string;
  description: string;
  entities?: string[];
}

export interface TemplateFlow {
  name: string;
  context: string;
  steps: string[];
}

export interface ProjectTemplate {
  id: string;
  version: 1;
  name: string;
  description: string;
  thumbnail: string;
  category: 'business' | 'user' | 'ecommerce' | 'general';
  contexts: TemplateContext[];
  flows: TemplateFlow[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'ecommerce',
    version: 1,
    name: '电商系统',
    description: '适合电商平台领域建模，包含商品、订单、用户三大核心域',
    thumbnail: '',
    category: 'ecommerce',
    contexts: [
      {
        name: '商品域',
        description: '商品目录和库存管理',
        entities: ['商品', 'SKU', '库存'],
      },
      {
        name: '订单域',
        description: '订单处理和履约',
        entities: ['订单', '订单项', '支付'],
      },
      {
        name: '用户域',
        description: '用户账户和会员',
        entities: ['用户', '地址', '会员'],
      },
    ],
    flows: [
      {
        name: '下单流程',
        context: '订单域',
        steps: ['选择商品', '加入购物车', '提交订单', '支付', '确认发货'],
      },
      {
        name: '注册流程',
        context: '用户域',
        steps: ['填写信息', '验证手机', '完成注册'],
      },
    ],
    tags: ['电商', '标准', '入门'],
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
  },
  {
    id: 'user-management',
    version: 1,
    name: '用户管理模块',
    description: '标准用户管理系统，包含注册、登录、权限管理',
    thumbnail: '',
    category: 'user',
    contexts: [
      {
        name: '认证域',
        description: '用户身份认证',
        entities: ['用户', '凭证', '会话'],
      },
      {
        name: '权限域',
        description: '权限和角色管理',
        entities: ['角色', '权限', '资源'],
      },
    ],
    flows: [
      {
        name: '登录流程',
        context: '认证域',
        steps: ['输入账号', '输入密码', '验证码', '登录成功'],
      },
      {
        name: '权限校验流程',
        context: '权限域',
        steps: ['获取角色', '查询权限', '校验资源'],
      },
    ],
    tags: ['用户', '权限', '认证'],
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
  },
  {
    id: 'generic-business',
    version: 1,
    name: '通用业务系统',
    description: '适合一般业务系统的 DDD 骨架',
    thumbnail: '',
    category: 'general',
    contexts: [
      {
        name: '业务域',
        description: '核心业务逻辑',
        entities: ['业务对象'],
      },
      {
        name: '数据域',
        description: '数据管理',
        entities: ['数据实体'],
      },
    ],
    flows: [
      {
        name: '标准业务流程',
        context: '业务域',
        steps: ['开始', '处理', '结束'],
      },
    ],
    tags: ['通用', '骨架'],
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
