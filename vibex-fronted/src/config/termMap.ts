/**
 * Term Translation Map
 * DDD专业术语 → 业务友好语言
 */

export interface TermEntry {
  ddd: string;          // DDD专业术语
  business: string;      // 业务友好语言
  description: string;  // 说明
}

export const TERM_MAP: TermEntry[] = [
  // 领域驱动设计核心概念
  { ddd: 'bounded-context', business: '业务领域', description: '一个独立的业务边界，内部有统一的领域模型' },
  { ddd: 'core-domain', business: '核心业务', description: '为企业创造核心价值的业务区域' },
  { ddd: 'supporting-domain', business: '支撑业务', description: '支持核心业务运行的必要功能' },
  { ddd: 'generic-domain', business: '通用业务', description: '可复用的通用功能，如认证、通知' },
  
  // 领域模型术语
  { ddd: 'aggregate-root', business: '核心实体', description: '业务规则和一致性的核心载体' },
  { ddd: 'domain-event', business: '业务事件', description: '业务领域中发生的重要事情' },
  { ddd: 'domain-model', business: '数据结构', description: '描述业务领域的数据结构' },
  { ddd: 'entity', business: '业务对象', description: '有唯一标识的业务实体' },
  { ddd: 'value-object', business: '值对象', description: '由其属性值定义的对象' },
  { ddd: 'repository', business: '数据存储', description: '管理业务对象持久化的组件' },
  { ddd: 'domain-service', business: '业务服务', description: '包含重要业务逻辑的服务' },
  { ddd: 'factory', business: '创建工厂', description: '负责创建复杂对象的组件' },

  // 业务流程术语
  { ddd: 'business-flow', business: '业务流程', description: '业务活动的执行顺序' },
  { ddd: 'flow-node', business: '流程节点', description: '流程中的单个步骤' },
  { ddd: 'flow-edge', business: '流程连接', description: '流程节点之间的关联' },
  { ddd: 'user-story', business: '用户故事', description: '从用户角度描述的需求' },
  { ddd: 'use-case', business: '使用场景', description: '系统功能的描述' },
  { ddd: 'business-rule', business: '业务规则', description: '业务必须遵守的约束' },

  // 架构术语
  { ddd: 'context-map', business: '领域全景', description: '展示所有业务领域及其关系的图' },
  { ddd: 'anticorruption-layer', business: '隔离层', description: '在不同领域模型间转换的层' },
  { ddd: 'open-host-service', business: '开放主机服务', description: '为外部系统提供访问的协议' },
  { ddd: 'published-language', business: '通用语言', description: '领域间共享的数据格式' },
  { ddd: 'conformist', business: '顺应模式', description: '直接使用上游领域的模型' },
  { ddd: 'customer-supplier', business: '供需模式', description: '上游提供服务，下游消费' },

  // UI/原型术语
  { ddd: 'ui-component', business: '界面组件', description: '可复用的界面元素' },
  { ddd: 'page-layout', business: '页面布局', description: '页面的结构安排' },
  { ddd: 'prototype', business: '原型', description: '产品的早期模型' },
  { ddd: 'wireframe', business: '线框图', description: '展示布局的简略图' },
];

// 快速查找Map
export const TERM_TO_BUSINESS = new Map(
  TERM_MAP.map(t => [t.ddd, t.business])
);

export const BUSINESS_TO_DDD = new Map(
  TERM_MAP.map(t => [t.business, t.ddd])
);

/**
 * 翻译单个术语
 */
export function translateTerm(dddTerm: string): string {
  return TERM_TO_BUSINESS.get(dddTerm) ?? dddTerm;
}

/**
 * 批量翻译术语（用于API响应）
 */
export function translateObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    const translated = translateTerm(obj);
    if (translated !== obj) return translated;
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // 翻译key
      const translatedKey = translateTerm(key);
      result[translatedKey] = translateObject(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * 获取所有业务术语列表
 */
export function getBusinessTerms(): string[] {
  return TERM_MAP.map(t => t.business);
}

/**
 * 检查是否包含DDD术语
 */
export function containsDDDTerms(text: string): boolean {
  return TERM_MAP.some(t => text.includes(t.ddd));
}
