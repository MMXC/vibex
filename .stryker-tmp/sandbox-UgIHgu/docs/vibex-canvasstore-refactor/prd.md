# PRD: VibeX canvasStore 职责拆分重构

**项目**: vibex-canvasstore-refactor
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
`canvasStore.ts` 当前 1433 行，将 17 个职责完全不同的领域塞进单个 Zustand store。调用点 250+ 处，依赖组件 30+ 个。

### 问题
- **维护成本高**: 修改节点 CRUD 需在 1433 行中导航
- **测试困难**: 无法对 context CRUD 单独测试
- **回归风险高**: 单 store 内跨 slice 隐性依赖多
- **团队协作冲突**: 多人同时改同一文件

### 目标
将 canvasStore 拆分为 5 个独立子 store，每个 <350 行，职责单一，可独立测试。

### 成功指标

| KPI | 当前 | Phase 5 目标 |
|-----|------|--------------|
| canvasStore 行数 | 1433 | ≤ 150 行 |
| 子 store 数量 | 0 | 5 个独立 store |
| 单个 store 最大行数 | 1433 | ≤ 350 行 |
| 测试覆盖率 | ~40% | ≥ 80%（每个 store）|
| 现有测试通过率 | 17/17 | 17/17（全程）|
| 回归 P0 bug | - | 0 |

---

## Epic 拆分

### Epic 1: Phase 1 — contextStore 独立
**工时**: 3 天（dev）+ 0.5 天（reviewer）| **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 创建 contextStore.ts 独立文件 | 1d | expect(fileExists('contextStore.ts')).toBe(true) |
| E1-S2 | 提取 contextNodes CRUD 到 contextStore | 0.5d | expect(contextStore.getState().contextNodes).toBeDefined() |
| E1-S3 | 编写 contextStore 单元测试（覆盖率 ≥80%）| 0.5d | expect(coverage).toBeGreaterThanOrEqual(80) |
| E1-S4 | canvasStore 保留向后兼容 re-export | 0.5d | expect(canvasStore.contextNodes).toBeDefined() |
| E1-S5 | 现有 17 个测试全部通过 | 0.5d | expect(testResults).toHaveLength(17) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | contextStore 独立文件 | src/lib/canvas/stores/contextStore.ts | fileExists && lines ≤ 180 | ❌ |
| F1.2 | CRUD 操作 | add/edit/delete/confirmContextNode | expect(addFn).toBeDefined() | ✅ |
| F1.3 | 测试覆盖 | contextStore.test.ts | coverage ≥ 80% | ❌ |
| F1.4 | 向后兼容 | canvasStore re-export | expect(canvasStore.contextNodes).toBeDefined() | ❌ |
| F1.5 | 现有测试通过 | 17 个 canvas 测试 | all 17 pass | ❌ |

---

### Epic 2: Phase 2 — uiStore 独立
**工时**: 4 天（dev）+ 0.5 天（reviewer）| **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 创建 uiStore.ts 独立文件 | 1d | expect(fileExists('uiStore.ts')).toBe(true) |
| E2-S2 | 提取 UI slice（panels/drawers/selection/drag）| 1.5d | expect(uiStore.getState().panelCollapsed).toBeDefined() |
| E2-S3 | 更新 20 个订阅组件 | 1d | expect(componentRenders).toBe(true) |
| E2-S4 | 编写 uiStore 单元测试（覆盖率 ≥80%）| 0.5d | expect(coverage).toBeGreaterThanOrEqual(80) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | uiStore 独立文件 | src/lib/canvas/stores/uiStore.ts | fileExists && lines ≤ 280 | ❌ |
| F2.2 | UI 状态操作 | panelCollapsed/drawer/expand/drag | expect(setPanelCollapsed).toBeDefined() | ✅ |
| F2.3 | 组件更新 | ProjectBar/TreePanel/CardTreeRenderer 等 ~20 个 | all render without error | ✅ |
| F2.4 | 测试覆盖 | uiStore.test.ts | coverage ≥ 80% | ❌ |

---

### Epic 3: Phase 3 — flowStore 独立
**工时**: 4 天（dev）+ 1 天（reviewer）| **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 创建 flowStore.ts 独立文件 | 1d | expect(fileExists('flowStore.ts')).toBe(true) |
| E3-S2 | 提取 flowNodes CRUD + steps + autoGenerate | 1.5d | expect(flowStore.getState().flowNodes).toBeDefined() |
| E3-S3 | CascadeUpdateManager 迁移到 flowStore | 0.5d | expect(cascadeUpdate).toBeDefined() |
| E3-S4 | 编写 flowStore 单元测试（覆盖率 ≥80%）| 0.5d | expect(coverage).toBeGreaterThanOrEqual(80) |
| E3-S5 | E2E 级联验证 | 0.5d | expect(contextChangeFlowsToPending).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | flowStore 独立文件 | src/lib/canvas/stores/flowStore.ts | fileExists && lines ≤ 350 | ❌ |
| F3.2 | CRUD + steps | add/edit/delete/confirmFlowNode + steps | expect(addFlowNode).toBeDefined() | ✅ |
| F3.3 | 级联更新 | context → flow pending 触发 | expect(cascadeUpdate).toBeDefined() | ✅ |
| F3.4 | 测试覆盖 | flowStore.test.ts | coverage ≥ 80% | ❌ |

---

### Epic 4: Phase 4 — componentStore 独立
**工时**: 3 天（dev）+ 0.5 天（reviewer）| **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 创建 componentStore.ts 独立文件 | 0.5d | expect(fileExists('componentStore.ts')).toBe(true) |
| E4-S2 | 提取 componentNodes CRUD + generate | 1.5d | expect(componentStore.getState().componentNodes).toBeDefined() |
| E4-S3 | 依赖 flowStore（单向）| 0.5d | expect(flowNodes).toBeDefined() |
| E4-S4 | 编写 componentStore 测试（覆盖率 ≥80%）| 0.5d | expect(coverage).toBeGreaterThanOrEqual(80) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | componentStore 独立文件 | src/lib/canvas/stores/componentStore.ts | fileExists && lines ≤ 180 | ❌ |
| F4.2 | CRUD + generate | add/edit/delete/confirmComponentNode + generate | expect(generateComponent).toBeDefined() | ✅ |
| F4.3 | 单向依赖 flowStore | flowNodes 读取 | expect(flowNodes).toBeDefined() | ❌ |
| F4.4 | 测试覆盖 | componentStore.test.ts | coverage ≥ 80% | ❌ |

---

### Epic 5: Phase 5 — sessionStore + 清理
**工时**: 2 天（dev）+ 0.5 天（reviewer）| **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E5-S1 | 创建 sessionStore.ts 独立文件 | 0.5d | expect(fileExists('sessionStore.ts')).toBe(true) |
| E5-S2 | 提取 SSE/AI thinking/queue/messages | 0.5d | expect(sseStatus).toBeDefined() |
| E5-S3 | 创建 stores/index.ts 统一导出 | 0.25d | expect(exportsAllFive).toBe(true) |
| E5-S4 | canvasStore 压缩至 ≤150 行 | 0.5d | expect(canvasStoreLines).toBeLessThanOrEqual(150) |
| E5-S5 | localStorage 迁移验证 | 0.25d | expect(storageMigrate).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | sessionStore 独立文件 | src/lib/canvas/stores/sessionStore.ts | fileExists && lines ≤ 150 | ❌ |
| F5.2 | SSE/AI 状态 | sseStatus/aiThinking/queue | expect(sseStatus).toBeDefined() | ✅ |
| F5.3 | stores/index.ts | 统一导出 5 个 store | expect(exportsAllFive).toBe(true) | ❌ |
| F5.4 | canvasStore ≤150 行 | 移除所有 re-export | expect(lines).toBeLessThanOrEqual(150) | ❌ |
| F5.5 | localStorage 迁移 | 清除缓存后数据恢复 | expect(noDataLoss).toBe(true) | ✅ |

---

## 工时汇总

| Epic | Phase | 工时 | 优先级 |
|------|-------|------|--------|
| E1 | Phase 1: contextStore | 3.5 天 | P0 |
| E2 | Phase 2: uiStore | 4.5 天 | P0 |
| E3 | Phase 3: flowStore | 5 天 | P0 |
| E4 | Phase 4: componentStore | 3.5 天 | P1 |
| E5 | Phase 5: sessionStore + 清理 | 2.75 天 | P1 |
| **总计** | | **19.25 天** | |

---

## 优先级矩阵

| 优先级 | Epic | 工时 |
|--------|------|------|
| P0 | E1, E2, E3 | 13 天 |
| P1 | E4, E5 | 6.25 天 |

---

## Sprint 排期建议

**Sprint 1 (1 周)**: Phase 1 contextStore（3.5 天 dev + 0.5 天 review）

**Sprint 2 (1 周)**: Phase 2 uiStore（4 天 dev + 0.5 天 review）

**Sprint 3 (1 周)**: Phase 3 flowStore（4 天 dev + 1 天 review）

**Sprint 4 (1 周)**: Phase 4 componentStore（3 天 dev + 0.5 天 review）

**Sprint 5 (0.5 周)**: Phase 5 sessionStore + 清理（2 天 dev + 0.5 天 review）

---

## 关键依赖链

```
E1 (contextStore) → 无依赖
    ↓
E2 (uiStore) → 依赖 E1（无隐式依赖，可并行）
    ↓
E3 (flowStore) → 依赖 E1（读取 confirmContextNode 状态）
    ↓
E4 (componentStore) → 依赖 E2 + E3（flowNodes + contextNodes）
    ↓
E5 (sessionStore) → 无领域依赖，最后执行
```

**单向依赖规则**: contextStore → flowStore → componentStore，uiStore 和 sessionStore 独立。

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 250+ 调用点迁移遗漏 | 高 | 高 | 向后兼容 re-export；codemod 批量替换 |
| recomputeActiveTree 失效 | 高 | 高 | 保留在根 store；Phase 3 单独处理 |
| localStorage 迁移数据丢失 | 中 | 高 | 每个 phase 添加 migration handler |
| 循环依赖（flow ↔ component）| 中 | 高 | 单向依赖约定，禁止反向 |
| 现有测试回归 | 中 | 中 | 每个 phase 完成后跑 17 个测试 |

---

## DoD (Definition of Done)

### Epic 1: contextStore 独立
- [ ] `contextStore.ts` 存在且 ≤ 180 行
- [ ] CRUD 操作（add/edit/delete/confirmContextNode）全部工作
- [ ] `contextStore.test.ts` 覆盖率 ≥ 80%
- [ ] `canvasStore.ts` 保留所有 context re-export
- [ ] 17 个现有测试全部通过

### Epic 2: uiStore 独立
- [ ] `uiStore.ts` 存在且 ≤ 280 行
- [ ] panel/drawer/selection/drag 操作全部工作
- [ ] ~20 个组件（ProjectBar/TreePanel/CardTreeRenderer 等）更新后渲染正常
- [ ] `uiStore.test.ts` 覆盖率 ≥ 80%

### Epic 3: flowStore 独立
- [ ] `flowStore.ts` 存在且 ≤ 350 行
- [ ] CRUD + steps + autoGenerate 全部工作
- [ ] CascadeUpdateManager 迁移到 flowStore
- [ ] context 变更触发 flow pending 级联正常
- [ ] `flowStore.test.ts` 覆盖率 ≥ 80%

### Epic 4: componentStore 独立
- [ ] `componentStore.ts` 存在且 ≤ 180 行
- [ ] CRUD + generate 全部工作
- [ ] 单向依赖 flowStore，无循环
- [ ] `componentStore.test.ts` 覆盖率 ≥ 80%

### Epic 5: sessionStore + 清理
- [ ] `sessionStore.ts` 存在且 ≤ 150 行
- [ ] SSE/AI thinking/queue/messages 状态正常
- [ ] `stores/index.ts` 导出全部 5 个 store
- [ ] `canvasStore.ts` ≤ 150 行
- [ ] localStorage 迁移无数据丢失

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 检查文件 | contextStore.ts | 存在 && ≤ 180 行 |
| AC1.2 | 运行测试 | contextStore.test.ts | coverage ≥ 80% |
| AC1.3 | 运行测试 | canvas/ 所有测试 | 17/17 通过 |
| AC2.1 | 检查文件 | uiStore.ts | 存在 && ≤ 280 行 |
| AC2.2 | 渲染组件 | TreePanel + CardTreeRenderer | 无 error |
| AC3.1 | 检查文件 | flowStore.ts | 存在 && ≤ 350 行 |
| AC3.2 | E2E 测试 | context → flow 级联 | pending 触发正常 |
| AC4.1 | 检查文件 | componentStore.ts | 存在 && ≤ 180 行 |
| AC5.1 | 检查文件 | sessionStore.ts | 存在 && ≤ 150 行 |
| AC5.2 | 检查文件 | canvasStore.ts | ≤ 150 行 |
| AC5.3 | 清除 localStorage | 刷新页面 | 数据完整恢复 |
