# Implementation Plan — vibex-sprint3-prototype-extend-qa

**项目**: vibex-sprint3-prototype-extend-qa
**版本**: 1.1（路径修正版）
**日期**: 2026-04-18（coord-decision 驳回后修正）
**角色**: Architect

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1-QA: FlowTreePanel 连线按钮 UI | E1-U1 ~ E1-U3 | 3/3 ✅ | E1-U1 |
| E2-QA: 属性面板 store 测试 | E2-U1 ~ E2-U3 | 3/3 ✅ | E2-U1 |
| E3-QA: 断点测试 | E3-U1 | 1/1 ✅ | E3-U1 |
| E4-QA: AI导入测试+timeout | E4-U1 ~ E4-U2 | 2/2 ✅ | E4-U1 |
| E0-QA: 全局回归 | E0-U1 ~ E0-U2 | 0/2 | E0-U1 |

> ⚠️ **E1-QA 跨模块约束**: FlowTreePanel 位于 `src/components/canvas/panels/`，连线按钮注入在 `CanvasPage.tsx` 的 headerActions 中，调用 `prototypeStore`（`src/stores/`）。禁止在 FlowTreePanel 组件内直接 import prototypeStore。
| E3-QA: 断点自动标记测试 | E5-U1 | 0/1 | E5-U1 |
| E4-QA: AI导入测试 + timeout | E6-U1 ~ E7-U1 | 0/2 | E6-U1 |
| E0-QA: 全局回归 | E8-U1 | 0/1 | E8-U1 |

---

## E1-QA: FlowTreePanel 连线按钮 UI

**目标**: 补全 E1-AC1 缺失的「添加连线」按钮 UI，端到端可交互。

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1: EdgeCreationModal 组件 ✅ | — | 模态框可打开，显示两个 page dropdown，确认后调用 onConfirm |
| E1-U2: FlowTreePanel 注入连线按钮 ✅ | E1-U1 | FlowTreePanel headerActions 含「添加连线」按钮，aria-label 正确，点击触发 EdgeCreationModal |
| E1-U3: EdgeCreationModal 组件测试 ✅ | E1-U1 | 3 cases: 正常流程 / 取消 / 重复 source-target 校验 |

### E1-U1: EdgeCreationModal 组件

**文件变更**: `src/components/prototype/EdgeCreationModal.tsx` (新建)

**实现步骤**:
1. 创建 `EdgeCreationModal` 组件，接收 `open / pages / onConfirm / onCancel` props
2. 内部 state: `sourceId`, `targetId`
3. 两个 `<select>` dropdown 渲染 `pages` 列表
4. 确认按钮：校验 `sourceId !== targetId`，调用 `onConfirm(sourceId, targetId)`
5. 取消按钮：调用 `onCancel()` 并重置 state

**风险**: 无

### E1-U2: CanvasPage 注入连线按钮

**文件变更**: `src/components/canvas/CanvasPage.tsx` (修改 headerActions)

**⚠️ 跨模块约束**: FlowTreePanel（canvas）不能 import prototypeStore（prototype）。按钮逻辑写在 CanvasPage.tsx 的 headerActions JSX 中，使用 usePrototypeStore hook。

**实现步骤**:
1. 在 CanvasPage.tsx `case 'flow':` 的 FlowTreePanel headerActions 中，扩展 TreeToolbar 或直接注入「添加连线」按钮（`aria-label="添加连线"`）
2. 按钮使用 `usePrototypeStore` 读取 `pages`
3. 点击后设置 local state `isModalOpen = true`
4. `<EdgeCreationModal>` 打开，onConfirm 调用 `usePrototypeStore.getState().addEdge` 后关闭 modal
5. 按钮加防抖：连点不重复触发

**风险**: 低 — headerActions 接口已存在；跨模块调用 prototypeStore 已验证无循环依赖

### E1-U3: EdgeCreationModal 组件测试

**文件变更**: `src/components/prototype/__tests__/EdgeCreationModal.test.tsx` (新建)

**实现步骤**:
1. case 1: 正常流程 — 选择 source → 选择 target → confirm → onConfirm 被调用
2. case 2: 取消 — 点击取消 → onCancel 被调用，onConfirm 不调用
3. case 3: source === target 时 confirm 按钮禁用

---

## E2-QA: 属性面板 store 测试

**目标**: 为 `updateNodeNavigation` + `updateNodeBreakpoints` 补充 store 层单元测试。

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | updateNodeNavigation 单元测试 ✅ | — | 正常更新 navigation.target；undefined 时清除 navigation；不影响其他节点 |
| E2-U2 | updateNodeBreakpoints 单元测试 ✅ | — | 完整更新 breakpoints；部分字段更新时其他字段保持原值；不影响其他节点 |
| E2-U3 | Navigation + Responsive Tab 联动测试 ✅ | E2-U1, E2-U2 | 连续调用两个方法后节点同时包含 navigation 和 breakpoints |

### E2-U1: updateNodeNavigation 单元测试

**文件变更**: `src/stores/prototypeStore.test.ts` (追加 describe block)

**实现步骤**:
1. `describe('updateNodeNavigation')` — 追加到现有 test.ts
2. case: 正常设置 navigation → 验证 `node.data.navigation` 完整写入
3. case: `undefined` 传入 → 清除 `navigation` 字段（`toBeUndefined()`）
4. case: 多个节点，只更新一个 → 其他节点 `navigation` 不变
5. case: 更新不存在的 nodeId → 不抛错，`edges`/`nodes` 整体长度不变

### E2-U2: updateNodeBreakpoints 单元测试

**文件变更**: `src/stores/prototypeStore.test.ts` (追加 describe block)

**实现步骤**:
1. `describe('updateNodeBreakpoints')` — 追加到现有 test.ts
2. case: 完整更新 `{mobile:true,tablet:false,desktop:true}` → 验证精确匹配
3. case: 部分更新 `{mobile:false}` → 验证 `tablet/desktop` 保持原值（原有测试已覆盖初始状态，本测试验证增量逻辑）
4. case: 多个节点，只更新一个 → 其他节点 breakpoints 不变
5. case: 更新不存在的 nodeId → 不抛错

### E2-U3: Navigation + Responsive Tab 联动测试

**文件变更**: `src/stores/prototypeStore.test.ts` (追加 describe block)

**实现步骤**:
1. case: 先调用 `updateNodeNavigation` → 再调用 `updateNodeBreakpoints` → 验证节点同时有 `navigation` 和 `breakpoints` 字段

---

## E3-QA: 断点自动标记测试

**目标**: 为 `addNode` 断点自动标记逻辑补充 3 个独立测试用例（E3-AC3）。

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | addNode 断点自动标记测试 ✅ | — | 3 个断点状态各 1 个 case；mobile/tablet/desktop breakpoints 写入正确 |

### E3-U1: addNode 断点自动标记测试

**文件变更**: `src/stores/prototypeStore.test.ts` (追加 describe block)

**实现步骤**:
1. `describe('addNode breakpoint auto-tagging')` — 追加到现有 test.ts
2. case: `setBreakpoint('375')` → addNode → `breakpoints.mobile === true`
3. case: `setBreakpoint('768')` → addNode → `breakpoints.tablet === true`
4. case: `setBreakpoint('1024')` → addNode → `breakpoints.desktop === true`
5. 重置 store `breakpoint = '1024'` 以免影响其他测试（afterEach 中处理）

---

## E4-QA: AI导入测试 + fetch timeout

**目标**: 补充 `importFromImage` mock 测试 + 修正 fetch timeout。

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | importFromImage mock 测试 ✅ | — | 正常返回 / 空列表 / 解析错误 / 文件过大各 1 case |
| E4-U2 | fetch timeout 修正 + 测试 ✅ | E4-U1 | image-import.ts 包含 AbortSignal.timeout(30000)；AbortError 测试 case 通过 |

### E4-U1: importFromImage mock 测试

**文件变更**: `src/services/figma/image-import.test.ts` (新建)

**实现步骤**:
1. 使用 `vi.stubGlobal('fetch')` mock fetch 行为
2. case: 正常返回 `{ components: [...] }` → `success === true`，nodes 数量正确
3. case: AI 返回 `{ components: [] }` → `success === true`，nodes 为空
4. case: AI 返回非 JSON → `success === false`，error 包含 "解析失败"
5. case: 文件大小 > 10MB → `success === false`，不调用 fetch
6. 统一 `vi.restoreAllMocks()` 清理

### E4-U2: fetch timeout 修正 + 测试

**文件变更**: `src/services/figma/image-import.ts` (修改)

**实现步骤**:
1. 在 `fetch('/api/chat', ...)` 调用中添加 `signal: AbortSignal.timeout(30_000)`
2. `catch (err)` 已有 `AbortError` 判断（`err.name === 'AbortError'`），无需修改
3. 在 `image-import.test.ts` 中新增 case:
   - mock fetch 在 30s 内 reject `DOMException('timeout', 'AbortError')`
   - 验证 `result.error` 包含 "超时"

---

## E0-QA: 全局回归

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E0-U1 | 全局回归测试 | ⬜ | E1-U1 ~ E4-U2 | Sprint3 相关单元测试 >= 71/71 + 新增测试全部 PASS |
| E0-U2 | gstack browse E2E 验证 | ⬜ | E1-U1 | 4 Epic 端到端可交互，无新增 console.error |

### E0-U1: 全局回归测试

**实现步骤**:
1. 运行 `npm test` 验证 >= 71 existing + all new tests pass
2. 若有 pre-existing failures（ShortcutPanel/ExportMenu），确认为非 Sprint3 引入
3. 统计新增测试数量：>= 12 cases

### E0-U2: gstack browse E2E 验证

**实现步骤**:
1. 启动 dev server (`npm run dev`)
2. 使用 gstack browse 验证：
   - FlowTreePanel「添加连线」按钮可见
   - 点击按钮 → 模态框出现 → 选择 source/target → 确认
   - prototypeStore.edges 中有对应记录
3. E2/E3/E4 Epic 的属性面板、断点切换、AI 导入入口可交互
4. 截图存档，console 无新增 error

---

## 执行顺序

```
E1-U1 (EdgeCreationModal)
  └─ E1-U2 (FlowTreePanel 注入按钮)
       └─ E1-U3 (组件测试)
            └─ E0-U2 (E2E 验证部分)

E2-U1 + E2-U2 + E2-U3 + E3-U1 可并行执行（仅写测试，不改业务逻辑）
  └─ E4-U1 + E4-U2 可并行执行（测试 + 修复）

E0-U1 (全局回归) ← 依赖所有 Unit 完成后执行
E0-U2 (gstack E2E) ← 依赖 E1-U2 完成后执行
```
