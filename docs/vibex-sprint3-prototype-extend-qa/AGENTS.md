# AGENTS.md — vibex-sprint3-prototype-extend-qa

**项目**: vibex-sprint3-prototype-extend-qa
**版本**: 1.1（路径修正版）
**日期**: 2026-04-18（coord-decision 驳回后修正）
**角色**: Architect

---

## 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | 已采纳 |
| **执行项目** | vibex-sprint3-prototype-extend-qa |
| **执行日期** | 2026-04-18 |

---

## 驳回红线

以下情况 Architect 有权驳回：

- 架构设计不可行 → 驳回重新设计
- 接口定义不完整 → 驳回补充
- 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
- 未执行 Technical Design 阶段 → 驳回补充
- 未执行 /plan-eng-review 技术审查 → 驳回补充

---

## 开发约束

### 技术约束

1. **不引入新依赖** — 所有修复使用现有 Vitest + @testing-library/react + vi.fn()
2. **Fetch mock 方式** — 使用 `vi.stubGlobal('fetch', ...)` 而非第三方 mock 库
3. **AbortSignal.timeout()** — 直接使用，不做 polyfill 检测（目标浏览器已支持）
4. **FlowTreePanel 修改方式** — 通过 `CanvasPage.tsx` 的 `headerActions` prop 注入按钮，不修改 TreePanel 基础组件
5. **EdgeCreationModal 独立文件** — 新建 `src/components/prototype/EdgeCreationModal.tsx`，不混入 FlowTreePanel
6. **Canvas × Prototype 跨模块约束** — FlowTreePanel（canvas 模块）× prototypeStore（prototype 模块）：FlowTreePanel 的 headerActions 按钮可直接调用 `usePrototypeStore.getState().addEdge()`，无需 props drilling。禁止在 FlowTreePanel 中 import prototypeStore；改为在 CanvasPage.tsx 的 headerActions JSX 中使用 hook

### 测试约束

1. **Vitest 运行** — `npm test` 必须全部通过，不修改 test runner 配置
2. **store 测试隔离** — 每个 `describe` 块内 `beforeEach` 必须调用 `resetStore()`
3. **breakpoint 状态重置** — `describe('addNode breakpoint auto-tagging')` 内 afterEach 重置 `setBreakpoint('1024')`
4. **fetch mock 清理** — 每个测试文件 `afterEach` 必须 `vi.restoreAllMocks()`
5. **E2E 使用 gstack browse** — 禁止用其他 headless 工具

### 代码风格约束

1. **组件命名** — `EdgeCreationModal`（PascalCase），按钮 `aria-label="添加连线"`
2. **测试文件位置** — `__tests__/` 目录下，`*.test.ts` 或 `*.test.tsx`
3. **无 test-id 污染** — 优先用 `getByRole('button', {name: /添加连线/})`，不用 `data-testid`
4. **store 测试用 `usePrototypeStore.getState()`** — 不使用 render + act 包装
5. **类型注解** — 新增函数必须有 TypeScript 类型，`image-import.ts` 的 `result` 类型保持 `ImageImportResult`

### 文件路径约束

```
src/stores/prototypeStore.test.ts              ← E2-QA / E3-QA 测试追加
src/services/figma/image-import.ts              ← E4-QA fetch timeout 修正
src/services/figma/image-import.test.ts         ← E4-QA 新建
src/components/prototype/EdgeCreationModal.tsx  ← E1-QA 新建（prototype 模块）
src/components/prototype/__tests__/EdgeCreationModal.test.tsx  ← E1-QA 新建
```

### 禁止事项

- ❌ 禁止修改 `prototypeStore.ts` 的业务逻辑（除 bug 修复外）
- ❌ 禁止修改 Vitest / Jest 配置
- ❌ 禁止在 FlowTreePanel 组件内 import prototypeStore（跨模块调用必须通过 CanvasPage.tsx 的 headerActions JSX）
- ❌ 禁止在 `ComponentTreePanel`、`ContextTreePanel` 等其他 TreePanel 中注入连线按钮（仅 FlowTreePanel 的 'flow' case 需要）
- ❌ 禁止在单元测试中使用 `setTimeout` 模拟 AbortError（必须用 Promise reject）
- ❌ 禁止跳过 `npm test` 验证直接提交
- ❌ 禁止在 E2E 验证中使用非 gstack 工具

---

## 验收标准

### E1-QA DoD

- [ ] `EdgeCreationModal.tsx` 存在且渲染正常
- [ ] FlowTreePanel 有「添加连线」按钮（`aria-label` 可查询）
- [ ] 按钮点击 → 模态框打开 → 选择 source → 选择 target → confirm → edges 新增
- [ ] `EdgeCreationModal.test.tsx` ≥ 3 cases pass
- [ ] gstack browse 端到端验证通过

### E2-QA DoD

- [ ] `updateNodeNavigation` 测试 ≥ 4 cases（正常更新 / undefined 清除 / 多节点隔离 / 无效 nodeId）
- [ ] `updateNodeBreakpoints` 测试 ≥ 3 cases（完整更新 / 部分更新 / 多节点隔离）
- [ ] 联动测试 ≥ 1 case（navigation + breakpoints 同时存在）
- [ ] 所有 Sprint3 store 测试 pass

### E3-QA DoD

- [ ] `addNode breakpoint auto-tagging` 测试 ≥ 3 cases（375 / 768 / 1024 各一）
- [ ] 测试在 `describe('prototypeStore')` 顶层下追加，不新建文件

### E4-QA DoD

- [ ] `image-import.ts` 中 `fetch` 包含 `signal: AbortSignal.timeout(30_000)`
- [ ] `image-import.test.ts` ≥ 5 cases（正常返回 / 空列表 / 解析错误 / 文件过大 / AbortError）
- [ ] `npm test` 验证 image-import 相关全部 pass

### 全局 DoD

- [ ] Sprint3 相关单元测试 >= 71/71 + 新增测试
- [ ] 无新增 console.error（gstack browse 验证）
- [ ] 所有 commit 遵守 AGENTS.md 约束

---

## 执行项目

| Epic | 优先级 | 预计工时 | 负责人 |
|------|--------|---------|-------|
| E1-QA EdgeCreationModal + 按钮 | P0 | 2h | dev |
| E2-QA store 测试补全 | P1 | 1.5h | dev |
| E3-QA 断点测试补全 | P2 | 0.5h | dev |
| E4-QA mock 测试 + timeout | P1 | 1.5h | dev |
| E0-QA 全局回归 + E2E | — | 1h | dev |

**合计**: ~6.5h（1天快速迭代）
