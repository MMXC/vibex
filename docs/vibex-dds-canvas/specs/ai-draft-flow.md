# Spec: AI Draft 模式交互流程规格

## 状态机

```
IDLE
  ↓ [用户输入文本]
LOADING (AI 解析中...)
  ↓
PREVIEW ← [AI 返回结构化卡片预览]
  ↓ [用户选择操作]
  ├→ ACCEPT → INSERT_CARDS → IDLE
  ├→ EDIT → 修改预览内容 → ACCEPT
  └→ RETRY → LOADING
```

## AI Prompt 设计

```typescript
const CARD_GENERATION_PROMPT = `
你是一个软件工程文档助手。根据用户的需求，生成结构化的[卡片内容]。

当前章节类型：{chapterType}
可用卡片类型：${availableCardTypes}

用户需求：{userInput}

输出格式（JSON）：
{
  "cards": [
    {
      "type": "cardType",
      "title": "卡片标题",
      "role": "作为角色",
      "action": "我想要行为",
      "benefit": "以便于收益"
    }
  ]
}

要求：
1. 最多生成 5 张卡片
2. 每张卡片必须有具体的 role/action/benefit
3. 如果用户需求模糊，生成最常见的 3-5 个用例
`;

const CARD_REFINE_PROMPT = `
用户选中了 {count} 张卡片，要求：{instruction}
当前卡片内容：
{cardsJson}

输出格式（JSON）：
{
  "cards": [
    { "id": "原卡片ID", "updatedField": "新值" },
    ...
  ]
}
`;
```

## 组件交互

```tsx
// AI ChatDrawer 中的卡片预览组件
<CardPreview
  cards={generatedCards}        // AI 返回的卡片数据
  onAccept={() => insertCards(generatedCards)}
  onEdit={(updated) => updatePreview(updated)}
  onRetry={() => retryGeneration()}
/>

// 预览状态下，按钮文案
<Button>✓ 接受 (插入 {cards.length} 张卡片)</Button>
<Button>✎ 编辑后接受</Button>
<Button>↺ 重试</Button>
```
