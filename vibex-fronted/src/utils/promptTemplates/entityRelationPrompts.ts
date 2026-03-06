/**
 * 实体关系识别 Prompt 模板
 * 用于从需求描述中识别和提取实体之间的关系
 */

// 关系类型定义
export type RelationType =
  | 'inheritance' // 继承/泛化
  | 'composition' // 组合
  | 'aggregation' // 聚合
  | 'association' // 关联
  | 'dependency' // 依赖
  | 'realization'; // 实现

export interface RelationPattern {
  type: RelationType;
  pattern: string;
  examples: string[];
}

export const RELATION_PATTERNS: Record<RelationType, RelationPattern> = {
  inheritance: {
    type: 'inheritance',
    pattern: 'A 是 B 的一种/类型，A 继承 B，A extends B',
    examples: ['用户是系统角色的一种', '管理员继承普通用户'],
  },
  composition: {
    type: 'composition',
    pattern: 'A 包含 B，A 由 B 组成，B 是 A 的一部分',
    examples: ['订单包含订单项', '表单由多个字段组成'],
  },
  aggregation: {
    type: 'aggregation',
    pattern: 'A 拥有 B，A 管理 B',
    examples: ['部门拥有员工', '项目组管理多个项目'],
  },
  association: {
    type: 'association',
    pattern: 'A 与 B 关联，A 使用 B',
    examples: ['用户关联订单', '商品使用分类'],
  },
  dependency: {
    type: 'dependency',
    pattern: 'A 依赖 B，A 需要 B',
    examples: ['支付依赖第三方服务', '报表依赖数据源'],
  },
  realization: {
    type: 'realization',
    pattern: 'A 实现 B，A 实现接口 B',
    examples: ['用户管理实现用户接口', '支付服务实现支付接口'],
  },
};

// 主提示词模板
export const ENTITY_RELATION_PROMPT_TEMPLATE = `## 任务
你是一个领域建模助手。请从以下需求描述中识别实体之间的关系。

## 已识别的实体
{{entities}}

## 需求描述
{{requirement_content}}

## 关系类型定义
- inheritance (继承/泛化): A 是 B 的一种类型
- composition (组合): A 包含 B，B 是 A 的一部分
- aggregation (聚合): A 拥有或管理 B
- association (关联): A 与 B 有关联
- dependency (依赖): A 依赖 B
- realization (实现): A 实现 B 的功能

## 输出要求
1. 识别实体之间的关系
2. 为每个关系指定类型
3. 解释关系的原因

## 输出格式
请以 JSON 格式输出：
{
  "relations": [
    {
      "id": "rel1",
      "sourceEntity": "源实体名",
      "targetEntity": "目标实体名",
      "relationType": "inheritance|composition|aggregation|association|dependency|realization",
      "description": "关系描述",
      "confidence": 0.95
    }
  ],
  "unresolved": [
    {
      "entity1": "实体1",
      "entity2": "实体2",
      "reason": "无法确定关系的原因"
    }
  ]
}`;

// 动态生成关系识别提示词
export function generateRelationPrompt(params: {
  entities: string[];
  requirementContent: string;
}): string {
  let prompt = ENTITY_RELATION_PROMPT_TEMPLATE;

  prompt = prompt.replace('{{entities}}', params.entities.join(', '));

  prompt = prompt.replace('{{requirement_content}}', params.requirementContent);

  return prompt;
}

// 关系验证提示词
export const RELATION_VALIDATION_PROMPT = `## 任务
验证以下实体关系的合理性。

## 实体关系列表
{{relations}}

## 验证标准
1. 关系类型是否正确
2. 关系是否存在逻辑矛盾
3. 是否遗漏了重要关系

## 输出格式
{
  "isValid": true/false,
  "issues": [
    {
      "relationId": "关系ID",
      "issue": "问题描述",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["补充关系建议"]
}`;

// 关系优先级提示词
export const RELATION_PRIORITY_PROMPT = `## 任务
为以下实体关系确定优先级。

## 实体关系
{{relations}}

## 优先级定义
- critical: 核心关系，缺少则系统无法运行
- important: 重要关系，对系统功能有重要影响
- normal: 一般关系，对系统功能影响有限

## 输出格式
{
  "prioritizedRelations": [
    {
      "relationId": "关系ID",
      "priority": "critical|important|normal",
      "reason": "优先级原因"
    }
  ]
}`;

// 关系可视化提示词
export const RELATION_LAYOUT_PROMPT = `## 任务
为以下实体关系生成布局建议。

## 实体关系
{{relations}}

## 布局原则
1. 核心实体放在中心
2. 依赖关系从被依赖者指向依赖者
3. 继承关系从子类指向父类
4. 避免交叉线

## 输出格式
{
  "suggestions": [
    {
      "entity": "实体名",
      "suggestedPosition": "center|left|right|top|bottom",
      "reason": "布局原因"
    }
  ]
}`;

// 示例关系集
export const EXAMPLE_RELATIONS = [
  {
    id: 'rel1',
    sourceEntity: '用户',
    targetEntity: '系统角色',
    relationType: 'inheritance' as RelationType,
    description: '用户是系统角色的具体实现',
    confidence: 0.95,
  },
  {
    id: 'rel2',
    sourceEntity: '订单',
    targetEntity: '订单项',
    relationType: 'composition' as RelationType,
    description: '订单包含多个订单项',
    confidence: 0.98,
  },
  {
    id: 'rel3',
    sourceEntity: '部门',
    targetEntity: '员工',
    relationType: 'aggregation' as RelationType,
    description: '部门管理多个员工',
    confidence: 0.92,
  },
  {
    id: 'rel4',
    sourceEntity: '用户',
    targetEntity: '订单',
    relationType: 'association' as RelationType,
    description: '用户与订单关联',
    confidence: 0.88,
  },
  {
    id: 'rel5',
    sourceEntity: '支付',
    targetEntity: '第三方支付',
    relationType: 'dependency' as RelationType,
    description: '支付功能依赖第三方服务',
    confidence: 0.9,
  },
];
