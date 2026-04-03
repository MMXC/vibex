# PRD: Canvas 用户引导体系完善 — 2026-03-31

> **任务**: vibex-canvas-hint-guide/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-canvas-hint-guide/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas Epic3（Flow 关系可视化）上线后，ComponentTree 空状态无引导，连线图例和节点标记 tooltip 缺失 |
| **目标** | 补充缺失的引导体系，降低新用户流失率 |
| **成功指标** | ComponentTree 空状态有引导；连线图例可见；节点标记有 tooltip |

---

## 2. Epic 拆分

### Epic 1: 组件树空状态引导补充（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | ComponentTree.tsx 补充空状态引导文案 | 0.5h | `expect(getByText(/继续.*组件树\|手动新增/)).toBeInTheDocument();` |

**文件**: `vibex-fronted/src/components/canvas/ComponentTree.tsx:1024-1027`

**DoD**: 刷新 canvas 无组件时，ComponentTree 显示引导文案

---

### Epic 2: 键盘快捷键帮助面板（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | CanvasPage.tsx 添加 "?" 快捷键监听 | 0.5h | `expect(shortcutPanel).toBeVisibleWhenKeyPressed('?');` |
| S2.2 | 快捷键面板 UI（Ctrl+Z/Ctrl+Shift+Z 等） | 0.5h | `expect(panel).toHaveTextContent(/Ctrl\+Z\|Ctrl\+Shift\+Z/);` |

**DoD**: 按 "?" 键打开帮助面板，显示所有快捷键

---

### Epic 3: 连线类型图例（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------||------|---------|
| S3.1 | FlowTree 角落增加三种连线样式图例 | 0.5h | `expect(legend).toBeVisible(); expect(legend).toHaveTextContent(/顺序\|分支\|循环/);` |

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx` 或 `CanvasPage.tsx`

**DoD**: FlowTree 角落显示连线图例，三种样式均可辨识

---

### Epic 4: 节点标记 Tooltip（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------||------|---------|
| S4.1 | start 标记（绿圈）添加 "起始节点" tooltip | 0.25h | `expect(startMarker).toHaveAttribute('title', /起点\|start/i);` |
| S4.2 | end 标记（红方）添加 "终点节点" tooltip | 0.25h | `expect(endMarker).toHaveAttribute('title', /终点\|end/i);` |

**DoD**: hover start/end 标记显示中文/英文说明

---

## 3. 验收标准总表

| ID | 条件 | 测试断言 |
|----|------|---------|
| AC-1 | ComponentTree 空状态有引导 | `expect(getByText(/继续.*组件树/)).toBeInTheDocument();` |
| AC-2 | "?" 键打开帮助面板 | `expect(panel).toBeVisibleWhenKeyPressed('?');` |
| AC-3 | 帮助面板含快捷键列表 | `expect(panel).toHaveTextContent(/Ctrl\+Z/);` |
| AC-4 | 连线图例可见 | `expect(document.querySelector('[class*=flowLegend]')).toBeVisible();` |
| AC-5 | start 标记 tooltip | `expect(startMarker.title).toMatch(/起点\|start/);` |
| AC-6 | end 标记 tooltip | `expect(endMarker.title).toMatch(/终点\|end/);` |
| AC-7 | gstack screenshot 验证 | `expect(screenshot).toMatchFile('canvas-guidance-expected.png');` |

---

## 4. 实施计划

| Epic | Story | 工时 | 负责人 |
|------|-------|------|--------|
| Epic 1 | S1.1 ComponentTree 引导 | 0.5h | dev |
| Epic 2 | S2.1+S2.2 快捷键面板 | 1h | dev |
| Epic 3 | S3.1 连线图例 | 0.5h | dev |
| Epic 4 | S4.1+S4.2 节点 tooltip | 0.5h | dev |

**总工时**: 2.5h
