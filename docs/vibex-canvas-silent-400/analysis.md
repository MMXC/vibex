# Vibex Canvas 静默 400 问题分析

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`
**分析日期**: 2026-04-17
**问题等级**: P2 — 用户体验问题，错误信息不明确

---

## 1. 业务场景分析

Canvas 三步流程为：

```
步骤1: 上下文树 (Context Tree) → 步骤2: 业务流程树 (Flow Tree) → 步骤3: 组件树 (Component Tree)
```

用户完成步骤2后，点击"继续·组件树"按钮，触发 `fetchComponentTree` API 调用，传入 `contexts` 和 `flows` 数据。

**问题定位**：当 API 返回 400 错误时，前端 toast 只显示通用错误 `生成组件树失败`，没有具体原因，用户不知道哪里填错了或缺少什么。

---

## 2. 根因分析

### 2.1 `handleResponseError` async/await Bug

**文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts` 第 145-166 行

```typescript
function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): never {
  // ...401, 404 handling...
  const err = res.json().catch(() => ({ error: `HTTP ${res.status}` })); // BUG: res.json() 是异步的，没有 await
  throw new Error((err as { error?: string }).error ?? defaultMsg); // err 是 Promise，永远是 undefined
}
```

`res.json()` 返回 `Promise<any>`，但代码中没有 `await`。所以：
- `err` 是 `Promise` 对象，不是解析后的对象
- `err.error` 永远是 `undefined`
- 最终抛出的是 `defaultMsg = "API 请求失败: 400"`
- **后端返回的详细错误信息被吞掉了**

### 2.2 缺少 contextsToSend 前置校验

**文件**: `BusinessFlowTree.tsx` 第 757-819 行

当前 `handleContinueToComponents` 中的校验逻辑：

```typescript
// 第 767 行：只检查 contextNodes 是否为空数组
if (contextNodes.length === 0) {
  toast.showToast('请先生成上下文树', 'error');
  return;
}

// 第 775-782 行：构建 contextsToSend
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const selectedContextSet = new Set(selectedNodeIds.context);
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;
```

**漏洞**：
- 如果所有上下文节点的 `isActive === false`（全部未确认），则 `activeContexts` 为空数组
- `contextsToSend` 为空 → `mappedContexts` 为空数组
- API 收到空数组，可能返回 400，但 toast 不够具体

### 2.3 "继续·组件树"按钮 disabled 逻辑不完整

**文件**: `BusinessFlowTree.tsx` 第 891-900 行

```tsx
{flowNodes.length > 0 && (
  <button
    disabled={componentGenerating} // 只检查 loading 状态，不检查 contextsToSend 是否有效
    onClick={handleContinueToComponents}
  >
    继续·组件树
  </button>
)}
```

按钮只检查 `componentGenerating` 锁，不检查 `contextsToSend` 是否有有效内容。

---

## 3. 技术方案选项

### 方案 A：前端前置校验（推荐）

**原理**：在 API 调用前，增加 `contextsToSend.length === 0` 的前置检查，提前拦截无效请求并给出具体提示。

**改动点**：

```typescript
// BusinessFlowTree.tsx handleContinueToComponents 中，contextsToSend 构建后增加：
if (contextsToSend.length === 0) {
  toast.showToast('请先确认至少一个上下文节点后再生成组件树', 'error');
  return;
}
```

**优点**：
- 改动量极小（4 行）
- 用户体验好 — 在请求发出前就提示具体原因
- 不依赖后端改动
- 同时修复 `handleResponseError` 的 async/await 问题

**缺点**：
- 只能处理这一处入口，其他入口（如有）需要同步修复

### 方案 B：后端改进错误响应

**原理**：后端对 400 响应返回一个 user-friendly 的 `error.message`，前端正确显示。

**改动点**：
1. 后端 `canvasApi.ts` 中 `handleResponseError` 修复 async/await
2. 后端对所有 400 错误返回 `{ error: "具体原因" }` 格式的 JSON

**优点**：
- 全局生效，所有 API 调用都能拿到具体错误信息

**缺点**：
- 需要后端配合，跨团队依赖
- 后端 schema 变更需考虑兼容性

### 方案 C：前端 + 后端组合

**原理**：前端加前置校验（方案A）+ 后端修复 async/await（方案B）+ 前端增强 catch 兜底。

**改动点**：
1. 前端：增加 `contextsToSend.length === 0` 检查（方案A）
2. 前端：修复 `handleResponseError` 的 async/await（方案B前置）
3. 后端：确保 400 响应返回有意义的 error message

**优点**：最全面，根因 + 症状双管齐下

**缺点**：需要后端配合，改动范围较大

---

## 4. 可行性评估

| 维度 | 评估 |
|------|------|
| **技术难度** | 低 — 前端单文件 4 行改动 |
| **风险** | 低 — 纯新增校验逻辑，不修改现有流程 |
| **工期估算** | < 1 人时（方案A），1-2 人时（方案B），2-3 人时（方案C） |
| **兼容性** | 向后兼容，无破坏性 |
| **测试覆盖** | 需覆盖：空 contexts / 全 inactive / 正常路径 / 真实 400 响应 |

---

## 5. 初步风险识别

### 5.1 toast 注入位置风险
- toast (`useToast`) 已在第 724 行存在，组件内可直接使用 ✅
- 新增 toast 位置在 `handleContinueToComponents` 函数内部，无作用域风险 ✅

### 5.2 后端 schema 变更兼容性（方案B/C 涉及）
- 如果后端 400 响应格式不是 `{ error: string }`，前端解析会 fallback 到 defaultMsg
- 建议后端对所有错误响应统一格式，或前端先检查响应类型

### 5.3 测试覆盖要求
- 单元测试：`handleContinueToComponents` 在 contextsToSend 为空时的行为
- E2E 测试：模拟 400 响应，验证 toast 显示内容

---

## 6. 验收标准

### 方案A 验收（推荐实施路径）

- [ ] 当 `contextsToSend` 为空时，点击"继续·组件树"按钮后，toast 显示 `请先确认至少一个上下文节点后再生成组件树`
- [ ] 按钮 disabled 逻辑不变，不影响正常用户流程
- [ ] 当 API 真实返回 400 时（后端修复后），toast 显示后端返回的具体错误信息，而非 `生成组件树失败`
- [ ] 不存在任何 regression：正常路径（有效 contexts + flows）仍能正确生成组件树
- [ ] `handleResponseError` 中的 `res.json()` 已正确 await（配合方案B前提）

---

## 7. 建议

**立即实施**：方案 A — 前端前置校验。

理由：
1. 改动量最小，风险最低
2. 直接改善用户体验 — 在请求发出前就知道原因
3. 可独立完成，不阻塞后端
4. 同时发现并记录了 `handleResponseError` 的 async/await bug，后续可作为独立 ticket 修复

**后续跟进**：方案 B — 后端修复 `handleResponseError`，作为独立 ticket。

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
- **建议**: 推荐实施方案A，前端前置校验
