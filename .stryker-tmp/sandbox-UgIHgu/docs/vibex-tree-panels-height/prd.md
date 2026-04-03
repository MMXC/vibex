# PRD: Tree Panels Height Fix — 2026-03-31

> **任务**: vibex-tree-panels-height/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-tree-panels-height/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/vibex-tree-panels-height/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | `treePanelsGrid` 高度塌陷为 0，导致画布内容区域不可见 |
| **根因** | 父容器 flex 纵向布局中，grid 子项未设置 `flex: 1` + `min-height: 0` |
| **状态** | CSS 修复**已存在于代码中**，无需额外开发 |
| **目标** | 验证修复有效，三栏面板可见，拖拽和 expand-both 模式正常 |

---

## 2. Epic 拆分

### Epic 1: CSS 修复验证（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 验证 `.treePanelsGrid` 高度 > 0px | 0.25h | `expect(treePanelsGrid.getBoundingClientRect().height).toBeGreaterThan(0);` |
| S1.2 | 验证三栏面板（context/flow/component）均可见 | 0.25h | `expect(contextPanel).toBeVisible(); expect(flowPanel).toBeVisible(); expect(componentPanel).toBeVisible();` |
| S1.3 | 验证拖拽调整面板宽度正常 | 0.25h | `expect(dragToResize()).toChangeWidth();` |
| S1.4 | 验证 expand-both 模式正常（最大化） | 0.25h | `expect(expandBothMode).toShowAllPanels();` |
| S1.5 | gstack screenshot 截图验证 | 0.25h | `expect(screenshot).toShowVisiblePanels();` |

**DoD**: 三栏面板均可见，拖拽正常，expand-both 模式正常

---

## 3. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | treePanelsGrid 高度 > 0 | `expect(gridHeight).toBeGreaterThan(0);` |
| AC-2 | 三栏面板均可见 | `expect(panels).toHaveLength(3); expect(panels.every(p => p.visible)).toBe(true);` |
| AC-3 | 拖拽调整宽度正常 | `expect(dragWidthChange).toBeGreaterThan(0);` |
| AC-4 | expand-both 最大化正常 | `expect(expandBothGrid).toHaveStyle({ gridTemplateColumns: '1fr 1fr 1fr' });` |
| AC-5 | gstack screenshot 验证 | `expect(screenshot).toMatchFile('tree-panels-expected.png');` |

---

## 4. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | CSS 修复无 JS 性能损耗 |
| **回归** | staging 环境验证通过后再合并 main |

---

## 5. 实施计划

| Epic | Story | 工时 |
|------|-------|------|
| Epic 1 | S1.1-S1.5 验证 | 1.25h |

**总工时**: ~1.25h

---

## 6. DoD（完成定义）

1. 三栏面板均可见（截图验证）
2. 拖拽调整宽度正常
3. expand-both 模式正常
4. staging 环境验证通过
