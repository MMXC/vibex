# PRD: Canvas UX Improvements — 2026-03-31

> **任务**: vibex-canvas-ux-improvements/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-canvas-ux-improvements/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Canvas 存在状态管理混乱（选区过滤失效）、列表渲染卡顿、用户引导缺失三个问题 |
| **目标** | checkbox 行为可预测、100+节点流畅、用户有清晰引导 |
| **成功指标** | checkbox 成功率 ≥95%；100节点 < 100ms；三栏 empty state 有引导 |

---

## 2. Epic 拆分

### Epic 1: 状态管理规范化（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | CanvasPage.tsx 增加选区过滤逻辑 | 1h | `expect(filteredContexts.length).toBeLessThanOrEqual(selectedContextIds.size);` |
| S1.2 | BusinessFlowTree.tsx 选区过滤 | 0.5h | `expect(filteredFlows.length).toBeLessThanOrEqual(selectedFlowIds.size);` |
| S1.3 | 验收：选中部分卡片后继续，请求体仅包含选中卡片 | 0.5h | `expect(apiRequest.contexts.length).toBe(selectedCount);` |

**文件**: `CanvasPage.tsx:458`, `BusinessFlowTree.tsx:761`

**DoD**: 选中部分卡片后继续，请求体仅包含选中卡片；未选中时发送全部（向后兼容）

---

### Epic 2: 列表虚拟化（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | @tanstack/react-virtual 引入 | 0.5h | `expect(isInstalled('@tanstack/react-virtual')).toBe(true);` |
| S2.2 | ComponentTree 虚拟化 | 2.5h | `expect(renderTime(100)).toBeLessThan(100); expect(fps).toBeGreaterThan(30);` |
| S2.3 | BusinessFlowTree 虚拟化 | 2h | `expect(renderTime(100)).toBeLessThan(100);` |

**DoD**: 100 节点渲染 < 100ms，滚动 30+ fps

---

### Epic 3: 用户引导体系（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | ComponentTree 空状态引导补充 | 0.5h | `expect(getByText(/继续.*组件树/)).toBeInTheDocument();` |
| S3.2 | 连线类型图例（FlowTree 角落） | 0.5h | `expect(legend).toBeVisible(); expect(legend).toHaveTextContent(/顺序\|分支\|循环/);` |
| S3.3 | start/end 节点标记 tooltip | 0.5h | `expect(startMarker.title).toMatch(/起点\|start/i); expect(endMarker.title).toMatch(/终点\|end/i);` |
| S3.4 | "?" 快捷键帮助面板 | 0.5h | `expect(shortcutPanel).toBeVisibleWhenKeyPressed('?');` |

**DoD**: 三栏 empty state 有引导；连线图例可见；节点标记有 tooltip

---

## 3. 验收标准总表

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | 选区过滤：只发送选中卡片 | `expect(apiRequest.contexts.length).toBe(selectedCount);` |
| AC-2 | 向后兼容：未选中时发送全部 | `expect(apiRequest.contexts.length).toBe(allCount);` |
| AC-3 | 100 节点渲染 < 100ms | `expect(renderTime(100)).toBeLessThan(100);` |
| AC-4 | ComponentTree 空状态有引导 | `expect(getByText(/继续.*组件树/)).toBeInTheDocument();` |
| AC-5 | 连线图例可见 | `expect(legend).toBeVisible();` |
| AC-6 | 节点标记有 tooltip | `expect(markers.every(m => m.title.length > 0)).toBe(true);` |

---

## 4. 实施计划

| Epic | 工时 | Sprint | 负责人 |
|------|------|--------|--------|
| Epic 1: 状态管理 | 2h | Sprint 0 | dev |
| Epic 2: 虚拟化 | 5h | Sprint 1 | dev |
| Epic 3: 用户引导 | 2h | Sprint 1 | dev |

**总工时**: 9h
