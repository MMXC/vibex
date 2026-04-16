# PRD — Vibex Canvas 组件树生成静默 400 修复

**项目**: vibex-canvas-silent-400
**版本**: v1.0
**日期**: 2026-04-17
**负责人**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

Canvas 三步流程第三步（生成组件树）存在静默 400 错误：当用户未勾选/确认任何上下文节点时，点击"继续·组件树"按钮，后端返回 400 但前端仅显示通用 toast `"生成组件树失败"`，未给出具体原因，用户不知如何操作。

根因分析发现两处问题：
1. `handleContinueToComponents` 缺少 `contextsToSend` 为空的前置校验
2. `handleResponseError` 中 `res.json()` 未使用 `await`，导致后端详细错误信息被吞掉

### 目标

- 用户在缺少有效上下文节点时点击"继续·组件树"，能立即看到明确提示，知道需要先确认上下文节点
- 修复 `handleResponseError` 的 async/await bug，使所有 API 400 响应能正确显示后端错误信息

### 成功指标

| 指标 | 目标 |
|------|------|
| 静默 400 发生率 | 从当前 100% 降至 0%（前置校验拦截无效请求）|
| 错误可理解率 | 用户看到 toast 后知道如何操作（预期 >90%）|
| regression | 正常路径（有效 contexts + flows）生成组件树功能不受影响 |

---

## 2. Epic 拆分

### Epic/Story 总览

| ID | 类型 | 标题 | 工时估算 | 验收标准数 | 依赖 |
|----|------|------|---------|-----------|------|
| E1 | Epic | 组件树生成前置校验 | 1 人时 | 4 | 无 |
| F1.1 | Story | contextsToSend 空数组前置校验 | 0.5 人时 | 2 | 无 |
| F1.2 | Story | 按钮 disabled 逻辑优化 | 0.5 人时 | 2 | F1.1 |
| E2 | Epic | handleResponseError async/await 修复 | 1 人时 | 3 | 无 |
| F2.1 | Story | 修复 canvasApi.ts 中 res.json() await | 1 人时 | 2 | 无 |
| F2.2 | Story | 修复全局 API 错误处理的 async/await（推广）| 1 人时 | 1 | F2.1 |

---

## 3. 验收标准

### E1 — Epic: 组件树生成前置校验

#### F1.1: Story — contextsToSend 空数组前置校验

**描述**: 在 `handleContinueToComponents` 中，`contextsToSend` 构建后增加空数组校验，拦截无效请求并给出明确提示。

**工作目录**: `vibex-frontend/src/components/canvas/BusinessFlowTree.tsx`

**验收标准**:

```typescript
// AC1: contextsToSend 为空时，toast 显示具体提示
// 场景：所有上下文节点 isActive === false，或 selectedNodeIds.context 为空且无 active 节点
// 预期：toast 提示 "请先确认至少一个上下文节点后再生成组件树"，类型为 error
expect(toastMock).toHaveBeenCalledWith(
  '请先确认至少一个上下文节点后再生成组件树',
  'error'
);

// AC2: 校验后函数正确 early return，不触发 API 调用
// 预期：fetchComponentTree 未被调用
expect(fetchComponentTreeMock).not.toHaveBeenCalled();
```

**页面集成**: 【需页面集成】BusinessFlowTree.tsx 的 handleContinueToComponents 函数

---

#### F1.2: Story — 按钮 disabled 逻辑优化

**描述**: 将 `contextsToSend` 有效性纳入"继续·组件树"按钮的 disabled 判断，在 UI 层面直接阻止无效操作。

**工作目录**: `vibex-frontend/src/components/canvas/BusinessFlowTree.tsx`

**验收标准**:

```typescript
// AC1: contextsToSend 为空时，按钮 disabled === true
// 场景：contextNodes 存在但所有节点 isActive === false
// 预期：按钮的 disabled 属性为 true
expect(screen.getByRole('button', { name: /继续·组件树/i })).toBeDisabled();

// AC2: contextsToSend 有效时，按钮可点击（仅受 componentGenerating 控制）
// 场景：至少一个上下文节点 isActive !== false，且 flowNodes.length > 0
// 预期：按钮的 disabled 属性等于 componentGenerating
expect(screen.getByRole('button', { name: /继续·组件树/i })).toBeEnabled();
```

**页面集成**: 【需页面集成】BusinessFlowTree.tsx 的"继续·组件树"按钮

---

### E2 — Epic: handleResponseError async/await 修复

#### F2.1: Story — 修复 canvasApi.ts 中 res.json() await

**描述**: 修复 `handleResponseError` 函数中 `res.json()` 缺少 `await` 的 bug，使后端返回的详细错误信息能正确显示。

**工作目录**: `vibex-frontend/src/lib/canvas/api/canvasApi.ts`

**验收标准**:

```typescript
// AC1: handleResponseError 能正确解析后端 JSON 错误响应
// 场景：fetch 返回 400，响应体为 { error: "上下文节点不能为空" }
// 预期：抛出的 Error 消息包含后端返回的 "上下文节点不能为空"，而非 "API 请求失败: 400"
await expect(handleResponseError(mockResponse400, 'default')).rejects.toThrow('上下文节点不能为空');

// AC2: handleResponseError 对非 JSON 响应正确 fallback
// 场景：fetch 返回 400，响应体为纯文本
// 预期：fallback 到 defaultMsg
await expect(handleResponseError(mockResponse400Text, 'default')).rejects.toThrow('default');
```

**页面集成**: 无（纯 API 层修复）

---

#### F2.2: Story — 推广检查全局 API 错误处理

**描述**: 扫描项目中其他调用 `res.json()` 的位置，确保没有相同问题。

**工作目录**: `vibex-frontend/src/`

**验收标准**:

```typescript
// AC1: 全局搜索 res.json() 调用，均有 await
// 预期：所有 res.json() 调用的 AST 中，父节点为 AwaitExpression
// 手动验证点：grep -rn "res.json()" src/ 输出中，每处前后 2 行内包含 await
```

**页面集成**: 无（代码扫描验证）

---

## 4. DoD (Definition of Done)

### 通用 DoD（每个 Story 必须满足）

- [ ] 代码改动已合入目标分支
- [ ] 对应单元测试覆盖所有 AC，测试通过
- [ ] 页面集成场景已在真实页面中手动验证
- [ ] regression 测试：正常路径（有效 contexts + flows）仍能生成组件树
- [ ] 代码 review 已通过
- [ ] 改动不大于原定的工时估算（说明：原估算为上限，若超出会触发重新评估）

### Story 特定 DoD

| Story | 特定 DoD |
|-------|---------|
| F1.1 | toast 文本与验收标准完全一致，大小写/标点不错位 |
| F1.2 | 按钮 disabled 逻辑不影响 flowNodes 为空时的显示行为 |
| F2.1 | 回归测试：其他 API 调用（如 fetchFlowTree）错误响应仍正常显示 |
| F2.2 | 扫描结果无遗漏（可要求 reviewer 二次确认） |

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | contextsToSend 空校验 | 在 API 调用前检查 contextsToSend 是否为空，空则 toast 并 early return | 2 条 expect() | 【需页面集成】BusinessFlowTree.tsx |
| F1.2 | 按钮 disabled 逻辑 | 将 contextsToSend 有效性纳入按钮 disabled 判断 | 2 条 expect() | 【需页面集成】BusinessFlowTree.tsx 按钮 |
| F2.1 | res.json() await 修复 | 修复 handleResponseError 中 res.json() 缺少 await 的 bug | 2 条 expect() | 无 |
| F2.2 | 全局 res.json() 扫描 | 扫描所有 res.json() 调用确保均有 await | 1 条验证 | 无 |

---

## 6. 执行决策

- **决策**: 推荐实施
- **执行项目**: vibex-canvas-silent-400
- **执行日期**: 待定（coord 排期）
- **方案**: 方案 A（前端前置校验 F1.1）+ F2.1（async/await 修复），可并行实施
- **优先级**: P2 — 用户体验问题，不影响核心功能，但影响用户操作流畅度
