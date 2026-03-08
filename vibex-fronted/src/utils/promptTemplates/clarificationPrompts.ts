/**
 * 澄清问题生成 Prompt 模板
 * 用于在 AI 分析需求时，发现信息不足时生成澄清问题
 */

// 澄清问题类型
export type ClarificationCategory =
  | 'functional' // 功能需求
  | 'non_functional' // 非功能需求
  | 'business' // 业务需求
  | 'technical' // 技术需求
  | 'user' // 用户相关
  | 'data' // 数据相关
  | 'integration' // 集成相关
  | 'security'; // 安全相关;

export interface ClarificationQuestion {
  id: string;
  category: ClarificationCategory;
  question: string;
  priority: 'high' | 'medium' | 'low';
  relatedEntities?: string[];
}

// 主提示词模板
export const CLARIFICATION_PROMPT_TEMPLATE = `## 任务
你是一个需求分析助手。你正在分析用户的 AI 应用需求，但发现信息不足。请生成澄清问题以获取更多信息。

## 当前需求描述
{{requirement_content}}

## 已识别的主题/实体
{{identified_entities}}

## 已识别的功能
{{identified_features}}

## 缺失信息的领域
{{missing_domains}}

## 输出要求
请生成 3-7 个最关键的澄清问题。每个问题应该：
1. 针对最关键的信息缺失
2. 简洁明了，用户容易理解
3. 按优先级排序（最重要的问题在前）

## 输出格式
请以 JSON 格式输出：
{
  "questions": [
    {
      "id": "q1",
      "category": "功能需求|非功能需求|业务需求|技术需求|用户相关|数据相关|集成相关|安全相关",
      "question": "问题内容",
      "priority": "high|medium|low",
      "relatedEntities": ["相关实体名称"]
    }
  ]
}`;

// 动态生成澄清问题的函数
export function generateClarificationPrompt(params: {
  requirementContent: string;
  identifiedEntities?: string[];
  identifiedFeatures?: string[];
  missingDomains?: string[];
}): string {
  let prompt = CLARIFICATION_PROMPT_TEMPLATE;

  prompt = prompt.replace(
    '{{requirement_content}}',
    params.requirementContent || '未提供'
  );

  prompt = prompt.replace(
    '{{identified_entities}}',
    params.identifiedEntities?.join(', ') || '无'
  );

  prompt = prompt.replace(
    '{{identified_features}}',
    params.identifiedFeatures?.join(', ') || '无'
  );

  prompt = prompt.replace(
    '{{missing_domains}}',
    params.missingDomains?.join(', ') || '无'
  );

  return prompt;
}

// 分类问题模板 - 针对不同领域的具体问题
export const CATEGORY_PROMPTS: Record<ClarificationCategory, string> = {
  functional: `请澄清以下功能需求的具体细节：
- 核心功能的用户交互流程
- 功能之间的优先级
- 异常情况的处理方式`,

  non_functional: `请澄清以下非功能需求的具体指标：
- 性能要求（如响应时间、并发数）
- 可用性要求（如 uptime）
- 可扩展性要求`,

  business: `请澄清以下业务需求：
- 业务流程的具体规则
- 业务约束条件
- 商业模式和盈利方式`,

  technical: `请澄清以下技术需求：
- 技术栈偏好
- 第三方服务集成
- 部署环境要求`,

  user: `请澄清以下用户相关需求：
- 目标用户群体
- 用户角色和权限
- 用户体验要求`,

  data: `请澄清以下数据相关需求：
- 数据来源和更新频率
- 数据存储和备份策略
- 数据安全和隐私要求`,

  integration: `请澄清以下集成需求：
- 需要集成的外部系统
- API 集成方式
- 数据交换格式`,

  security: `请澄清以下安全需求：
- 认证和授权方式
- 数据加密要求
- 合规性要求（如 GDPR、等保）`,
};

// 答案评估提示词
export const ANSWER_EVALUATION_PROMPT = `## 任务
评估用户对澄清问题的回答是否足够详细和清晰。

## 原始问题
{{question}}

## 用户回答
{{answer}}

## 评估标准
1. 回答是否解决了问题的核心
2. 是否有足够的细节
3. 是否引入了新的问题

## 输出格式
{
  "isSufficient": true/false,
  "score": 0-10,
  "feedback": "简短反馈",
  "followUpQuestions": ["如果不足，列出需要进一步澄清的问题"]
}`;

// 示例澄清问题集
export const EXAMPLE_QUESTIONS: ClarificationQuestion[] = [
  {
    id: 'q1',
    category: 'functional',
    question: '用户需要具备哪些核心功能？请列出必须具备的功能和可选功能。',
    priority: 'high',
  },
  {
    id: 'q2',
    category: 'user',
    question: '目标用户群体是谁？请描述主要用户角色的特征和使用场景。',
    priority: 'high',
  },
  {
    id: 'q3',
    category: 'technical',
    question: '是否有偏好的技术栈？如前端框架、后端语言、云服务商等。',
    priority: 'medium',
  },
  {
    id: 'q4',
    category: 'data',
    question: '需要存储哪些数据？数据的来源、更新频率和保留周期是怎样的？',
    priority: 'medium',
  },
  {
    id: 'q5',
    category: 'integration',
    question: '需要与哪些外部系统集成？如支付、短信、邮件等。',
    priority: 'low',
  },
];
