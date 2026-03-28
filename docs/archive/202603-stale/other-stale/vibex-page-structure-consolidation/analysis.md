# VibeX 页面结构整合重构分析报告

> 项目: vibex-page-structure-consolidation
> 日期: 2026-03-20 | 分析师: Analyst Agent
> 工作目录: /root/.openclaw/vibex/vibex-fronted

---

## 1. 执行摘要

**核心问题**: 存在四套并行的页面流程，分散在 4 个路由前缀下，共用相同的 Store 但使用不同的 UI 组件。

**根因**: 历史演进 — 不同迭代时期创建的并行实现，从未统一整合。

**目标**: 消除冗余，统一为单一入口和流程。

---

## 2. 问题定义

### 2.1 四套并行流程

| 流程 | 路由前缀 | 主组件 | 状态存储 | 页面数量 | 代码行数 |
|------|----------|--------|----------|----------|----------|
| **Homepage 流程** | `/` | `HomePage` + `steps/*` | `confirmationStore` | 1 | ~9 (page.tsx) |
| **Confirm 流程** | `/confirm/*` | `ConfirmationSteps` | `confirmationStore` | 5 | ~1000 |
| **Design 流程** | `/design/*` | `DesignStepLayout` | `designStore` | 5 | ~550 |
| **Requirements 流程** | `/requirements/*` | (legacy) | ? | 2 | ~450 |

**总页面数**: ~35 个页面（含其他独立页面）

### 2.2 流程详情

**Homepage 流程**（现代，模块化）:
```
/ (HomePage.tsx)
  └── steps/StepRequirementInput.tsx   ← 需求输入
  └── steps/StepBoundedContext.tsx      ← 限界上下文
  └── steps/StepDomainModel.tsx         ← 领域模型
  └── steps/StepBusinessFlow.tsx         ← 业务流程
  └── steps/StepProjectCreate.tsx        ← 创建项目
```

**Confirm 流程**（legacy，与 Homepage 重叠）:
```
/confirm (ConfirmationSteps)
  └── /confirm/context    ← 限界上下文
  └── /confirm/flow     ← 业务流程
  └── /confirm/model     ← 领域模型
  └── /confirm/success  ← 创建成功
```

**Design 流程**（独立设计流程）:
```
/design/bounded-context    ← 限界上下文（独立 UI）
/design/clarification      ← 需求澄清
/design/domain-model       ← 领域模型（独立 UI）
/design/business-flow     ← 业务流程（独立 UI）
/design/ui-generation     ← UI 生成
```

**Requirements 流程**（legacy）:
```
/requirements      ← 需求列表
/requirements/new  ← 新建需求
```

### 2.3 重叠分析

| 功能 | Homepage | Confirm | Design | Requirements |
|------|----------|---------|--------|-------------|
| 需求输入 | ✅ StepRequirementInput | ❌ | ❌ | ✅ |
| 限界上下文 | ✅ StepBoundedContext | ✅ (context) | ✅ | ❌ |
| 领域模型 | ✅ StepDomainModel | ✅ (model) | ✅ | ❌ |
| 业务流程 | ✅ StepBusinessFlow | ✅ (flow) | ✅ | ❌ |
| UI 生成 | ❌ | ❌ | ✅ | ❌ |
| 项目创建 | ✅ StepProjectCreate | ✅ (success) | ❌ | ❌ |

---

## 3. 根因分析

### 3.1 代码冗余

**同一功能被多个组件实现**：

```
需求输入:
- Homepage: src/components/homepage/steps/StepRequirementInput.tsx
- Requirements: src/app/requirements/page.tsx (402 行)

限界上下文:
- Homepage: src/components/homepage/steps/StepBoundedContext.tsx
- Confirm:   src/app/confirm/context/page.tsx (194 行)
- Design:    src/app/design/bounded-context/page.tsx (68 行)

领域模型:
- Homepage: src/components/homepage/steps/StepDomainModel.tsx
- Confirm:   src/app/confirm/model/page.tsx (247 行)
- Design:    src/app/design/domain-model/page.tsx (48 行)

业务流程:
- Homepage: src/components/homepage/steps/StepBusinessFlow.tsx
- Confirm:   src/app/confirm/flow/page.tsx (194 行)
- Design:    src/app/design/business-flow/page.tsx (48 行)
```

**同一 Store 被不同 UI 组件消费**：

```
confirmationStore 被:
- Homepage steps/* 消费
- Confirm 页面消费
- Requirements 页面消费（可能）

designStore 被:
- Design 流程消费
```

### 3.2 维护成本

| 问题 | 影响 |
|------|------|
| 修改一个功能需改多个文件 | 同步成本高，容易遗漏 |
| 状态管理分散 | 难以追踪数据流 |
| 测试覆盖困难 | 同一逻辑多套测试 |
| 新人理解成本高 | 35 个页面，难以理解关系 |
| UI 不一致风险 | 不同组件可能有细微差异 |

### 3.3 用户困惑

- `/confirm` vs `/` — 用户应该用哪个？
- `/design` vs `/confirm` — 区别是什么？
- 三套流程是否同步？

---

## 4. 技术方案

### 4.1 方案 A：统一入口，保留 Design 独立流程（推荐）

```
保留:
- Homepage 流程 (/) — 作为主入口
- Design 流程 (/design/*) — 独立设计工具

废弃:
- Confirm 流程 (/confirm/*) — 重定向到 Homepage
- Requirements 流程 (/requirements/*) — 合并或废弃

路由策略:
- /confirm/* → 重定向到 / 或 /design/*
- /requirements/* → 重定向到 / 或合并到 Homepage
```

**优点**：
- 改动最小，风险可控
- Design 作为独立设计工具保留
- Homepage 作为主流程

**缺点**：
- 仍有 Design/DesignStore 独立体系
- 需要迁移 Design 页面数据

### 4.2 方案 B：完全合并，统一到 Homepage

```
保留:
- Homepage 流程 (/) — 唯一入口，包含所有步骤

废弃:
- Confirm 流程 → 重定向到 /
- Design 流程 → 合并步骤到 Homepage
- Requirements 流程 → 合并到 Homepage

设计:
/design/bounded-context → / (StepBoundedContext)
/design/domain-model → / (StepDomainModel)
/design/business-flow → / (StepBusinessFlow)
/design/ui-generation → / (新增 StepUIGeneration)
/design/clarification → / (新增 StepClarification)
```

**优点**：
- 单一代码库，易维护
- 用户体验一致
- 状态管理统一

**缺点**：
- 改动最大，风险高
- 可能影响已有书签/分享链接
- 需要完整测试

### 4.3 方案 C：渐进式迁移（推荐备选）

```
Phase 1: 标记废弃 + 重定向
- /confirm → 重定向到 /
- /requirements → 重定向到 /

Phase 2: 逐步迁移 Design 步骤到 Homepage
- Design 的 bounded-context/domain-model/business-flow → Homepage
- 保留 Design 的 clarification 和 ui-generation

Phase 3: 完全移除废弃代码
- 删除 /confirm, /requirements 目录
- 清理废弃组件
```

**优点**：
- 低风险，可回滚
- 用户逐步适应
- 团队可并行开发

**缺点**：
- 迁移周期长（2-3 周）
- 需要维护两套代码一段时间

---

## 5. 推荐方案

**方案 A（快速止血）+ 方案 C（长期目标）**

**立即行动**：
1. `/confirm/*` 和 `/requirements/*` 添加 Next.js 重定向到 `/`
2. 导航栏移除或标记废弃链接
3. 添加 Deprecation 日志

**长期计划**：
1. 评估 Design 流程的独特价值（clarification, ui-generation）
2. 逐步将 Design 步骤合并到 Homepage
3. 清理废弃代码

---

## 6. 核心 JTBD

### JTBD 1: 统一流程入口

> **作为一个用户，我希望有一个清晰的入口来完成需求到原型的全流程，不需要在多个页面之间选择。**

- 当前：4 个入口（/, /confirm, /design, /requirements）
- 目标：1 个入口（/）

### JTBD 2: 消除重复代码

> **作为一个开发者，我希望修改一个功能只需要改一个地方，而不是同步改 4 个文件。**

- 当前：限界上下文在 3 个地方实现
- 目标：限界上下文只在一处实现

### JTBD 3: 统一状态管理

> **作为一个维护者，我希望状态流清晰可追踪，而不是分散在多个 Store 中。**

- 当前：confirmationStore + designStore + 可能的 requirementsStore
- 目标：单一确认 Store（或按领域拆分）

---

## 7. 验收标准

### Phase 1: 止血（1-2天）

- [ ] `/confirm/*` 所有路由重定向到 `/`
- [ ] `/requirements/*` 所有路由重定向到 `/`
- [ ] 导航栏移除 `/confirm` 和 `/requirements` 入口
- [ ] 旧流程页面添加 Deprecation 注释
- [ ] 无 404（重定向正常工作）
- [ ] 现有 Homepage 流程测试通过

### Phase 2: 整合（1-2周）

- [ ] Design 的 bounded-context 步骤合并到 Homepage
- [ ] Design 的 domain-model 步骤合并到 Homepage
- [ ] Design 的 business-flow 步骤合并到 Homepage
- [ ] clarification 和 ui-generation 评估（保留或合并）
- [ ] 所有迁移后的页面 E2E 测试通过
- [ ] 状态管理统一验证

### Phase 3: 清理（1周）

- [ ] 删除 `/confirm` 目录
- [ ] 删除 `/requirements` 目录
- [ ] 删除废弃的 `ConfirmationSteps` 组件
- [ ] 清理废弃的 store 代码
- [ ] 更新文档和路由图

---

## 8. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 用户已有 /confirm 书签 | 🟡 中 | 重定向 301 保留 SEO |
| Design 流程有独特价值无法合并 | 🟡 中 | 评估后决定保留 |
| 迁移期间功能退化 | 🟡 中 | 每步骤完整测试 |
| 代码删除影响其他依赖 | 🔴 高 | 全面 grep + 单元测试 |

---

## 9. 工时估算

| 阶段 | 工时 | 说明 |
|------|------|------|
| Phase 1: 重定向 | 1天 | Next.js 重定向配置 |
| Phase 2: 逐步合并 | 2周 | 5个 Design 步骤迁移 |
| Phase 3: 清理 | 1周 | 删除废弃代码 |
| **总计** | **~3周** | |

---

## 10. 相关历史项目

本项目与以下已完成/进行中的项目有重叠：

| 项目 | 状态 | 与本项目关系 |
|------|------|-------------|
| `vibex-homepage-flow-redesign` | 已完成 | Homepage 流程已重构 |
| `vibex-proposal-five-step-flow` | 已完成 | 定义了五步流程 |
| `vibex-step-modular-architecture` | 已完成 | 步骤已模块化 |
| `vibex-homepage-modular-refactor` | 已完成 | Homepage 已模块化 |
| `vibex-step2-issues` | 进行中 | Step2 相关问题 |

**结论**: Homepage 流程已经过重构和模块化，具备整合条件。

---

## 11. 结论

**问题定位**: ✅ 清晰（四套并行流程）

**根因**: 历史演进，从未统一整合

**推荐方案**: 方案 A（快速止血）+ 方案 C（长期迁移）

**实施优先级**：
1. 立即：重定向废弃路由
2. 短期：合并 Design 步骤到 Homepage
3. 长期：清理废弃代码

**预估工时**: ~3 周

---

*Generated by: Analyst Agent*
*Date: 2026-03-20*
