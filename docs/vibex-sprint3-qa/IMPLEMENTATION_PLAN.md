# Implementation Plan — vibex-sprint3-qa / design-architecture

**项目**: vibex-sprint3-qa
**角色**: Architect（实施计划）
**日期**: 2026-04-25
**上游**: architecture.md
**状态**: ✅ 设计完成

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 页面跳转连线 | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |
| E2: 组件属性面板 | E2-U1 ~ E2-U2 | 0/2 | E2-U1 |
| E3: 响应式断点预览 | E3-U1 ~ E3-U2 | 0/2 | E3-U1 |
| E4: AI 草图导入 | E4-U1 ~ E4-U2 | 0/2 | E4-U1 |
| E5: 质量保障 | E5-U1 ~ E5-U3 | 0/3 | E5-U1 |

---

## E1: 页面跳转连线

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | prototypeStore.edges CRUD 验证 | ⬜ | — | addEdge/removeEdge/selectEdge/cascadeDelete 全部通过 |
| E1-U2 | FlowTreePanel + ProtoFlowCanvas UI 四态验证 | ⬜ | E1-U1 | 理想态/空状态/加载态/错误态各有 expect() 断言；SVG edge 可见 |

### E1-U1 详细说明

**目标**: 验证 prototypeStore.edges CRUD + 级联清除行为。

**测试文件**: `tests/unit/stores/prototypeStore.test.ts`

**Test scenarios**:
- E1-AC1: `addEdge` 返回非空 id；edges 包含 source/target/type
- E1-AC2: `removeEdge` 清除指定 edge；`selectEdge` 选中态高亮
- E1-AC3: `removeNode` 级联清除 source/target 关联 edges
- Edge case: `addEdge` 相同 source-target 不重复创建

**Verification**: `pnpm vitest run tests/unit/stores/prototypeStore.test.ts` → 0 failures

---

### E1-U2 详细说明

**目标**: 验证 FlowTreePanel + ProtoFlowCanvas UI 四态。

**测试文件**: `tests/e2e/sprint3-qa/E1-flow-panel.spec.ts`

**Test scenarios**:
- Ideal state: 「添加连线」按钮 enabled；连线列表显示 edges；ProtoFlowCanvas SVG 连线可见
- Empty state: 「添加连线」按钮 disabled；空态文案「至少需要 2 个页面」
- Loading state: target 选择区 skeleton loader；按钮文案「加载页面列表...」
- Error state: 错误横幅「连线创建失败，请重试」；store.edges 保持不变

**Verification**: `pnpm playwright test tests/e2e/sprint3-qa/E1-flow-panel.spec.ts` → 0 failures

---

## E2: 组件属性面板

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | PropertyPanel 四 Tab 数据同步验证 | ⬜ | — | Data Tab 修改文字同步；Navigation Tab 生成 edge；Responsive Tab 更新 breakpoints |
| E2-U2 | PropertyPanel 四 Tab UI 四态验证 | ⬜ | E2-U1 | 理想态/空状态/加载态/错误态各有 expect() 断言 |

### E2-U1 详细说明

**目标**: 验证四 Tab 配置变更后 prototypeStore 节点实时同步。

**测试文件**: `tests/unit/stores/PropertyPanel.test.tsx`

**Test scenarios**:
- E2-AC1: 双击节点，PropertyPanel drawer 展开（Vitest mock）
- E2-AC2 Data Tab: 修改文字 `fireEvent.change` → `expect(node.data.component.label).toBe('提交')`
- E2-AC3 Navigation Tab: 设置跳转页面 → `expect(store.edges.some(e => e.target === 'page-2')).toBe(true)`
- E2-AC4 Responsive Tab: 设置断点规则 → `expect(node.data.breakpoints.mobile).toBe(true)`

**Verification**: `pnpm vitest run tests/unit/stores/PropertyPanel.test.tsx` → 0 failures

---

### E2-U2 详细说明

**目标**: 验证 PropertyPanel 四 Tab UI 四态。

**测试文件**: `tests/e2e/sprint3-qa/E2-property-panel.spec.ts`

**Test scenarios**:
- Ideal state: drawer 展开（320px）；节点 ID + 类型标签可见；四个 Tab 可切换
- Empty state: drawer 关闭或显示「无选中节点」占位
- Loading state: Tab 区域 skeleton loader；面板不可编辑
- Error state: 失败字段红色边框 + 错误提示文字；面板其他部分保持可交互

**Verification**: `pnpm playwright test tests/e2e/sprint3-qa/E2-property-panel.spec.ts` → 0 failures

---

## E3: 响应式断点预览

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | prototypeStore.breakpoint 状态验证 | ⬜ | — | setBreakpoint 更新状态；新节点自动标记断点可见性 |
| E3-U2 | ProtoEditor 工具栏设备切换 UI 四态验证 | ⬜ | E3-U1 | 三个设备按钮切换；画布宽度缩放；四态验证通过 |

### E3-U1 详细说明

**目标**: 验证 prototypeStore.breakpoint 状态切换 + 新节点自动标记。

**测试文件**: `tests/unit/stores/prototypeStore.test.ts`

**Test scenarios**:
- E3-AC1: `setBreakpoint('375')` 后 `store.breakpoint === '375'`
- E3-AC2: 断点切换后，`addNode` 新节点 `data.breakpoints.mobile === true`（其他 false）
- E3-AC3: `updateNodeBreakpointVisibility` 部分更新，保留其他字段

**Verification**: `pnpm vitest run tests/unit/stores/prototypeStore.test.ts` → 0 failures

---

### E3-U2 详细说明

**目标**: 验证 ProtoEditor 工具栏设备切换 UI 四态。

**测试文件**: `tests/e2e/sprint3-qa/E3-breakpoint-toolbar.spec.ts`

**Test scenarios**:
- Ideal state: 三个设备按钮可见；当前选中高亮（`aria-pressed="true"`）
- Empty state: 默认桌面按钮高亮，三个按钮均可点击
- Loading state: 按钮显示 spinner；容器宽度暂时保持
- Error state: 工具栏回退到上一有效状态；toast「断点切换失败，已回退」

**Verification**: `pnpm playwright test tests/e2e/sprint3-qa/E3-breakpoint-toolbar.spec.ts` → 0 failures

---

## E4: AI 草图导入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | AI Vision API MSW Mock 验证 | ⬜ | — | success/error/timeout 三场景覆盖 |
| E4-U2 | ImportPanel 图片拖拽上传 UI 四态验证 | ⬜ | E4-U1 | 理想态/空状态/加载态/错误态各有 expect() 断言 |

### E4-U1 详细说明

**目标**: 验证 AI Vision API MSW mock 响应处理。

**测试文件**: `tests/unit/services/imageRecognition.test.ts`

**Test scenarios**:
- E4-AC1: 文件选择器 `accept=".png,.jpg,.jpeg"`
- E4-AC2 success: MSW 返回识别结果 → 组件列表显示
- E4-AC2 loading: 上传后显示「正在识别组件」+ skeleton
- E4-AC2 error: MSW 返回 500 → 显示「识别失败，请重试」
- E4-AC3: 确认导入后 `store.nodes.length` 增加

**Verification**: `pnpm vitest run tests/unit/services/imageRecognition.test.ts` → 0 failures

---

### E4-U2 详细说明

**目标**: 验证 ImportPanel 图片拖拽上传 UI 四态。

**测试文件**: `tests/e2e/sprint3-qa/E4-import-panel.spec.ts`

**Test scenarios**:
- Ideal state: 拖拽上传区可见；支持 PNG/JPG/JPEG；预览缩略图 + 组件列表
- Empty state: 虚线边框 + 上传图标 + 「拖拽图片或点击上传」文字
- Loading state: 进度指示器（0-100%）+ 「正在识别组件...」；确认按钮 disabled
- Error state: 红色错误图标 + 「识别失败，请检查图片后重试」+ 重试按钮

**Verification**: `pnpm playwright test tests/e2e/sprint3-qa/E4-import-panel.spec.ts` → 0 failures

---

## E5: 质量保障

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | Specs 覆盖率验证 | ⬜ | — | E1-E4 每个 Spec 文件都有 ≥1 个 QA 验证点 |
| E5-U2 | DoD 逐条核查 | ⬜ | — | PRD DoD 全部条目逐条可测试 |
| E5-U3 | PRD 格式自检 | ⬜ | — | PRD 格式自检表全部通过 |

### E5-U1 详细说明

**目标**: 验证每个 Spec 文件至少有一个 QA 验证点覆盖。

**测试文件**: `tests/unit/docs/coverage-map.test.ts`

**Test scenarios**:
- E1 coverage: specs/E1-api-chapter.md 被 E1-U1 + E1-U2 覆盖
- E2 coverage: specs/E2-business-rules.md 被 E2-U1 + E2-U2 覆盖
- E3 coverage: specs/E3-cross-chapter.md 被 E3-U1 + E3-U2 覆盖
- E4 coverage: specs/E4-export.md 被 E4-U1 + E4-U2 覆盖

**Verification**: `pnpm vitest run tests/unit/docs/coverage-map.test.ts` → 0 failures

---

### E5-U2 详细说明

**目标**: 逐条验证 PRD DoD 全部条目可测试。

**测试文件**: `tests/unit/docs/dod-checklist.test.ts`

**Test scenarios**:
- 全局 DoD 5 条：ESLint 0 error / Vitest ≥3 tests per Epic / Specs 完整 / gstack browse / 无回归
- E1 DoD 5 条：连线按钮可见 / SVG edge / Delete 删除 / 级联清除 / ≥3 tests
- E2 DoD 6 条：四 Tab 切换 / Data 同步 / Navigation edge / Responsive breakpoints / ≥4 tests
- E3 DoD 5 条：设备按钮 / 画布宽度 / 状态同步 / 节点标记 / ≥3 tests
- E4 DoD 5 条：图片上传 / loading→结果 / 批量导入 / 错误提示 / ≥3 tests

**Verification**: `pnpm vitest run tests/unit/docs/dod-checklist.test.ts` → 0 failures

---

### E5-U3 详细说明

**目标**: 验证 PRD 包含所有必需章节。

**测试文件**: `tests/unit/docs/prd-format.test.ts`

**Test scenarios**:
- 执行摘要包含：背景 + 目标 + 成功指标
- Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- 每个 Story 有 expect() 断言
- DoD 章节存在且具体
- 关键页面有「用户情绪地图」

**Verification**: `pnpm exec tsc --noEmit && pnpm test` → 0 errors, all tests pass

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint3-qa
- **执行日期**: 2026-04-25
- **备注**: 总工时 10.5h。E1-U1 prototypeStore.edges 前置验证（P0），E4 AI Vision API 使用 MSW mock。Unit 执行顺序：E5-U1 → E1 → E2 → E3 → E4 → E5-U2/U3。

---

*计划时间: 2026-04-25 12:00 GMT+8*
