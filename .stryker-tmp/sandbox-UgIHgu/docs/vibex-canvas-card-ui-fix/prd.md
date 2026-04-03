# PRD: Canvas 卡片 UI 修复

**项目**: vibex-canvas-card-ui-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
Canvas 三树组件（BoundedContextTree / BusinessFlowTree / ComponentTree）存在 4 个 UX 问题：
1. nodeTypeBadge 多余（type 信息已通过颜色表达）
2. checkbox 不与标题同行（ComponentTree 布局错误）
3. confirmedBadge 多余（BoundedContextTree border 颜色已表示确认）
4. checkbox 不是 toggle（confirmContextNode 无反向操作）

### 目标
统一三树 checkbox 行为，删除冗余视觉元素，提升卡片信息密度。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| checkbox 同行率 | 1/3 树 | 3/3 树 ✅ |
| nodeTypeBadge 数量 | 每个节点 | 0 |
| confirmedBadge 数量 | BoundedContextTree | 0 |
| toggle 行为 | 确认单向 | 双向 toggle |

---

## Epic 拆分

### Epic 1: BoundedContextTree 卡片修复
**工时**: 1h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 合并双 checkbox 为 1 个 toggle | 0.5h | expect(toggleWorks).toBe(true) |
| E1-S2 | 删除 nodeTypeBadge | 0.25h | expect(nodeTypeBadgeCount).toBe(0) |
| E1-S3 | 删除 confirmedBadge | 0.25h | expect(confirmedBadgeCount).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 单 checkbox | 只有 1 个 checkbox | expect(checkboxCount).toBe(1) | ✅ |
| F1.2 | toggle 行为 | 点击切换 checked 状态 | expect(toggleWorks).toBe(true) | ✅ |
| F1.3 | 无 nodeTypeBadge | type 通过 border 颜色表达 | expect(nodeTypeBadgeCount).toBe(0) | ✅ |
| F1.4 | 无 confirmedBadge | 确认通过 border 颜色表达 | expect(confirmedBadgeCount).toBe(0) | ✅ |

---

### Epic 2: ComponentTree checkbox 位置修正
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | checkbox 前移到标题前 | 0.25h | expect(checkboxInlineBeforeTitle).toBe(true) |
| E2-S2 | 删除 nodeTypeBadge | 0.25h | expect(nodeTypeBadgeCount).toBe(0) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | checkbox 同行 | checkbox 在标题同一行 | expect(checkboxInline).toBe(true) | ✅ |
| F2.2 | 无 nodeTypeBadge | type 通过 border 颜色表达 | expect(nodeTypeBadgeCount).toBe(0) | ✅ |

---

### Epic 3: BusinessFlowTree 保持现状
**工时**: 0h | **优先级**: N/A

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 保持现状 | checkbox 在 header 内 inline | N/A（已正确）|

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 现状保持 | 无需修改 | 已正确 | ✅ |

---

### Epic 4: CSS 清理
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 清理废弃样式 | 删除 .nodeTypeBadge / .confirmedBadge | expect(deadCSSRemoved).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 无废弃 CSS | .nodeTypeBadge / .confirmedBadge 已删除 | expect(cssCleanup).toBe(true) | ❌ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | BoundedContextTree 卡片修复 | 1h | P0 |
| E2 | ComponentTree checkbox 位置修正 | 0.5h | P0 |
| E3 | BusinessFlowTree 保持现状 | 0h | N/A |
| E4 | CSS 清理 | 0.5h | P0 |
| **总计** | | **2h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**:
- E1: BoundedContextTree 修复（1h）
- E2: ComponentTree 修正（0.5h）
- E4: CSS 清理（0.5h）

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 删除 nodeTypeBadge 后 type 信息丢失 | 低 | 低 | type 通过 border 颜色仍可区分 |
| 修改 checkbox 影响多选功能 | 中 | 中 | 保留 Ctrl+Click 多选机制 |
| 合并 checkbox 影响 confirmContextNode | 低 | 低 | 先在小范围验证 |

---

## DoD (Definition of Done)

### Epic 1: BoundedContextTree 卡片修复
- [ ] 只有 1 个 checkbox
- [ ] checkbox 点击切换 checked 状态（toggle）
- [ ] 无 nodeTypeBadge
- [ ] 无 confirmedBadge
- [ ] type 通过 border 颜色表达（confirmed=绿/unconfirmed=黄）

### Epic 2: ComponentTree checkbox 位置修正
- [ ] checkbox 在标题同一行（inline）
- [ ] 无 nodeTypeBadge
- [ ] checkbox 在 header 内，标题前

### Epic 3: BusinessFlowTree 保持现状
- [ ] 无需修改（已正确）

### Epic 4: CSS 清理
- [ ] .nodeTypeBadge / .confirmedBadge / .selectionCheckbox 样式已删除或标记废弃

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 渲染 BoundedContextTree | 节点 | 只有 1 个 checkbox |
| AC1.2 | 点击 BoundedContextTree checkbox | toggle | checked 状态切换 |
| AC1.3 | 检查 BoundedContextTree | nodeTypeBadge | = 0 |
| AC1.4 | 检查 BoundedContextTree | confirmedBadge | = 0 |
| AC2.1 | 渲染 ComponentTree | 节点 | checkbox 在标题前，inline |
| AC2.2 | 检查 ComponentTree | nodeTypeBadge | = 0 |
| AC4.1 | CSS 文件搜索 | .nodeTypeBadge | = 0 或 @deprecated |
