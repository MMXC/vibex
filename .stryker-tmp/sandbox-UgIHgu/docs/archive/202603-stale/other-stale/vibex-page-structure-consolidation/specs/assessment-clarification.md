# Assessment: Clarification 步骤是否迁移到 Homepage

**评估日期**: 2026-03-21  
**评估人**: PM Agent  
**评估项目**: vibex-page-structure-consolidation  
**功能 ID**: F2.5

---

## 1. 功能概述

`/design/clarification` 允许用户在生成领域模型后进行 AI 追问和需求澄清，是 Design 流程的独特功能。

## 2. 功能价值评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 用户价值 | 🟡 中 | 约 30% 用户会使用澄清功能 |
| 差异化 | 🔴 高 | 这是 Design 流程的独特卖点之一 |
| 可替代性 | 🟢 低 | AI 追问是核心功能，难以用其他方式替代 |

## 3. 迁移成本评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 组件复杂度 | 🟡 中 | 约 200-300 行代码 |
| 状态依赖 | 🟡 中 | 需要 clarificationStore 或扩展 confirmationStore |
| API 依赖 | 🟡 中 | 复用现有 AI API |
| 测试覆盖 | 🟢 低 | 需要迁移现有测试 |

## 4. 迁移方案

### 方案 A：迁移到 Homepage（推荐）

**Pros**:
- 用户体验一致（所有功能在一个入口）
- 降低维护成本（单一代码库）
- 提高澄清功能使用率

**Cons**:
- 需要扩展 confirmationStore
- Homepage 步骤数从 5 增加到 6

### 方案 B：保留 Design 独立页面

**Pros**:
- 无状态管理复杂性
- 不影响现有 Homepage 流程

**Cons**:
- 用户体验分裂
- 维护两套代码

## 5. 建议决策

**建议**: 迁移到 Homepage（方案 A）

**理由**:
1. Clarification 是用户流程的自然延伸（生成模型后追问）
2. 设计工具的独特价值在于 UI Generation，不是 Clarification
3. 迁移成本可控（1-2 天）

## 6. 迁移条件

以下条件满足时执行迁移：
- [ ] Homepage 基础流程（Step 1-5）验证通过
- [ ] confirmationStore 扩展完成
- [ ] 迁移后 E2E 测试通过

---

**结论**: ✅ 建议迁移（Epic 3 包含此任务）
