# vibex-json-render-integration — Planning

**项目**: vibex-json-render-integration
**日期**: 2026-04-14
**作者**: PM Agent
**基于**: analysis.md

---

## 执行摘要

VibeX Canvas 的 json-render 集成存在 4 类根因缺陷，导致 Canvas 生成的组件树无法正确预览。分析阶段已完成（见 `analysis.md`），确认方案 A（增量修复）为推荐路径。

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | catalog slots 声明补全 | 为所有容器组件添加 `slots: ["default"]` | R1 | 0.25d |
| F1.2 | nodesToSpec parentId 转换 | 修复 ComponentNode → Spec 转换，正确使用 parentId 重建嵌套关系 | R2 | 0.5d |
| F1.3 | Registry Page 尺寸修复 | 移除 `min-h-screen`，适配 Preview Modal 容器 | R3 | 0.25d |
| F2.1 | ActionProvider 实现 | 实现 emit 事件和 handlers 基础响应 | R4 | 0.5d |
| F2.2 | Preview Modal 尺寸适配 | Modal 容器自适应内容高度 | R3 | 0.25d |
| F2.3 | 单元测试补充 | nodesToSpec 覆盖 parentId 转换、单节点/嵌套渲染 | R2 | 0.5d |
| F2.4 | E2E 覆盖补充 | 新增嵌套渲染、交互响应 E2E 测试 | 整体 | 0.5d |

---

## Epic 拆分

### Epic 1 — 阻断性修复（Phase 1，P0）

**目标**: 解决 schema 验证阻断和 parentId 嵌套失效，工时合计 1d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S1.1 | catalog 容器组件 slots 补全 | Page/Form/DataTable/DetailView/Modal 均声明 `slots: ["default"]`，schema 验证通过 | 0.25d |
| S1.2 | nodesToSpec parentId 转换 | 二层嵌套、三层嵌套渲染正常，parentId/children 一致性通过单元测试 | 0.5d |
| S1.3 | Registry Page 尺寸修复 | Preview Modal 中 Page 不溢出，内容正确可见 | 0.25d |

### Epic 2 — 功能增强（Phase 2，P1）

**目标**: 完善交互能力和测试覆盖，工时合计 1.75d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S2.1 | ActionProvider 基础实现 | emit 事件可触发，handlers 包含可响应 action，Button hover 有视觉反馈 | 0.5d |
| S2.2 | Preview Modal 尺寸适配 | Modal 高度自适应，支持滚动，内容不溢出 | 0.25d |
| S2.3 | nodesToSpec 单元测试 | 单节点/二层嵌套/三层嵌套/parentId 一致性 4 类测试全部通过 | 0.5d |
| S2.4 | E2E 嵌套渲染测试 | E2E 覆盖嵌套组件渲染场景，点击预览后内容可见 | 0.5d |

---

## 依赖关系

```
Epic 1（阻断修复）
├── S1.1 slots 补全 ← 独立
├── S1.2 parentId 转换 ← 独立（依赖分析报告中的 parentId 验证假设）
└── S1.3 Page 尺寸 ← 独立

Epic 2（功能增强）— 依赖 Epic 1
├── S2.1 ActionProvider ← 依赖 S1.3（Page 尺寸）
├── S2.2 Modal 尺寸 ← 依赖 S1.3
├── S2.3 单元测试 ← 依赖 S1.2
└── S2.4 E2E 覆盖 ← 依赖 S1.1+S1.2+S1.3
```

---

## 关键风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| parentId 不一致（部分节点未设置 parentId） | 中 | 高 | 先写单元测试验证 parentId 正确性，再改 nodesToSpec |
| json-render schema 验证静默失败 | 低 | 中 | Playwright 截图验证嵌套渲染可见性 |
| E2E flaky（网络/登录依赖） | 中 | 低 | mock 数据减少环境依赖 |

---

*PM Agent — 2026-04-14*
