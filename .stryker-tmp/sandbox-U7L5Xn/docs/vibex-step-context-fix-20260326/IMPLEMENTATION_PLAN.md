# Implementation Plan: vibex-step-context-fix-20260326

## Overview

修复 step_context 事件链路：后端传递 boundedContexts 数组 → 前端循环创建多节点 → 保留降级兼容。

---

## 实施顺序

### Phase 1: Backend SSE 修复（Epic 1）

**Story S1.1**: 后端 step_context 事件补充 boundedContexts

**修改文件**: `vibex-backend/src/app/api/v1/analyze/stream/route.ts`

**修改内容**:
```typescript
// 在 sendSSE(controller, 'step_context', {...}) 调用处
const contexts = data?.boundedContexts ?? [];
sendSSE(controller, 'step_context', {
  content: summary,
  mermaidCode: contextMermaid,
  confidence,
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

**验证**: 
```bash
# 启动后端，手动触发分析接口，捕获 SSE 输出
curl -N http://localhost:3001/api/v1/analyze/stream \
  -d '{"requirement":"开发一个电商平台"}' \
  -H "Content-Type: application/json"
# 检查 step_context 行是否包含 boundedContexts
```

**DoD**: 
- [ ] SSE 输出包含 `boundedContexts` 数组（当 AI 有数据时）
- [ ] 当 AI 无数据时 SSE 不包含 `boundedContexts` 字段

---

### Phase 2: Frontend 类型定义更新（Epic 2）

**Story S2.1**: 更新 StepContextEvent 接口

**修改文件**: `vibex-fronted/src/lib/canvas/api/dddApi.ts`

**修改内容**:
```typescript
export interface StepContextEvent {
  type: 'step_context';
  content: string;
  mermaidCode?: string;
  confidence: number;
  boundedContexts?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
}
```

**Story S2.2**: 更新 onStepContext 回调签名

**修改文件**: `vibex-fronted/src/lib/canvas/api/dddApi.ts`

**修改内容**:
```typescript
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

**验证**: 
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm run build
# 检查 TypeScript 编译无错误
```

**DoD**:
- [ ] `StepContextEvent` 接口包含 `boundedContexts` 字段
- [ ] `StepContextCallback` 类型包含 `boundedContexts` 参数
- [ ] TypeScript 编译通过

---

### Phase 3: Frontend Store 多节点逻辑（Epic 3）

**Story S3.1**: 实现循环创建节点

**修改文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`

在 `generateContextsFromRequirement` 的 `onStepContext` 回调中：

```typescript
const MAX_CONTEXTS = 10;
const MAX_NAME_LENGTH = 30;

function truncateName(name: string): string {
  if (name.length <= MAX_NAME_LENGTH) return name;
  return name.slice(0, MAX_NAME_LENGTH - 3) + '...';
}

function mapContextType(type: string): 'core' | 'supporting' | 'generic' {
  if (type === 'core' || type === 'supporting' || type === 'generic') return type;
  return 'generic';
}

onStepContext: (content, _mermaidCode, confidence, boundedContexts) => {
  setAiThinking(true, content);
  if (confidence !== undefined && confidence > 0.5) {
    if (boundedContexts && boundedContexts.length > 0) {
      const limited = boundedContexts.slice(0, MAX_CONTEXTS);
      limited.forEach(ctx => {
        addContextNode({
          name: truncateName(ctx.name),
          description: ctx.description,
          type: mapContextType(ctx.type),
        });
      });
    } else {
      // 降级：保留原有单节点逻辑
      addContextNode({
        name: 'AI 分析上下文',
        description: content,
        type: 'core',
      });
    }
  }
}
```

**Story S3.2-S3.5**: 数量限制、名称截断、类型映射、降级逻辑（已包含在 S3.1 中）

**验证**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --testPathPattern=canvasStore
# 5 个单元测试全部通过
```

**DoD**:
- [ ] 多节点场景：boundedContexts 有 2+ 项时创建 2+ 个节点
- [ ] 降级场景：无 boundedContexts 时创建"AI 分析上下文"单节点
- [ ] 节点数量限制：最多 10 个
- [ ] 名称截断：超过 30 字符截断并加 "..."
- [ ] 类型映射：unknown → generic

---

### Phase 4: E2E 验收测试（Epic 4）

**Story S4.1**: 端到端验收测试

**验证**: 
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm run dev &
sleep 5
npx playwright test --grep "step_context\|boundedContexts"
```

**DoD**:
- [ ] 复杂需求显示 3+ 个节点
- [ ] 简单需求显示单节点（降级）
- [ ] 所有 E2E 测试通过

---

## 时间估算

| Phase | Epic | 预估工时 |
|-------|------|---------|
| Phase 1 | Epic 1 后端 SSE | 10 分钟 |
| Phase 2 | Epic 2 前端类型 | 5 分钟 |
| Phase 3 | Epic 3 前端 Store | 15 分钟 |
| Phase 4 | Epic 4 E2E | 10 分钟 |
| **总计** | | **~40 分钟** |

---

## 实施检查清单

- [ ] Epic 1: 后端 `route.ts` 修改并提交
- [ ] Epic 1: SSE 手动验证通过
- [ ] Epic 2: 前端 `dddApi.ts` 修改并提交
- [ ] Epic 2: TypeScript 编译通过
- [ ] Epic 3: 前端 `canvasStore.ts` 修改并提交
- [ ] Epic 3: 单元测试 5/5 通过
- [ ] Epic 4: E2E 测试 2/2 通过
- [ ] 最终: `git add . && git commit -m "fix(step_context): multi-node boundedContexts display"`

### Epic1 完成状态: ✅ 已完成 (2026-03-26 15:06 UTC+8)
- F1.1 ✅ F1.2 ✅ F1.3 ✅ F1.4 ✅
- Build ✅
- npm run build 成功
