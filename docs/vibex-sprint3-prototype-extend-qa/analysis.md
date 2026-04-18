# 需求分析报告 — vibex-sprint3-prototype-extend-qa

**项目**: vibex-sprint3-prototype-extend-qa
**任务**: analyze-requirements
**角色**: Analyst
**日期**: 2026-04-18
**状态**: Done

---

## 执行摘要

| Epic | 代码实现 | 测试覆盖 | 状态 |
|------|---------|---------|------|
| E1 页面跳转连线 | 部分实现（缺 FlowTreePanel 连线按钮） | 无 E1 tester 报告 | ⚠️ 条件通过 |
| E2 组件属性面板 | ✅ 完整实现 | ⚠️ 交互测试缺失 | ✅ 验收通过 |
| E3 响应式断点 | ✅ 完整实现 | ✅ 单元测试 71/71 | ✅ 验收通过 |
| E4 AI 草图导入 | ✅ 完整实现 | ⚠️ 服务无单元测试 | ✅ 验收通过 |

**结论: Conditional** — E1 UI 缺失，E2/E3/E4 功能完整但测试覆盖有缺口。

---

## 1. Epic 交付物核查

### E1: 页面跳转连线

| 验收标准 | 代码实现 | 状态 |
|---------|---------|------|
| E1-AC1: FlowTreePanel「添加连线」按钮 | `FlowTreePanel.tsx` 无连线按钮 UI | ❌ 缺失 |
| E1-AC1: prototypeStore.edges CRUD | `addEdge`/`removeEdge` 在 `prototypeStore.ts:225-248` | ✅ |
| E1-AC2: 画布连线渲染（React Flow） | `ProtoFlowCanvas.tsx` 有 `onConnect` handler（拖拽创建边） | ✅ |
| E1-AC2: 连线可被选中并删除 | React Flow 内置 edge selection + `removeEdge` | ✅ |
| E1-AC3: 页面删除时相关 edge 级联清除 | `prototypeStore.ts:169` filter `source !== nodeId && target !== nodeId` | ✅ |

**关键缺陷**: E1-AC1 要求的 FlowTreePanel「添加连线」按钮 UI 完全缺失。PRD 指定的文件变更清单中 `FlowTreePanel.tsx` 需要增加「添加连线」UI，但当前代码中无此功能。

**E1 tester 报告**: 不存在（`docs/vibex-sprint3-prototype-extend/` 下无 `tester-epic1-*` 文件）。

**风险**: E1 功能依赖 FlowTreePanel 发起 edge 创建，但 UI 入口不存在，用户无法使用此功能。React Flow 的拖拽连接（onConnect）提供了部分替代方案，但不符合 PRD 的「选择源页面→选择目标页面」交互设计。

---

### E2: 组件属性面板

| 验收标准 | 代码实现 | 状态 |
|---------|---------|------|
| E2-AC1: 双击节点打开属性面板 | `ProtoFlowCanvas.tsx:131` `onNodeDoubleClick` → `ProtoAttrPanel` | ✅ |
| E2-AC2: Data Tab 修改文字实时更新 | ProtoAttrPanel Data Tab 实现 | ✅ |
| E2-AC3: Navigation Tab 设置 target | `updateNodeNavigation` + Navigation Tab 下拉框 | ✅ |
| E2-AC4: Responsive Tab 设置断点规则 | `updateNodeBreakpoints` + 三个 Toggle | ✅ |

**测试报告**: `tester-epic2-property-panel-report-20260418-0039.md` — 单元测试 71/71 PASS，Browser 验证通过。

**风险**:
- Navigation Tab 下拉无独立单元测试（`updateNodeNavigation` 无 store 测试覆盖）
- Responsive Tab toggle 无独立单元测试
- Drag-to headless 限制导致 E2E 无法验证拖拽→Tab 显示流程

---

### E3: 响应式断点

| 验收标准 | 代码实现 | 状态 |
|---------|---------|------|
| E3-AC1: 设备切换工具栏按钮 | `ProtoEditor.tsx:232-266` aria-label/aria-pressed 正确 | ✅ |
| E3-AC2: 画布宽度缩放 | `ProtoFlowCanvas.tsx:139-141` `width: breakpoint` | ✅ |
| E3-AC3: 新节点自动标记断点 | `prototypeStore.ts:253` `addNode` 读取当前 `breakpoint` 状态 | ✅ |

**测试报告**: `tester-epic3-responsive-breakpoint-report-20260418-0156.md` — 单元测试 71/71 PASS，修复 commit `3c6ef500` 已应用。

**风险**:
- `prototypeStore.test.ts` 无 E3-AC3 特定测试用例（breakpoint auto-tagging 无独立测试）

---

### E4: AI 草图导入

| 验收标准 | 代码实现 | 状态 |
|---------|---------|------|
| E4-AC1: 图片上传入口 | `ImportPanel.tsx:293` accept `.png,.jpg,.jpeg`，drag-drop + preview | ✅ |
| E4-AC2: AI 解析结果列表 | `image-import.ts:importFromImage` 调用 `/api/chat`，loading + 错误处理 | ✅ |
| E4-AC3: 确认导入批量入画布 | `ImportPanel.tsx:135-155` 遍历 `addNode`，auto-layout | ✅ |

**测试报告**: `tester-epic4-ai-sketch-import-report-20260418-0207.md` — 单元测试 71/71 PASS。

**风险**:
- `ImportPanel` 组件无单元测试文件
- `image-import.ts` 服务无单元测试
- fetch 无显式 timeout 参数（`AbortError` catch 依赖浏览器默认超时，PRD 要求 ≤30s）
- Pre-existing failures: ShortcutPanel/ExportMenu (3个，非 E4 引入)

---

## 2. 代码质量风险

### 高风险

**E1-UI 缺失**: FlowTreePanel 无「添加连线」按钮，E1-AC1 无法通过手动测试。

### 中风险

| 风险 | 说明 |
|------|------|
| E2 交互测试覆盖不足 | Navigation/Responsive Tab 无单元测试，行为正确性依赖人工验证 |
| E4 无服务层测试 | `image-import.ts` 无任何单元测试，AI 解析结果结构变化无法被测试发现 |
| fetch timeout 未显式声明 | `image-import.ts` 的 fetch 无 `AbortSignal.timeout(30000)`，依赖浏览器默认行为 |

### 低风险

| 风险 | 说明 |
|------|------|
| `prototypeStore.test.ts` 缺口 | E3-AC3 breakpoint auto-tagging 无独立测试用例 |
| Pre-existing 失败 | ShortcutPanel/ExportMenu 的 3 个测试失败与 Sprint3 无关 |

---

## 3. 交付物完整性评估

### 文件变更清单对照（PRD vs 实际）

| PRD 文件 | 实际状态 |
|---------|---------|
| `stores/prototypeStore.ts` | ✅ `edges`、`breakpoint`、`addEdge`、`removeEdge`、`updateNodeNavigation`、`updateNodeBreakpoints`、`setBreakpoint`、`addNodes` 全部存在 |
| `components/ProtoAttrPanel.tsx` | ✅ 新建，`components/prototype/ProtoAttrPanel.tsx` |
| `components/FlowTreePanel.tsx` | ⚠️ 存在，但无「添加连线」按钮 |
| `components/ProtoFlowCanvas.tsx` | ✅ `components/prototype/ProtoFlowCanvas.tsx`，`onConnect` + `onNodeDoubleClick` + breakpoint width |
| `pages/CanvasPage.tsx` | ⚠️ PRD 提到修改，但实际工具栏在 `ProtoEditor.tsx` |
| `features/ImportPanel.tsx` | ✅ 位于 `components/canvas/features/ImportPanel.tsx`，E4 Tab 已加 |
| `services/figma/image-import.ts` | ✅ 新建 |
| `lib/prototypes/responsive.tsx` | ⚠️ 未检查（breakpoint 集成在 `ProtoFlowCanvas.tsx` 内部） |

### 关键差异
- FlowTreePanel 的 E1-AC1「添加连线」UI 缺失
- CanvasPage 工具栏变更实际在 ProtoEditor.tsx 而非 CanvasPage.tsx
- responsive.tsx 集成方式变更（直接在 ProtoFlowCanvas.tsx 内应用 breakpoint width）

---

## 4. 验收标准具体可测试性

以下验收标准需要通过 gstack browse 手动验证：

| Epic | AC | 测试命令 | 预期结果 |
|------|----|---------|---------|
| E1 | AC1 | FlowTreePanel 是否有「添加连线」按钮 | 当前: 按钮不存在 ❌ |
| E1 | AC1 | 拖拽连接两个节点 | 是否在 edges 中新增记录？ |
| E1 | AC3 | 删除页面后 edges 是否被清除 | 当前: 代码逻辑正确 ✅ |
| E2 | AC1 | 双击节点，属性面板是否打开 | 当前: 已验证 ✅ |
| E2 | AC3 | Navigation Tab 下拉选择 target | 需要 E2E 验证 |
| E2 | AC4 | Responsive Tab toggle 点击 | 需要 E2E 验证 |
| E3 | AC1 | 点击「手机」按钮 | 当前: 已验证 ✅ |
| E3 | AC2 | 切换断点画布宽度 | 当前: 已验证 ✅ |
| E4 | AC1 | ImportPanel 是否有「上传图片」入口 | 当前: 代码存在 ✅ |
| E4 | AC2 | 上传图片，AI 解析 | 需要实际图片测试 |

---

## 5. 历史经验教训应用

### canvas-testing-strategy 教训
> 测试中的 mockStore 过于简化，无法真实反映 Zustand store 行为。

**应用到 E2/E4**: Navigation/Responsive Tab 和 `importFromImage` 需要用真实的 store 测试覆盖，而非 mock。

### canvas-cors-preflight-500 教训
> CORS 预检请求不带 Authorization header，受保护的 API 会 401。

**应用到 E4**: `image-import.ts` 调用 `/api/chat` 需要确保 auth token 在 sessionStorage 中可用。Bearer token 方式正确，但需验证 `/api/chat` 对非登录用户的响应。

---

## 6. 结论与建议

### 评审结论: Conditional

**E1**: 状态管理逻辑正确，但 UI 入口缺失。建议补 FlowTreePanel「添加连线」按钮，或明确将 React Flow 内置的拖拽连接作为替代方案。

**E2/E3/E4**: 功能实现完整，测试 71/71 PASS。建议：
1. E2: 补充 Navigation Tab + Responsive Tab 的 store 层单元测试
2. E4: 补充 `importFromImage` mock 测试（AI 返回结构解析）
3. E4: fetch 添加显式 timeout: `signal: AbortSignal.timeout(30000)`

### 建议执行顺序

1. **立即**: 补 E1 FlowTreePanel「添加连线」按钮 UI（或文档说明使用 React Flow 拖拽替代）
2. **高优先级**: 补充 E2/E4 无交互测试的方法（单元测试层）
3. **中优先级**: E4 fetch 添加显式 timeout
4. **后续 Sprint**: E4 服务层完整集成测试

---

## 7. 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | 有条件通过 |
| **执行项目** | vibex-sprint3-prototype-extend-qa |
| **执行日期** | 2026-04-18 |
| **遗留项** | E1 UI 缺失（需补或文档说明替代方案）；E2/E4 测试覆盖缺口 |

---

## 附录: 关键代码位置

| 文件 | 行 | 内容 |
|------|----|------|
| `prototypeStore.ts` | 105-106 | `addEdge`/`removeEdge` 方法签名 |
| `prototypeStore.ts` | 225-248 | `addEdge`/`removeEdge` 实现 |
| `prototypeStore.ts` | 169 | `removeNode` 级联清除 edges |
| `prototypeStore.ts` | 253 | `updateNodeBreakpoints` |
| `prototypeStore.ts` | 263 | `updateNodeNavigation` |
| `ProtoFlowCanvas.tsx` | 131 | `onNodeDoubleClick` |
| `ProtoFlowCanvas.tsx` | 104-105 | `onConnect` → `addEdge` |
| `ProtoFlowCanvas.tsx` | 139-141 | breakpoint width |
| `ProtoEditor.tsx` | 236-266 | 设备切换按钮 |
| `image-import.ts` | 58 | `importFromImage` + fetch `/api/chat` |
| `image-import.ts` | 35 | 10MB 文件大小校验 |
