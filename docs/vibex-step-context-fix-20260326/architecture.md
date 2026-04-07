# Architecture: vibex-step-context-fix-20260326

## Status
Accepted

## Context

后端 AI 已生成 `boundedContexts` 数组（id, name, description, type），但 SSE `step_context` 事件未传递该字段，前端类型定义缺失，前端 Store 只创建单一硬编码节点。用户看到永远只有一个"AI 分析上下文"节点。

---

## 决策

### 修改范围

仅修改 3 个文件，零新增依赖，方案 A 最小化修改：

| 文件 | 位置 | 修改内容 |
|------|------|---------|
| `route.ts` | `vibex-backend/src/app/api/v1/analyze/stream/` | SSE 事件补充 `boundedContexts` 字段 |
| `dddApi.ts` | `vibex-fronted/src/lib/canvas/api/` | `StepContextEvent` 接口 + 回调签名 |
| `canvasStore.ts` | `vibex-fronted/src/lib/canvas/` | `onStepContext` 循环创建多节点 + 降级逻辑 |

---

## 技术设计

### 1. 后端 SSE 事件修复

**文件**: `vibex-backend/src/app/api/v1/analyze/stream/route.ts`

```typescript
// 修改前（第 87-91 行）
sendSSE(controller, 'step_context', {
  content: summary,
  mermaidCode: contextMermaid,
  confidence,
  // ❌ boundedContexts 未发送
});

// 修改后
const contexts = data?.boundedContexts ?? [];
sendSSE(controller, 'step_context', {
  content: summary,
  mermaidCode: contextMermaid,
  confidence,
  // ✅ 新增: boundedContexts 数组
  ...(contexts.length > 0 && {
    boundedContexts: contexts.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
    })),
  }),
});
```

**向后兼容**: 当 `contexts.length === 0` 时，不发送 `boundedContexts` 字段，前端不受影响。

### 2. 前端类型定义更新

**文件**: `vibex-fronted/src/lib/canvas/api/dddApi.ts`

```typescript
// StepContextEvent 接口扩展
export interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  // ✅ 新增
  boundedContexts?: Array<{
    id: string;
    name: string;
    description: string;
    type: string; // 'core' | 'supporting' | 'generic'
  }>;
}

// 回调签名更新
export type StepContextCallback = (
  content: string,
  _mermaidCode: string | undefined,
  confidence: number | undefined,
  boundedContexts?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>
) => void;
```

### 3. 前端 Store 多节点逻辑

**文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`

```typescript
const MAX_CONTEXTS = 10;
const MAX_NAME_LENGTH = 30;

function truncateName(name: string): string {
  if (name.length <= MAX_NAME_LENGTH) return name;
  return name.slice(0, MAX_NAME_LENGTH - 3) + '...';
}

function mapContextType(type: string): 'core' | 'supporting' | 'generic' {
  if (type === 'core' || type === 'supporting' || type === 'generic') return type;
  return 'generic'; // 未知类型默认 generic
}

onStepContext: (content, _mermaidCode, confidence, boundedContexts) => {
  setAiThinking(true, content);
  if (confidence !== undefined && confidence > 0.5) {
    if (boundedContexts && boundedContexts.length > 0) {
      // ✅ 多节点场景：循环创建
      const limited = boundedContexts.slice(0, MAX_CONTEXTS);
      limited.forEach(ctx => {
        addContextNode({
          name: truncateName(ctx.name),
          description: ctx.description,
          type: mapContextType(ctx.type),
        });
      });
    } else {
      // ✅ 降级场景：保留原有单节点逻辑
      addContextNode({
        name: 'AI 分析上下文',
        description: content,
        type: 'core',
      });
    }
  }
}
```

---

## 数据流

```
User submits requirement
        ↓
Backend AI generates boundedContexts array
        ↓
Backend sends SSE step_context (with boundedContexts)
        ↓
Frontend dddApi.ts parses event
        ↓
Frontend canvasStore.ts onStepContext callback
        ↓
Loop addContextNode() → multiple nodes on canvas
```

---

## 数据模型

### StepContextEvent

```typescript
interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  boundedContexts?: Array<{
    id: string;
    name: string;          // 最大长度 30（截断后）
    description: string;
    type: 'core' | 'supporting' | 'generic';
  }>;
}
```

---

## 验收标准

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | 后端 SSE 事件含 boundedContexts（非空时） | SSE 解析测试 |
| P0 | 前端类型定义通过 TypeScript 编译 | `npm run build` |
| P0 | 多节点场景：3+ 节点展示 | E2E 测试 |
| P0 | 降级场景：单节点正常显示 | E2E 测试 |
| P0 | 节点数量 ≤ 10 | 单元测试 |
| P0 | 节点名称 ≤ 30 字符 | 单元测试 |
| P0 | type 映射正确（unknown → generic） | 单元测试 |

---

## 测试策略

### 单元测试

**Backend** (`route.ts`):
```typescript
test('step_context SSE includes boundedContexts when available', () => {
  const data = {
    boundedContexts: [
      { id: '1', name: '用户管理', description: '...', type: 'core' }
    ]
  };
  const event = parseStepContextEvent(data);
  expect(event.boundedContexts).toHaveLength(1);
  expect(event.boundedContexts[0].name).toBe('用户管理');
});

test('step_context SSE omits boundedContexts when empty', () => {
  const data = { boundedContexts: [] };
  const event = parseStepContextEvent(data);
  expect(event.boundedContexts).toBeUndefined();
});
```

**Frontend** (`canvasStore.ts`):
```typescript
describe('onStepContext multi-node logic', () => {
  test('creates multiple nodes for boundedContexts', () => {
    const ctxs = [
      { id: '1', name: '用户管理', description: 'd1', type: 'core' },
      { id: '2', name: '商品管理', description: 'd2', type: 'core' },
    ];
    onStepContext('done', undefined, 0.8, ctxs);
    expect(store.getState().nodes.length).toBe(2);
  });

  test('falls back to single node when boundedContexts is empty', () => {
    onStepContext('done', undefined, 0.8, []);
    expect(store.getState().nodes[0].name).toBe('AI 分析上下文');
  });

  test('limits nodes to MAX_CONTEXTS (10)', () => {
    const ctxs = Array.from({ length: 15 }, (_, i) => ({
      id: String(i), name: `C${i}`, description: 'd', type: 'core'
    }));
    onStepContext('done', undefined, 0.8, ctxs);
    expect(store.getState().nodes.length).toBe(10);
  });

  test('truncates names > 30 chars', () => {
    const ctx = { id: '1', name: 'A'.repeat(50), description: 'd', type: 'core' };
    onStepContext('done', undefined, 0.8, [ctx]);
    expect(store.getState().nodes[0].name.length).toBe(30);
    expect(store.getState().nodes[0].name.endsWith('...')).toBe(true);
  });

  test('maps unknown type to generic', () => {
    const ctx = { id: '1', name: 'C', description: 'd', type: 'unknown' };
    onStepContext('done', undefined, 0.8, [ctx]);
    expect(store.getState().nodes[0].type).toBe('generic');
  });
});
```

### E2E 测试

```typescript
test('complex requirement shows 3+ context nodes', async () => {
  await page.goto('/');
  await page.fill('[data-testid=requirement-input]', '开发一个电商平台...');
  await page.click('[data-testid=submit-btn]');
  await page.waitForSelector('[data-testid=context-node]', { timeout: 10000 });
  const nodes = await page.$$('[data-testid=context-node]');
  expect(nodes.length).toBeGreaterThanOrEqual(3);
});

test('simple requirement shows single fallback node', async () => {
  await page.goto('/');
  await page.fill('[data-testid=requirement-input]', '做一个博客系统');
  await page.click('[data-testid=submit-btn]');
  await page.waitForSelector('[data-testid=context-node]', { timeout: 10000 });
  const nodes = await page.$$('[data-testid=context-node]');
  expect(nodes.length).toBe(1);
  expect(await nodes[0].textContent()).toContain('AI 分析上下文');
});
```

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 后端 AI 返回空 boundedContexts | 画布无节点 | 降级逻辑兜底，保持单节点 |
| 节点数量过多 (>10) | 性能/UI 问题 | 硬限制 MAX_CONTEXTS=10 |
| 节点名称过长 | UI 溢出 | 截断至 30 字符 + "..." |
| 未知 type 值 | 类型不匹配 | 默认映射为 'generic' |

---

## 架构评估

- **改动规模**: 3 文件，< 50 行代码变更
- **测试覆盖**: 单元测试 5 个 + E2E 测试 2 个
- **风险等级**: 低（纯修复，无新依赖）
- **向后兼容**: ✅（空数组时不发 boundedContexts 字段）
- **预估工时**: 30-45 分钟
