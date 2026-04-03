# PRD: vibex-flowtree-step-overflow

> **文档版本**: v1.0
> **创建时间**: 2026-03-29
> **项目目标**: 修复流程树展开子节点虚线框高度锁定问题
> **项目状态**: 已修复（dev 违规旁路，commit 510ed216），需补录流程产物

---

## 1. 问题背景

### 1.1 业务场景
用户在 Vibex 画布页展开业务流程卡片（FlowCard）时，内部的步骤列表（StepsList）被固定高度裁剪，只能显示约 2 张步骤卡片，即使实际有更多步骤。

### 1.2 根因分析

| 组件 | CSS 属性 | 影响 |
|------|---------|------|
| `.flowCard` | `overflow: hidden` | 虚线框容器截断所有溢出内容 |
| `.stepsList` | `max-height: 300px; overflow-y: auto` | 步骤列表最大高度 300px，超出部分隐藏 |

**计算**：每个 `SortableStepRow` ≈ 50-70px，300px ÷ 140px ≈ **2 个步骤卡片**，与问题描述吻合。

**代码位置**：`vibex-fronted/src/components/canvas/canvas.module.css`

### 1.3 进程违规说明

⚠️ **警告**：此问题已被 dev agent 直接提交（commit `510ed216`），**跳过了 analyst → pm → architect → coord-decision 完整流程**，违反了 AGENTS.md 阶段一约束。本 PRD 为补录流程产物，不影响已实施的修复。

---

## 2. Epic 定义

### Epic 1: 流程树步骤列表高度自适应

**问题类型**: Bug（P1）
**影响范围**: Canvas 画布页 → 业务流程树 → FlowCard 展开
**严重程度**: P1（功能可用性受损）

**目标**: 移除 FlowCard 和 StepsList 的 CSS 高度约束，使虚线框高度随步骤数量自动扩展。

---

## 3. 功能点分解

### F1: FlowCard 高度自适应

| 属性 | 值 |
|------|-----|
| **功能 ID** | F1 |
| **功能点** | FlowCard 虚线框高度自适应 |
| **描述** | 移除 `.flowCard` 的 `overflow: hidden` 约束，使虚线框容器可随内容扩展高度 |
| **文件** | `vibex-fronted/src/components/canvas/canvas.module.css` |
| **修改类型** | CSS 删除 |

#### 验收标准

| ID | 验收条件 | 验证方式 | 测试断言 |
|----|---------|---------|---------|
| AC-1.1 | `.flowCard` 不含 `overflow: hidden` | `git diff` 验证 | `expect(styles).not.toContain('overflow: hidden')` |
| AC-1.2 | FlowCard 展开后，虚线框高度随步骤数量自动扩展，无固定高度限制 | gstack browse 截图验证 | 截图对比修复前后 |
| AC-1.3 | 面板整体布局不受影响（无溢出或错位） | gstack browse 截图验证 | 截图验证 |

---

### F2: StepsList 内容完整展示

| 属性 | 值 |
|------|-----|
| **功能 ID** | F2 |
| **功能点** | StepsList 移除 max-height 约束 |
| **描述** | 移除 `.stepsList` 的 `max-height: 300px` 和 `overflow-y: auto`，使所有步骤卡片完整展示 |
| **文件** | `vibex-fronted/src/components/canvas/canvas.module.css` |
| **修改类型** | CSS 删除 |

#### 验收标准

| ID | 验收条件 | 验证方式 | 测试断言 |
|----|---------|---------|---------|
| AC-2.1 | `.stepsList` 不含 `max-height: 300px` | `git diff` 验证 | `expect(styles).not.toContain('max-height: 300px')` |
| AC-2.2 | FlowCard 展开时，所有步骤卡片完整显示，无裁剪、无滚动条 | gstack browse 截图验证 | 截图验证 |
| AC-2.3 | 含 3+ 步骤的流程卡展开后完整可见 | gstack browse + 手动验证 | 截图验证 |

---

### F3: 回归测试覆盖

| 属性 | 值 |
|------|-----|
| **功能 ID** | F3 |
| **功能点** | Canvas 组件回归测试 |
| **描述** | 确保修复后 Canvas 组件整体测试通过，无 CSS 副作用 |

#### 验收标准

| ID | 验收条件 | 验证方式 | 测试断言 |
|----|---------|---------|---------|
| AC-3.1 | `npm test -- --testPathPattern="canvas"` 全部通过 | exec `npm test` | exit code = 0 |
| AC-3.2 | 修复前后的 `git diff` 仅包含 3 行 CSS 删除 | exec `git diff` | diff stat 验证 |

---

## 4. 验收标准汇总

| ID | 验收条件 | 验证方式 | 状态 |
|----|---------|---------|------|
| AC-1.1 | `.flowCard` 不含 `overflow: hidden` | git diff | ✅ 已实施 |
| AC-1.2 | FlowCard 高度随内容自动扩展 | gstack browse | ✅ 已实施 |
| AC-1.3 | 面板整体布局不受影响 | gstack browse | ✅ 已实施 |
| AC-2.1 | `.stepsList` 不含 `max-height: 300px` | git diff | ✅ 已实施 |
| AC-2.2 | 所有步骤卡片完整展示 | gstack browse | ✅ 已实施 |
| AC-2.3 | 含 3+ 步骤的流程卡完整可见 | gstack browse | ✅ 已实施 |
| AC-3.1 | npm test 通过 | exec npm test | 待验证 |
| AC-3.2 | git diff 仅 3 行变更 | git diff stat | ✅ 已实施 |

---

## 5. 技术方案

### 5.1 修改清单

| 文件 | 修改类型 | 行数 |
|------|---------|------|
| `vibex-fronted/src/components/canvas/canvas.module.css` | 删除 3 行 CSS | -3 |

**修改内容**：
1. `.flowCard` → 删除 `overflow: hidden`
2. `.stepsList` → 删除 `max-height: 300px;`
3. `.stepsList` → 删除 `overflow-y: auto;`

### 5.2 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 移除 `overflow: hidden` 导致布局溢出 | 🟡 低 | 验证面板整体布局不受影响 |
| 步骤数量过多导致卡片过长 | 🟡 低 | 后续可加虚拟滚动（本次不实施） |

---

## 6. Definition of Done

### DoD for Epic 1

- [x] 问题分析完成（analysis.md ✅）
- [x] PRD 创建完成（prd.md ✅）
- [x] 架构设计完成（无需架构，CSS bug 修复）
- [x] 代码修改完成（commit `510ed216` ✅）
- [ ] npm test 通过（待验证）
- [ ] gstack browse 截图验证（待验证）
- [ ] Reviewer 审查通过

### DoD for 功能点 F1

- [x] 代码修改完成
- [x] git diff 验证（仅删除了 `overflow: hidden`）
- [ ] gstack browse 截图验证 FlowCard 高度自适应

### DoD for 功能点 F2

- [x] 代码修改完成
- [x] git diff 验证（仅删除了 `max-height` 和 `overflow-y`）
- [ ] gstack browse 截图验证所有步骤卡片完整展示

### DoD for 功能点 F3

- [ ] npm test 通过
- [ ] git diff stat 验证仅 3 行变更

---

## 7. 后续行动

| 行动 | 负责 | 状态 |
|------|------|------|
| Reviewer 审查 commit `510ed216` | reviewer | ⏳ |
| npm test 验证 | tester | ⏳ |
| gstack browse 截图验证 | tester | ⏳ |
| coord-decision 确认 | coord | ⏳ |

---

## 8. 变更历史

| 版本 | 日期 | 修改内容 |
|------|------|---------|
| v1.0 | 2026-03-29 | 初稿，补录流程产物 |
