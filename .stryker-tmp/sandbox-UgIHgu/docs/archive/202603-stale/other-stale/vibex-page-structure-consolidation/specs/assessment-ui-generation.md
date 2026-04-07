# Assessment: UI Generation 步骤是否迁移到 Homepage

**评估日期**: 2026-03-21  
**评估人**: PM Agent  
**评估项目**: vibex-page-structure-consolidation  
**功能 ID**: F2.6

---

## 1. 功能概述

`/design/ui-generation` 允许用户基于领域模型和业务流程生成 UI 原型，是 Design 流程的核心功能。

## 2. 功能价值评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 用户价值 | 🔴 高 | 这是 Design 流程的核心卖点，用户粘度最高 |
| 差异化 | 🔴 高 | 是 VibeX 区别于竞品的核心功能 |
| 可替代性 | 🔴 高 | 无直接替代方案，是产品护城河 |

## 3. 迁移成本评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 组件复杂度 | 🔴 高 | 约 500-800 行代码，包含编辑器、预览、导出 |
| 状态依赖 | 🔴 高 | 需要 designStore 或重构为 confirmationStore |
| API 依赖 | 🔴 高 | 涉及 UI 生成 API，接口可能不同 |
| 测试覆盖 | 🔴 高 | 需要大量 E2E 测试 |

## 4. 迁移方案

### 方案 A：保留 Design 独立流程（推荐）

**理由**:
1. UI Generation 是 Design 工具的核心，不是 Homepage 流程的一部分
2. 迁移成本极高（可能需要 2 周+）
3. Design 流程作为独立设计工具保留是合理的架构决策
4. 用户心智模型：Homepage = 需求到模型，Design = 模型到 UI

**Pros**:
- 保持 Design 流程的独立性
- 不破坏现有架构
- 减少迁移风险

**Cons**:
- 用户需要切换入口使用 Design 工具
- 维护两套状态管理（短期）

### 方案 B：渐进式集成

**Pros**:
- 长期目标统一入口

**Cons**:
- 迁移周期太长（可能 1 个月+）
- 风险高

## 5. 建议决策

**建议**: 保留 Design 独立流程（方案 A）

**理由**:
1. UI Generation 是 Design 工具的核心价值，不应与 Homepage 流程混淆
2. 架构上 Homepage 负责需求到模型，Design 负责模型到 UI，职责清晰
3. 短期内保留 Design 独立流程，长期通过状态共享实现用户体验优化

## 6. 后续行动

- [ ] 确认 `designStore` 读取 `confirmationStore` 状态（状态共享）
- [ ] Design 页面显示 "从 Homepage 导入的上下文" 提示
- [ ] 优化 Design 页面入口可见性（导航栏优化）

---

**结论**: ❌ 不迁移，保持 Design 独立流程（Epic 2 标记为 P1 评估项，通过）
