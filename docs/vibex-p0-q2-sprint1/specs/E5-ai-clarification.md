# Spec: E5 - AI 澄清卡片 + Prompt 设计规格

## E5.1 澄清卡片组件接口

```typescript
interface ClarificationCardProps {
  question: string;         // 具体澄清问题
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  index: number;           // 第几题（1-based）
  total: number;           // 总题数
}

interface ClarificationState {
  round: number;           // 当前追问轮次（从 1 开始）
  questions: ClarificationCardProps[];
  answers: Record<string, string>; // questionId -> answer
}
```

## E5.2 AI 追问 Prompt 设计

```typescript
// 追问系统 prompt（截取核心逻辑）
const CLARIFICATION_PROMPT = `
你是 VibeX 的需求分析助手。用户输入了不完整的需求，请提取最关键的 1-3 个澄清问题。

要求：
1. 每个问题必须是具体的、可回答的（不是开放式的"请详细描述"）
2. 问题针对：实体（什么实体）、行为（谁做什么）、约束（有什么限制）
3. 最多 3 个问题，超过时优先问最重要的

输出格式（JSON）：
{
  "questions": [
    { "id": "q1", "text": "你提到的"用户"是指注册会员还是访客？" },
    { "id": "q2", "text": "订单状态需要包含哪些流转节点？" }
  ]
}

用户当前需求：{requirementText}
`;

// 最大追问轮次
const MAX_CLARIFICATION_ROUNDS = 3;

// 自动结束逻辑：连续 2 轮无新信息
const AUTO_END_THRESHOLD = 2;
```

## E5.3 澄清卡片 UI 规范

```typescript
// E5.1.1 卡片样式（玻璃态）
const cardStyle = {
  background: 'var(--color-bg-glass)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-3)',
};

// E5.1.2 问题展示格式
// "问题 1/3：你提到的'用户'是指注册会员还是访客？"

// E5.1.3 跳过按钮
// 文字："跳过，直接生成"
// 样式：ghost button，浅色文字

// E5.2.3 追问质量验证（端到端）
test('经澄清后需求更完整', async () => {
  const requirement = '做个电商系统';
  const clarified = await getClarifiedRequirement(requirement, {
    q1: '注册会员',
    q2: '订单状态：待支付/已支付/已发货/已完成',
  });
  expect(clarified.entityCount).toBeGreaterThan(countEntities(requirement));
  expect(clarified.flowCount).toBeGreaterThan(countFlows(requirement));
});
```

## E5.4 状态流转

```
[用户输入需求]
    ↓
[检测关键词：实体/动词]
    ↓
[显示澄清卡片 1-N（≤3）]
    ↓
[用户回答 或 跳过]
    ↓
[更新需求描述 + 继续生成]
    或
[连续 2 轮无新信息 → 自动结束]
    ↓
[AI 生成 DDD 模型]
```
