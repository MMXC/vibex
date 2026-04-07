/**
 * 术语简化配置
 * 将 DDD 专业术语映射为更易懂的词汇
 */

export interface TermMapping {
  simplified: string;
  original: string;
  description: string;
  example?: string;
}

export const TERMINOLOGY_MAPPINGS: Record<string, TermMapping> = {
  'bounded-context': {
    simplified: '业务模块',
    original: '限界上下文',
    description: '系统中职责清晰的独立区域',
    example: '例如"订单管理"、"用户中心"',
  },
  'domain-model': {
    simplified: '数据实体',
    original: '领域模型',
    description: '业务数据的结构定义',
    example: '例如用户、订单、商品',
  },
  'aggregate-root': {
    simplified: '主实体',
    original: '聚合根',
    description: '业务逻辑的核心实体',
    example: '例如订单聚合根',
  },
  'value-object': {
    simplified: '数据类型',
    original: '值对象',
    description: '不可变的业务数据类型',
    example: '例如金额、地址',
  },
  'context-mapping': {
    simplified: '协作关系',
    original: '上下文映射',
    description: '模块之间的依赖关系',
    example: '上游/下游关系',
  },
  'upstream': {
    simplified: '上游',
    original: '上游',
    description: '提供数据的模块',
    example: '库存模块向订单模块提供数据',
  },
  'downstream': {
    simplified: '下游',
    original: '下游',
    description: '消费数据的模块',
    example: '订单模块从库存模块获取数据',
  },
  'core-domain': {
    simplified: '核心业务',
    original: '核心域',
    description: '提供竞争优势的业务能力',
    example: '电商平台的核心域是订单处理',
  },
  'supporting-domain': {
    simplified: '支撑功能',
    original: '支撑域',
    description: '支持核心域的功能',
    example: '通知服务、短信发送',
  },
  'generic-domain': {
    simplified: '通用能力',
    original: '通用域',
    description: '可直接使用的通用功能',
    example: '日志、缓存、认证',
  },
};

/**
 * 获取简化后的术语
 */
export function getSimplifiedTerm(key: string): string {
  return TERMINOLOGY_MAPPINGS[key]?.simplified || key;
}

/**
 * 获取术语映射信息
 */
export function getTermMapping(key: string): TermMapping | undefined {
  return TERMINOLOGY_MAPPINGS[key];
}

/**
 * 获取所有术语键
 */
export function getAllTermKeys(): string[] {
  return Object.keys(TERMINOLOGY_MAPPINGS);
}
