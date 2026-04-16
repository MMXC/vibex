# 提案：修复 Vibex DDS Canvas 组件树生成静默 400 错误

**Agent**: analyst
**日期**: 2026-04-17
**任务**: vibex-canvas-silent-400/agent-submit
**状态**: 正式提交

---

## 问题描述

当用户在 DDS Canvas 页面完成流程树生成后，点击"继续→组件树"按钮时：

- **期望**：前端校验用户是否已勾选上下文节点，未勾选时给出友好提示
- **实际**：后端返回 HTTP 400，前端无任何 toast 提示，用户困惑不知操作失败原因

用户场景：
1. 用户进入 DDS Canvas
2. 生成上下文树（若干节点存在）
3. 生成流程树
4. **未勾选**任何上下文节点
5. 点击"继续→组件树"
6. 页面无响应，无任何提示
7. 后端日志：`Zod validation failed: At least one context is required`

---

## 根因分析

**触发路径**：

```
用户点击"继续→组件树"
  → handleContinueToComponents() 执行
  → 前端发送 API 请求（contexts 为空数组）
  → 后端 generateComponentsSchema 校验失败
  → HTTP 400 + Zod error: "At least one context is required"
  → validatedFetch 抛出异常
  → catch 块执行 toast.showToast(err.message)
  → err.message = "API 请求失败: 400"  ← 原始 HTTP 状态混入
```

**根因 1（前端缺失前置校验）**：

`BusinessFlowTree.tsx` 第 760-762 行仅有空上下文检查：

```typescript
if (contextNodes.length === 0) {
  toast.showToast('请先生成上下文树', 'error');
  return;
}
```

但未检查 `contextsToSend.length === 0`（已生成但未勾选）。

**根因 2（错误信息丢失）**：

`handleResponseError()` 在 400 时：

```typescript
const err = res.json().catch(() => ({ error: `HTTP ${res.status}` }));
throw new Error((err as { error?: string }).error ?? defaultMsg);
```

当后端返回 `{ error: "At least one context is required" }` 时，`err.error` 为 undefined（因为 Zod validation 返回的格式可能不是 `{ error: string }`），导致 fallback 到 `"HTTP 400"`。

**根因 3（API Schema 校验顺序）**：

`generateComponentsSchema` 要求 `contexts: min(1)`，但 Zod 的 `.strict()` 模式下额外字段会被拒绝。如果请求 body 格式与 schema 略有差异，返回的 400 错误体可能不含 `error` 字段。

**触发条件总结**：

| 场景 | contextNodes | selectedNodeIds | contextsToSend | 后端结果 |
|------|-------------|-----------------|----------------|----------|
| 无上下文树 | `[]` | `[]` | `[]` | 400，前端有 toast |
| 有上下文，未勾选 | `[{...}]` | `{context: Set()}` | `activeContexts` | 正常（有默认行为） |
| 有上下文，已勾选部分 | `[{...}]` | `{context: Set({'id1'})}` | `selected` | 正常 |
| 有上下文，已勾选全部 | `[{...}]` | `{context: Set()}` | `activeContexts` | 正常 |

注：根因可能不是"已生成但未勾选"，而是其他 schema 校验失败。需 gstack 验证。

---

## 影响评估

| 维度 | 影响 |
|------|------|
| 用户体验 | 高：静默失败，用户无法理解为何操作无响应 |
| 功能完整性 | 中：组件树生成是画布流程的核心步骤 |
| 数据完整性 | 低：无数据损坏风险 |
| 频率 | 推测低：需用户明确跳过上下文勾选才会触发 |

---

## 方案

### 方案 A：前端前置校验 + 改进错误信息（推荐）

**改动点 1**：`BusinessFlowTree.tsx` - `handleContinueToComponents`

在 API 调用前增加校验：

```typescript
// 校验：至少有一个上下文被选中
if (contextsToSend.length === 0) {
  toast.showToast('请先勾选上下文节点，再生成组件树', 'error');
  return;
}
```

**改动点 2**：`canvasApi.ts` - `handleResponseError`

改进 400 错误信息提取：

```typescript
if (res.status === 400) {
  const body = await res.json().catch(() => null);
  // 尝试从多种错误格式提取 message
  const msg = body?.error ?? body?.message ?? body?.details ?? defaultMsg;
  throw new Error(msg ?? `请求参数错误: ${res.status}`);
}
```

**改动点 3**：`BusinessFlowTree.tsx` - `handleContinueToComponents` catch 块

确保 catch 块错误信息友好：

```typescript
} catch (err) {
  canvasLogger.BusinessFlowTree.error(' handleContinueToComponents error:', err);
  const msg = err instanceof Error ? err.message : '生成组件树失败';
  // 过滤掉原始 HTTP 状态码残留
  const friendlyMsg = msg.startsWith('API 请求失败')
    ? '生成组件树失败，请检查上下文和流程是否已正确生成'
    : msg;
  toast.showToast(friendlyMsg, 'error');
}
```

### 方案 B：后端改进错误响应格式

**改动点**：`ui-generator.ts` 或 `withValidation` 中间件

确保 Zod validation 失败时返回标准 `{ error: string }` 格式：

```typescript
// 在 withValidation 中捕获 Zod 错误并格式化
if (!success) {
  return c.json({
    error: zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
  }, 400);
}
```

### 推荐方案

采用 **方案 A**（前端校验），方案 B 作为可选增强。理由：
- 前端前置校验用户体验最优（失败前拦截）
- 改进错误信息提取是兜底保障
- 后端改动涉及共享中间件，影响范围更大

---

## 验收标准

### 功能验收

- [ ] 用户未勾选上下文节点时点击"继续→组件树"，页面显示 toast：`请先勾选上下文节点，再生成组件树`
- [ ] 后端返回 400 时（任何原因），toast 显示后端错误信息而非原始 HTTP 状态码
- [ ] 已勾选上下文的正常流程不受影响

### 技术验收

- [ ] 无新增 TypeScript 类型错误
- [ ] 相关组件有单元测试覆盖（`BusinessFlowTree.test.tsx` 新增场景）
- [ ] `handleResponseError` 函数有测试覆盖

### 测试场景

```typescript
// 场景 1：未勾选上下文节点
test('未勾选上下文节点时应显示 toast', async () => {
  // Given: contextNodes 有数据，selectedNodeIds.context 为空
  // When: handleContinueToComponents()
  // Then: toast.showToast('请先勾选上下文节点...')
});

// 场景 2：后端返回 400 错误
test('后端 400 时应显示友好错误信息', async () => {
  // Given: API 返回 400 + { details: '...' }
  // When: handleContinueToComponents()
  // Then: toast 显示具体错误而非 "HTTP 400"
});
```

---

## 工时估算

| 任务 | 预估工时 |
|------|----------|
| 前端校验 + toast | 1h |
| 错误信息改进 | 0.5h |
| 单元测试 | 1h |
| **合计** | **2.5h** |

---

## 风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| `toast.showToast` 在 BusinessFlowTree 中未注入 | 低 | 中 | 检查注入点已有 toast |
| 后端错误响应格式变更 | 低 | 低 | 改进提取逻辑覆盖多种格式 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 依赖项

- `BusinessFlowTree.tsx`（主改动文件）
- `canvasApi.ts`（错误处理改进）
- `toast` 依赖已存在于组件中（无需引入）

---

## 相关文件索引

- 前端入口：`vibex-fronted/src/components/canvas/BusinessFlowTree.tsx:757`（handleContinueToComponents）
- API 层：`vibex-fronted/src/lib/canvas/api/canvasApi.ts:122`（handleResponseError）
- 后端 Schema：`vibex-backend/src/schemas/canvas.ts:85`（generateComponentsSchema）
- 后端路由：`vibex-backend/src/routes/v1/canvas/index.ts:265`（generateComponents）
