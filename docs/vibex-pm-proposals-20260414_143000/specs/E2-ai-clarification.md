# Spec: E2 - AI 澄清卡片组件规格

## 组件接口

```typescript
interface ClarificationCardProps {
  question: string;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  index: number; // 1-based
  total: number;
}

// 追问 prompt
const PROMPT = `
你是 VibeX 需求分析助手。用户输入了不完整需求，提取 1-3 个关键澄清问题。
要求：每个问题具体、可回答，最多 3 个。
输出：JSON { questions: [{ id, text }] }
用户需求：{requirement}
`;

// 最大追问轮次
const MAX_ROUNDS = 3;

// 自动结束：连续 2 轮无新信息
const AUTO_END_THRESHOLD = 2;
```

## UI 规范

- 卡片样式：玻璃态（backdrop-filter: blur）
- 最多同时显示 3 张卡片
- 跳过按钮：ghost 样式，文字"跳过，直接生成"
- 追问轮次显示："问题 1/3"
