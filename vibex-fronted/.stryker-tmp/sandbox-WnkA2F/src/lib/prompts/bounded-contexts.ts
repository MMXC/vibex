/**
 * DDD Bounded Contexts Prompt Module
 *
 * Single source of truth for bounded context generation prompts.
 * Provides structured prompt with Chinese-context examples and clear type definitions.
 */
// @ts-nocheck


export interface BoundedContext {
  name: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  description: string;
  ubiquitousLanguage: string[];
}

/**
 * Structured prompt for generating DDD bounded contexts from user requirements.
 * Includes Chinese-context examples, type definitions, and output format.
 */
export const BOUNDED_CONTEXTS_PROMPT = `你是一位资深 DDD（领域驱动设计）专家，专门帮助中文互联网产品团队划分限界上下文。

## 你的任务
分析用户需求，提取 3-8 个限界上下文（Bounded Contexts）。

## 限界上下文的判断标准（中文语境）

**Core（核心域）**: 直接实现用户核心价值的领域，用户为此付费的原因。
- 判断：去掉它产品就失去意义
- 示例（电商）: "商品管理"（展示、搜索、上下架）、"订单管理"（下单、支付、物流）
- 示例（医疗）: "患者管理"（建档、就诊记录）、"诊疗管理"（挂号、问诊、开方）

**Supporting（支撑域）**: 为核心域提供专用能力，不可复用
- 判断：虽然可通用，但为该项目定制了流程
- 示例: "排班管理"（医疗）、"库存管理"（零售）

**Generic（通用域）**: 可在任何项目复用的通用能力
- 示例: "认证授权"、"通知推送"、"文件存储"、"日志"

**External（外部系统）**: 不在你的系统内，开发/维护权不在你
- 示例: "微信支付"、"支付宝"、"第三方物流API"

## 真实示例：在线医生问诊系统

输入需求：「我想做一个在线预约医生系统，患者可以查看医生、预约挂号、线上问诊、购买处方药」

好的限界上下文划分：
1. {"name": "患者管理", "type": "core", "description": "患者注册建档、实名认证、健康档案", "ubiquitousLanguage": ["患者", "健康档案", "实名认证"]}
2. {"name": "医生管理", "type": "core", "description": "医生入驻、资质审核、主页展示", "ubiquitousLanguage": ["医生", "资质", "入驻"]}
3. {"name": "预约挂号", "type": "core", "description": "医生排班、预约、取消、改期", "ubiquitousLanguage": ["排班", "号源", "预约时段"]}
4. {"name": "问诊管理", "type": "core", "description": "图文/视频问诊、病历书写、开处方", "ubiquitousLanguage": ["问诊", "病历", "处方"]}
5. {"name": "订单支付", "type": "supporting", "description": "问诊订单、微信/支付宝支付、退款", "ubiquitousLanguage": ["订单", "支付流水"]}
6. {"name": "认证授权", "type": "generic", "description": "登录注册、Token、JWT", "ubiquitousLanguage": ["登录", "JWT"]}
7. {"name": "微信支付", "type": "external", "description": "对接微信支付API", "ubiquitousLanguage": []}

坏的划分（边界重叠）:
- 把"患者管理"和"问诊管理"合并成"用户问诊"→ 违反单一职责
- 把"医生管理"当成 external（因为医生是外部资源）→ 遗漏核心业务

## 输出格式
JSON 数组，每个元素包含：
- name: 领域名称（DDD 通用语言，用中文名词，不用动词）
- type: core | supporting | generic | external
- description: 2-3 句话，说明这个上下文处理什么、不处理什么
- ubiquitousLanguage: 该领域内的专业术语数组（3-5个）

## 用户需求
{requirementText}`;

/**
 * Build a complete bounded contexts prompt by inserting the user's requirement.
 * @param requirementText - The user's raw requirement
 * @returns Formatted prompt string
 */
export function buildBoundedContextsPrompt(requirementText: string): string {
  return BOUNDED_CONTEXTS_PROMPT.replace('{requirementText}', requirementText);
}
