# PRD: VibeX 三树增强 — 领域关系 + 分支循环 + 交互能力

**项目**: vibex-three-trees-enhancement-20260326
**版本**: 1.0
**PM**: PM Agent
**日期**: 2026-03-26
**状态**: 🔴 草稿
**前置依赖**: `vibex-canvas-api-fix-20260326`（必须先完成，否则三树为空无法验证）

---

## 1. 执行摘要

### 问题陈述
VibeX 三树画布功能不完整：
1. **上下文树** — 节点平铺，无领域关系连线
2. **流程树** — 线性三步，无分支/循环/网关
3. **组件树** — 节点静态展示，不可交互

### 目标
在 API 对接完成后，对三树进行可视化增强，完整呈现 DDD 建模成果。

### 成功指标
| 指标 | 目标 |
|------|------|
| 上下文树关系连线覆盖率 | ≥ 80%（有关系的节点对均有连线） |
| 流程树网关支持率 | 100%（XOR + OR + Loop 均支持） |
| 组件树交互功能可用率 | 100%（展开/折叠/跳转均可用） |
| 回归测试通过率 | 100%（API 对接功能不受影响） |

---

## 2. 功能需求

### F1: 上下文树领域关系连线 【需页面集成】
**文件**: `src/components/canvas/ContextTreePanel.tsx` (推测)
**负责人**: Dev | **工时**: ~2h

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|----------|
| F1.1 | 依赖关系连线 | 节点之间显示实线箭头连线 | `expect(svg.selectAll('.edge-dependency').length).toBeGreaterThan(0)` | 【需页面集成】 |
| F1.2 | 聚合关系连线 | 聚合根与聚合成员显示粗线 | `expect(svg.selectAll('.edge-aggregate').attr('stroke-width')).toBeGreaterThan(1)` | 【需页面集成】 |
| F1.3 | 连线标签 | 连线旁显示关系类型标签（如 "依赖"、"聚合"） | `expect(edgeLabel.textContent).toMatch(/依赖\|聚合\|调用/i)` | 【需页面集成】 |
| F1.4 | 拖拽布局调整 | 节点可拖拽移动，连线实时跟随 | `expect(draggedNode.x).not.toBe(originalX)` | 【需页面集成】 |

### F2: 流程树分支与循环 【需页面集成】
**文件**: `src/components/canvas/FlowTreePanel.tsx` (推测)
**负责人**: Dev | **工时**: ~3h

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|----------|
| F2.1 | XOR 网关节点 | 菱形节点，标注分支条件 | `expect(svg.selectAll('.gateway-xor').length).toBeGreaterThan(0)` | 【需页面集成】 |
| F2.2 | OR 网关节点 | 菱形节点，标注 OR | `expect(svg.selectAll('.gateway-or').length).toBeGreaterThan(0)` | 【需页面集成】 |
| F2.3 | 循环回路 | 虚线箭头指向前置步骤 | `expect(svg.selectAll('.edge-loop').attr('stroke-dasharray')).toBeTruthy()` | 【需页面集成】 |
| F2.4 | 分支条件标签 | 连线旁显示条件表达式 | `expect(edgeLabel.textContent).toMatch(/条件\|when\|if/i)` | 【需页面集成】 |
| F2.5 | 线性流程兼容 | 无网关的线性流程仍正常显示 | `expect(flowNodes.length).toBeGreaterThan(0)` | 【需页面集成】 |

### F3: 组件树交互能力 【需页面集成】
**文件**: `src/components/canvas/ComponentTreePanel.tsx` (推测)
**负责人**: Dev | **工时**: ~2h

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|---------|----------|
| F3.1 | 节点展开/折叠 | 点击节点展开子节点列表，再次点击折叠 | `expect(collapsedNode.querySelector('.children')).toBeHidden()` | 【需页面集成】 |
| F3.2 | 节点点击跳转 | 点击节点跳转到对应代码文件 | `expect(window.location.href).toContain(expectedPath)` | 【需页面集成】 |
| F3.3 | 节点 hover 高亮 | hover 时节点高亮显示 | `expect(node.classList.contains('hovered')).toBe(true)` | 【需页面集成】 |
| F3.4 | 子树统计 | 折叠节点旁显示子节点数量 | `expect(nodeLabel.textContent).toMatch(/\(\d+\)/)` | 【需页面集成】 |

### F4: 回归保障 【需页面集成】
**负责人**: Tester | **工时**: ~1h

| ID | 功能点 | 验收标准 | 页面集成 |
|----|--------|---------|----------|
| F4.1 | API 对接不受影响 | 启动画布 API 调用正常，三树非空 | 【需页面集成】 |
| F4.2 | 导出功能正常 | tar.gz 导出包含所有节点 | 【需页面集成】 |

---

## 3. Epic 拆分

### Epic 1: 上下文树领域关系增强（P1）
**工时**: ~2h | **负责人**: Dev

| Story | 验收 |
|--------|------|
| S1.1 依赖关系连线 | F1.1-F1.2 expect() 通过 |
| S1.2 聚合关系连线 | F1.3-F1.4 expect() 通过 |
| S1.3 拖拽布局 | gstack 交互测试 |

### Epic 2: 流程树分支与循环增强（P1）
**工时**: ~3h | **负责人**: Dev

| Story | 验收 |
|--------|------|
| S2.1 网关节点（XOR/OR） | F2.1-F2.2 expect() 通过 |
| S2.2 循环回路支持 | F2.3 expect() 通过 |
| S2.3 分支条件标签 | F2.4-F2.5 expect() 通过 |

### Epic 3: 组件树交互能力（P1）
**工时**: ~2h | **负责人**: Dev

| Story | 验收 |
|--------|------|
| S3.1 展开/折叠 | F3.1 expect() 通过 |
| S3.2 点击跳转 | F3.2 gstack 交互测试 |
| S3.3 hover + 统计 | F3.3-F3.4 expect() 通过 |

### Epic 4: 回归与集成测试（P0）
**工时**: ~1h | **负责人**: Tester

| Story | 验收 |
|--------|------|
| S4.1 API 对接回归 | F4.1 gstack 截图验证 |
| S4.2 导出功能回归 | F4.2 gstack 截图验证 |

---

## 4. UI/UX 流程

```
[API 对接完成 → 三树非空]
         ↓
[上下文树: 节点间显示连线（依赖/聚合）]
         ↓
[流程树: 显示网关节点 + 分支条件 + 循环回路]
         ↓
[组件树: 节点可展开/折叠/点击跳转]
         ↓
[导出 tar.gz: 包含关系和交互数据]
```

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | 100 个节点渲染时间 ≤ 1s |
| **可用性** | 新手无需学习即可理解连线含义 |
| **兼容性** | 回归测试 100%（API 对接功能不受影响） |
| **可测试性** | 每个功能点可写 expect() 断言 |

---

## 6. Open Questions（需确认）

| # | 问题 | 优先级 | 状态 |
|---|------|--------|------|
| OQ1 | 领域关系数据来源 | P0 | ✅ 已确认：AI分析用户需求产出初版，用户觉得不对可以增强描述 |
| OQ2 | 分支条件表达方式（DSL / 自然语言） | P1 | 🟡 待确认 |
| OQ3 | 组件跳转目标（文件路径 / URL） | P1 | 🟡 待确认 |

---

## 7. DoD

- [ ] F1-F4 全部功能点实现
- [ ] 每个功能点有 expect() 验收标准
- [ ] gstack 截图验证 V1-V3（上下文关系 + 流程网关）
- [ ] gstack 交互测试 V4-V5（组件树交互）
- [ ] Epic 4 回归测试全部通过
- [x] OQ1 已确认：AI分析用户需求产出初版，用户觉得不对可以增强描述

---

## 8. gstack 验证清单

| # | 验证项 | 命令 | 预期结果 |
|---|--------|------|---------|
| G1 | 上下文树有连线 | `/browse /canvas` → 截图 | 连线数 > 0 |
| G2 | 流程树有网关 | `/browse /canvas` → 截图 | 网关节点可见 |
| G3 | 组件树可展开 | `/qa-only` → 点击节点 → 截图 | 子节点展开 |
| G4 | API 回归正常 | `/qa-only` → 启动画布 → 截图 | 三树非空 |
| G5 | 导出正常 | `/qa-only` → 导出 → 验证 | tar.gz 正常 |

---

*前置依赖: vibex-canvas-api-fix-20260326 必须先完成*
*基于 analysis.md (vibex-three-trees-enhancement-20260326) 产出*
