# AGENTS.md — vibex-canvas-silent-400

**项目**: vibex-canvas-silent-400
**版本**: v1.0
**日期**: 2026-04-17

---

## 开发约束

### D1: 禁止事项

- ❌ **禁止引入新依赖** — 本次修复仅修改已有代码，无新增 npm 包
- ❌ **禁止修改 API 接口** — 仅修复前端处理逻辑
- ❌ **禁止修改后端代码** — 本次为纯前端修复
- ❌ **禁止硬编码 magic string** — toast 消息使用常量或从 i18n 读取（如已有）
- ❌ **禁止在按钮 disabled 逻辑中引入副作用**

### D2: 代码规范

- ✅ `contextsToSend` 计算使用 `useMemo`，避免重复计算
- ✅ `handleResponseError` 保持 `never` 返回类型
- ✅ 新增代码风格与文件现有风格一致（无 Prettier 重排大范围变更）
- ✅ 单元测试使用 `vi.mock` / `vi.spyOn`，与现有测试风格一致

### D3: 测试规范

- ✅ 每个 Story 的 AC 对应独立 `it` 块，命名清晰（描述场景而非实现）
- ✅ Mock 层：只 mock `canvasApi.fetchComponentTree`，不 mock 内部实现
- ✅ 回归测试必须覆盖：正常路径（有效 contexts + flows）
- ✅ `handleResponseError` 单元测试需 mock `Response` 对象（`vi.fn()` 模拟 `json()` 方法）

### D4: 提交规范

```
fix(canvas): 修复组件树生成静默 400 错误

- F1.1: 增加 contextsToSend 空数组前置校验，toast 提示具体原因
- F1.2: 优化"继续·组件树"按钮 disabled 逻辑
- F2.1: 修复 handleResponseError 中 res.json() 缺少 await 的 bug

Closes: vibex-canvas-silent-400
```

---

## ADR（日志架构决策）

### ADR-001: 前端前置校验 vs 后端参数校验

**决策**: 选择前端前置校验作为主要方案。

**理由**:
1. 改动量极小（4 行），零依赖，零风险
2. 在请求发出前提示用户，体验更好
3. 减少无效 API 调用，降低后端负载

**Trade-off**: 前端校验无法覆盖所有入口（如有其他入口调用同一 API）。但当前代码结构中，`fetchComponentTree` 仅被 `handleContinueToComponents` 一处调用，无此风险。

### ADR-002: handleResponseError 修复范围

**决策**: 仅修复 `canvasApi.ts` 中的 `handleResponseError`，不推广到其他 API 封装文件。

**理由**: 其他 API 文件（如 `dddApi.ts`、`canvasSseApi.ts`）若有相同 bug，应作为独立 ticket 处理。本项目聚焦于静默 400 修复。

**Trade-off**: 如果其他 API 文件有相同 bug，本项目不会修复。但 `grep` 扫描（F2.2）会记录结果，供后续处理。

### ADR-003: Toast 消息

**决策**: 使用中文硬编码消息 `请先确认至少一个上下文节点后再生成组件树`。

**理由**:
1. 现有项目 toast 均使用中文硬编码
2. 本次修复紧急，无需引入 i18n
3. 后续可作为独立 i18n ticket 统一处理

---

## 技术约束

### 约束 1: 与 CanvasPage.tsx 逻辑一致性

`contextsToSend` 的构建逻辑必须与 `CanvasPage.tsx` 保持一致：

```typescript
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const selectedContextSet = new Set(selectedNodeIds.context);
const contextsToSend =
  selectedContextSet.size > 0
    ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
    : activeContexts;
```

禁止修改此计算逻辑的结构，只在其后增加空数组校验。

### 约束 2: handleResponseError 为 shared function

`handleResponseError` 被 `canvasApi.ts` 中多个 API 方法调用，修改时需确保：
- 签名不变（参数类型不变）
- 返回类型保持 `never`
- 不引入新的副作用

### 约束 3: 按钮 disabled 逻辑

按钮 disabled 条件（按优先级）:
1. `!canGenerateComponents` — 无有效上下文或无流程
2. `componentGenerating` — 正在生成中（防重复提交）

---

## 文件变更清单

| 文件 | 变更类型 | 行数 |
|------|---------|------|
| `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` | 修改 | ~10 行 |
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 修改 | 1 行 |
| `vibex-fronted/src/components/canvas/BusinessFlowTree.test.tsx` | 新增测试 | ~50 行 |
| `vibex-fronted/src/lib/canvas/api/canvasApi.test.ts` | 新增测试 | ~30 行 |
