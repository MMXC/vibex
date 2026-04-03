# PRD: Canvas 三树统一 — 2026-03-31

> **任务**: canvas-three-tree-unification/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/canvas-three-tree-unification/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/canvas-three-tree-unification/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas 当前存在 phase 状态机强制约束、confirmed 门控冗余、cascade 自动重置下游三大问题，用户无法自由操作三棵树 |
| **目标** | 废除 phase 约束 → 自由导航；用 isActive 替代 confirmed → 清晰语义；cascade 改为手动触发 → 数据不丢失；三树 Tab 快速切换 |
| **成功指标** | 无 phase 约束；三树可同时操作；编辑 context 不重置下游；isActive 替代 confirmed |

### 7 项核心设计原则（约束）

| ID | 原则 | 含义 |
|----|------|------|
| PRIN-1 | 无 phase 约束 | 废除 phase 状态机，用户可自由导航 |
| PRIN-2 | 单一数据源 | AI生成/用户编辑/模板套用，作用在同一份数据 |
| PRIN-3 | 画布即渲染层 | 画布只负责渲染，不知道业务规则 |
| PRIN-4 | 无 confirmed 状态 | 节点三态：isActive=true/false/isDeleted=true |
| PRIN-5 | 下游联动手动触发 | 删除/编辑 context 不自动重置下游树 |
| PRIN-6 | 单一 JSON 导出/导入 | 一份 JSON 包含所有三棵树，URL 即分享链接 |
| PRIN-7 | URL 长度安全 | <2KB 直接编码，>2KB LZ-String，>4KB 文件下载兜底 |

### 与 canvas-data-model-unification 的关系

本项目与 `canvas-data-model-unification` 高度重叠。本 PRD **聚焦 Phase 1**（三树 UI + 联动重构），数据统一部分（Phase 2）沿用 `canvas-data-model-unification` 的方案。

---

## 2. Epic 拆分

### Epic 1: Tab 切换器 + 废除 phase 约束（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 新增 Tab 切换栏（context/flow/component 三个 Tab） | 1h | `expect(tabBar).toBeInTheDocument(); expect(tabs).toHaveLength(3);` |
| S1.2 | Tab 切换时三树数据全部保留（不卸载） | 0.5h | `expect(contextNodes).toBeRetainedOnTabSwitch(); expect(flowNodes).toBeRetainedOnTabSwitch();` |
| S1.3 | 移除 phase 对树操作的约束（任意阶段可新增/编辑/删除任意树） | 1h | `expect(canAddContextInFlowPhase).toBe(true); expect(canEditComponentInContextPhase).toBe(true);` |
| S1.4 | 移除 phase 状态机门控（`areAllConfirmed` 等） | 0.5h | `expect(phaseGate).toBeRemoved();` |
| S1.5 | gstack screenshot 验证 Tab 切换流畅 | 0.25h | `expect(screenshot).toShowAllThreeTreesData();` |

**DoD**: Tab 可切换，三树数据同时存在，任意阶段可操作任意树

---

### Epic 2: 面板折叠与 phase 解耦（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 面板折叠状态独立存储（不依赖 phase） | 0.5h | `expect(panelCollapseState).toBeIndependentOfPhase();` |
| S2.2 | 切换 phase 后折叠状态保留 | 0.5h | `expect(collapseStateAfterPhaseChange).toBe(collapseStateBefore);` |
| S2.3 | 可同时展开多个面板 | 0.25h | `expect(multiplePanelsExpanded).toBe(true);` |

**DoD**: 面板折叠与 phase 完全解耦，折叠状态跨 phase 保持

---

### Epic 3: 移除 confirmed，替换为 isActive（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 移除 `node.confirmed` 字段 | 0.5h | `expect(node.confirmed).toBeUndefined();` |
| S3.2 | 新增 `node.isActive: boolean`（勾选参与生成 / 不勾选不参与） | 0.5h | `expect(node.isActive).toBeDefined(); expect(node.isActive).toBe(true);` |
| S3.3 | 移除 `confirmNode/confirmAll` 等方法 | 0.5h | `expect(confirmNode).toBeUndefined(); expect(confirmAll).toBeUndefined();` |
| S3.4 | 生成函数只使用 isActive=true 的节点参与 | 0.5h | `expect(generateFlows).toUseOnlyActiveNodes();` |
| S3.5 | 验收：勾选2个context → 生成flow → 只有2个flow节点 | 0.5h | `expect(activeContexts.length).toBe(2); expect(generatedFlowNodes.length).toBe(2);` |

**DoD**: confirmed 完全移除，isActive 语义清晰，生成只使用 isActive=true 节点

---

### Epic 4: Cascade 改为手动触发（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 移除 `cascadeContextChange` 自动重置逻辑 | 0.5h | `expect(cascadeContextChange).toBeUndefined();` |
| S4.2 | 新增手动触发函数：`generateFlowFromContext(contextNodes)` | 1h | `expect(generateFlowFromContext).toBeDefined();` |
| S4.3 | 新增手动触发函数：`generateComponentFromFlow(flowNodes)` | 1h | `expect(generateComponentFromFlow).toBeDefined();` |
| S4.4 | 编辑 context 节点后，flow 和 component 树不受影响 | 0.5h | `expect(flowNodesAfterContextEdit).toEqual(flowNodesBefore);` |
| S4.5 | 删除 context 节点后，下游树数据保留 | 0.5h | `expect(flowNodesAfterDelete).toBeRetained();` |
| S4.6 | 验收：编辑 context 后下游树不变 | 0.5h | `expect(flowTreeAfterContextEdit).toMatch(flowTreeBeforeEdit);` |

**DoD**: 编辑/删除 context 不自动重置下游，用户手动点击生成才覆盖下游

---

### Epic 5: Tab + 面板 UI 重构（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | Tab bar 在 ProjectBar 下方，固定位置 | 0.25h | `expect(tabBarFixedBelowProjectBar).toBe(true);` |
| S5.2 | 当前 Tab 高亮显示 | 0.25h | `expect(activeTab).toHaveStyle({ fontWeight: 'bold' });` |
| S5.3 | 面板展开/折叠按钮在 Tab bar 内 | 0.25h | `expect(collapseButtonsInTabBar).toBe(true);` |
| S5.4 | Tab 切换有平滑动画（200ms） | 0.25h | `expect(tabSwitchAnimation).toBe(200);` |

**DoD**: Tab bar 固定可见，切换流畅

---

### Epic 6: 回归测试（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S6.1 | gstack screenshot 验证三树 Tab 切换正常 | 0.5h | `expect(screenshot).toShowAllTrees();` |
| S6.2 | 验证 isActive=false 节点不参与生成 | 0.5h | `expect(inactiveNodesExcludedFromGeneration).toBe(true);` |
| S6.3 | 验证手动触发 generateFlowFromContext 覆盖 flow 树 | 0.5h | `expect(generateFlowFromContext).toOverrideFlowTree();` |
| S6.4 | 验证删除节点下游树保留 | 0.5h | `expect(downstreamRetainedOnDelete).toBe(true);` |
| S6.5 | npm build + TypeScript 0 errors | 0.5h | `expect(build.exitCode).toBe(0);` |

**DoD**: 所有回归通过，build 通过

---

## 3. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | Tab bar 存在且 3 个 Tab | `expect(getAllByRole('tab')).toHaveLength(3);` |
| AC-2 | 任意 phase 可操作任意树 | `expect(noPhaseGateOnTreeOperation).toBe(true);` |
| AC-3 | 编辑 context 后下游树不变 | `expect(flowNodesAfterContextEdit).toEqual(flowNodesBefore);` |
| AC-4 | 删除 context 后下游数据保留 | `expect(flowAndComponentRetainedAfterDelete).toBe(true);` |
| AC-5 | isActive=true 节点参与生成，false 不参与 | `expect(inactiveNodes).not.toBeIncludedIn(generationRequest);` |
| AC-6 | Tab 切换时三树数据保留 | `expect(allTreeDataRetainedOnTabSwitch).toBe(true);` |
| AC-7 | confirmed 字段完全移除 | `expect(search('confirmed')).toHaveLength(0);` |
| AC-8 | cascadeContextChange 自动重置已移除 | `expect(search('cascadeContextChange')).toHaveLength(0);` |
| AC-9 | npm build 通过 | `expect(exec('npm run build').exitCode).toBe(0);` |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | Tab 切换 < 50ms，无主线程阻塞 |
| **兼容性** | localStorage 旧数据 migration（confirmed → isActive） |
| **向后兼容** | Phase 2（数据统一）基于本 Phase 结果继续 |

---

## 5. 实施计划

| Epic | Story | 工时 | Sprint |
|------|-------|------|--------|
| Epic 1 | S1.1-S1.5 Tab + 废除 phase 约束 | 3.25h | Sprint 0 |
| Epic 2 | S2.1-S2.3 面板折叠解耦 | 1.25h | Sprint 0 |
| Epic 3 | S3.1-S3.5 confirmed → isActive | 2.5h | Sprint 0 |
| Epic 4 | S4.1-S4.6 Cascade 手动触发 | 3.5h | Sprint 0 |
| Epic 5 | S5.1-S5.4 Tab + 面板 UI | 1h | Sprint 0 |
| Epic 6 | S6.1-S6.5 回归测试 | 2.5h | Sprint 0 |

**Phase 1 总工时**: ~14h

---

## 6. DoD（完成定义）

### 功能点 DoD
1. 代码实现完成
2. 每个 Story 验收标准通过
3. `npm run build` 通过，TypeScript 0 errors
4. gstack screenshot 验证 UI

### Epic DoD
- **Epic 1**: Tab 切换流畅，三树数据同时存在，任意阶段可操作任意树
- **Epic 2**: 面板折叠与 phase 完全解耦
- **Epic 3**: confirmed 移除，isActive 语义清晰，生成只使用 isActive=true
- **Epic 4**: 编辑/删除 context 不重置下游，手动触发才覆盖
- **Epic 5**: Tab bar 固定可见，切换 200ms 动画
- **Epic 6**: 所有回归通过，build 通过

---

## 7. Phase 2（未来工作，沿用 canvas-data-model-unification）

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 7 | 单一 JSON 导出/导入 + URL 分享 | 9h |
| Epic 8 | 消除 confirmationStore 重复类型 | 2h |
| Epic 9 | historyMiddleware + messageMiddleware | 5h |
| Epic 10 | 回归测试 | 4h |

**Phase 2 总工时**: ~20h
