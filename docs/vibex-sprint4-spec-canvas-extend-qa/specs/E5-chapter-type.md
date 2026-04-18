# Spec: E5 — ChapterType/CardType 扩展规范

**对应 Epic**: E1 + E2（类型系统扩展）
**文件**: `vibex-fronted/src/types/dds/index.ts`
**相关**: `vibex-fronted/src/components/dds/cards/CardRenderer.tsx`, `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`

---

## 1. ChapterType 扩展

```typescript
// 现有
export type ChapterType = 'requirement' | 'context' | 'flow';

// Sprint4 扩展
export type ChapterType = 'requirement' | 'context' | 'flow' | 'api' | 'businessRules';
```

### DDSCanvasStore 扩展

```typescript
// chapters 类型扩展
chapters: {
  requirement: ChapterData;
  context: ChapterData;
  flow: ChapterData;
  api: ChapterData;           // 新增
  businessRules: ChapterData;  // 新增
}
```

---

## 2. CardType 扩展

```typescript
// 现有
export type CardType = 'user-story' | 'bounded-context' | 'flow-step';

// Sprint4 扩展
export type CardType = 'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint' | 'state-machine';
```

---

## 3. 新卡片类型定义

```typescript
// APIEndpointCard 数据结构
interface APIEndpointCard extends BaseCard {
  type: 'api-endpoint';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;                        // 如 /api/users
  summary: string;                     // 端点描述
  description?: string;
  params?: Array<{
    name: string;
    in: 'query' | 'header' | 'path';
    required: boolean;
    schema: object;
  }>;
  requestBody?: {
    contentType: string;
    schema: object;
  };
  responses?: Record<string, {
    description: string;
    schema?: object;
  }>;
}

// StateMachineCard 数据结构
interface StateMachineCard extends BaseCard {
  type: 'state-machine';
  stateId: string;                     // 状态标识
  stateType: 'initial' | 'final' | 'normal' | 'choice' | 'join' | 'fork';
  events?: string[];                   // 可触发事件列表
  metadata?: Record<string, string>;   // 额外元数据
}
```

---

## 4. CardRenderer 扩展

```typescript
// CardRenderer.tsx 新增分支
switch (card.type) {
  case 'user-story':     return <RequirementCard card={card} />;
  case 'bounded-context': return <BoundedContextCard card={card} />;
  case 'flow-step':      return <FlowStepCard card={card} />;
  case 'api-endpoint':   return <APIEndpointCard card={card} />;       // 新增
  case 'state-machine':  return <StateMachineCard card={card} />;      // 新增
}
```

---

## 5. 样式 Token 扩展

```css
/* src/styles/tokens/dds-tokens.css 新增 */
:root {
  /* HTTP 方法颜色 */
  --color-method-get: #22c55e;     /* green-500 */
  --color-method-post: #3b82f6;    /* blue-500 */
  --color-method-put: #f97316;     /* orange-500 */
  --color-method-delete: #ef4444;  /* red-500 */
  --color-method-patch: #a855f7;   /* purple-500 */

  /* 状态机节点颜色 */
  --color-sm-initial: #22c55e;     /* green-500 */
  --color-sm-final: #6b7280;        /* gray-500 */
  --color-sm-normal: #3b82f6;       /* blue-500 */
  --color-sm-choice: #eab308;      /* yellow-500 */
  --color-sm-join: #a855f7;        /* purple-500 */
  --color-sm-fork: #f97316;        /* orange-500 */

  /* 跨章节边颜色 */
  --color-cross-chapter-edge: #8b5cf6;  /* purple-500 */
}
```

---

## 6. 约束

- 新增 ChapterType/CardType 必须在 `types/dds/index.ts` 中定义，禁止在其他文件中散落定义
- 每个新 CardType 必须有对应的 Card 组件文件
- DDSCanvasStore 行数监控：超过 500 行则拆分为独立 store
- 所有颜色值必须通过 CSS Token 引用，禁止硬编码
