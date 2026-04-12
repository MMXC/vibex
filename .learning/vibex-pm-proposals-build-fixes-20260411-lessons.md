# 经验教训：PM 视角 — 产品体验优化提案 + 6 Epic 执行规划（2026-04-11）

**项目**: `vibex-pm-proposals-vibex-build-fixes-20260411`
**角色**: PM
**分析视角**: 提案输出者 + 产品规划者
**日期**: 2026-04-11
**关联项目**: `vibex-dev-proposals-build-fixes-20260411`（Epic1 执行）, `vibex-architect-proposals-build-fixes-20260411`（架构评审）, `vibex-tester-proposals-build-fixes-20260411`（QA 体系设计）

---

## 📋 项目概述

**任务一**：PM 视角提案（提案输出角色）
- 提案 `proposal.md`：分析构建失败根因，提供两套修复方案（含短期止血 + 长期防护）
- 配套 `architecture.md`：业务影响评估 + 团队协作改进路线图
- 决策明确：推荐方案 A + 方案 B 的工具链加固部分

**任务二**：产品体验优化 PRD + 规划（提案输出角色）
- 输出 `prd.md`：6 个 Epic，21 个功能点，~40h 总工时
- 输出 `IMPLEMENTATION_PLAN.md`：2-Sprint 详细计划，含 Day 1-10 里程碑
- 输出 `plan/feature-list.md`：21 个 feature，依赖关系图，P1/P2/P3 分级

**总工时**: 提案 ~30min，规划 ~20min（未执行实现）

---

## ✅ 做得好的地方

### 1. 提案层次分明：止血 → 防护 → 长期

提案没有只给一个方案，而是分了两层：
- **方案 A（立即修复）**：30 分钟解除阻塞
- **方案 B（彻底排查 + 预防）**：ESLint 规则 + pre-commit hook + 全库扫描

这让决策者有梯度选择——Coord 可以只采纳方案 A 快速止血，也可以采纳全部。这是 PM 提案的正确姿势：**给选项，不只给结论**。

**模式固化**: 所有 PM 提案必须包含「快速方案 + 完整方案」，让决策者有回旋余地。

### 2. 业务影响矩阵比技术细节更重要

提案中 `业务影响评估` 表格没有只写"构建失败"，而是拆解成：
- 团队生产力（阻塞日常开发）
- 发布风险（CI 失败阻断部署）
- 技术债务（无引用文件积累）
- 用户体验（间接影响迭代速度）

这个拆解让非技术背景的决策者（如果有）也能理解优先级。Reviewer 和 Coord 审阅提案时，也更容易接受「P1 紧急」的判断依据。

**模式固化**: 每个提案的问题描述必须包含业务影响矩阵（影响维度 × 严重程度），技术描述可简，**业务影响不能省**。

### 3. PRD 从 20 个问题到 6 个 Epic 的聚合逻辑清晰

PM 读源码发现了 20 个问题，但 PRD 不是 20 个独立 Story，而是按**用户价值维度**聚合为 6 个 Epic：
- Epic 1（安全可靠性）：4 个 P1 阻塞体验
- Epic 2（导航信息架构）：5 个 P2 体验问题
- Epic 3（Canvas 体验）：4 个交互增强
- Epic 4（表单交互）：4 个表单质量
- Epic 5（新用户引导）：1 个大功能
- Epic 6（体验清理）：1 个细节优化

这个聚合**让执行者看到的是完整的产品方向，而不是杂乱的 bug 列表**。Epic 划分遵循「同一用户旅程的问题归同一 Epic」原则。

**模式固化**: PRD 中的问题 → Epic 聚合必须有明确的主题逻辑，不能按工时平均分配或按发现顺序排列。

### 4. 每个 Story 有可写的 expect() 断言

PRD 中每个 Story 都包含 `expect()` 形式的验收标准，例如：
- `expect(frontendRBACCode).toBe(null)`
- `expect(hasLoadingState(aiButton)).toBe(true)`
- `expect(saveIndicator.visible).toBe(true)`

这些断言让 Tester 和 Dev 都能直接转化为测试用例，不需要再从自然语言中反推验收条件。**验收标准写得像测试代码，执行者和 Reviewer 都能快速对齐**。

**模式固化**: 所有 PRD Story 必须包含至少一个 expect() 形式的验收标准，且必须可执行（不是「体验良好」这种模糊表述）。

### 5. Feature-list 包含依赖关系图

feature-list.md 中用 ASCII 图描述了 Epic 依赖关系：
```
Epic 1（安全）→ 无外部依赖
Epic 2（导航）→ 无外部依赖
Epic 3（Canvas）→ Epic 1（安全基础）可并行
Epic 4（表单）→ Epic 1 部分完成即可
Epic 5（引导）→ Epic 2 完成
Epic 6（清理）→ 可随时执行
```

这个依赖图对 Coord 派发任务、对 Dev 安排执行顺序、对 Tester 设计测试用例顺序都有直接价值。没有这个图，执行者可能按 Feature ID 顺序做，而不是按逻辑依赖做。

**模式固化**: 超过 5 个 feature 的 feature-list 必须包含依赖关系图，标注「可并行」「必须先完成」「可随时执行」三类。

### 6. Sprint 计划有具体的代码修改点

IMPLEMENTATION_PLAN.md 的 Day 1-10 计划不只写「做什么」，还写了「在哪改」：
- `components/generation-progress/GenerationProgress.tsx`
- `app/design/[id]/page.tsx`
- `middleware.ts`（项目根目录）
- `lib/error-mapper.ts`

这些路径信息让 Dev 不需要再次搜索代码库，也给 Reviewer 和 Tester 提供了直接的检查路径。

**模式固化**: Sprint 计划中的每个 Story 应包含「主要代码修改路径」，让执行者直接定位，不需要自己找。

---

## ❌ 需要改进的地方

### 1. 提案阶段没有先读取现有 Epics/Features 导致部分重复

feature-list.md 中 F1.2（AI 加载状态）在 PRD 的 Epic 1 和 Epic 4 中都出现了（Epic 1.2 叫「AI 操作统一加载状态」，Epic 4.1 叫「表单实时格式校验」，但 PRD 的 F1.2 和 F4.1 指向了不同内容）。

feature-list 和 PRD 的 Story ID 命名不一致（PRD 用「Epic 1 Story 1.2」，feature-list 用「F1.2」），且 PRD 里有 Story 编号重复。这会让 Coord 和 Dev 在追踪任务时产生混淆。

**改进**: 提案阶段先用 `rg` 或 `find` 扫描现有文档，确认没有重复 Story 再写入 PRD。Story ID 必须全局唯一，用统一前缀（建议全部用 F1.1 这样的格式，不混用 Epic X.X）。

### 2. Epic 1.1（权限后移）的工时被低估

Epic 1.1（权限校验后移）计划工时是 4h，但实现计划（IMPLEMENTATION_PLAN.md）中明确写了「高风险，需先行」，且包含后端新建 RBAC 中间件 + 所有端点加权限检查 + 前端移除 RBAC 代码 + 前后端同步部署。

4h 对于一个涉及**前后端同步改造 + 高风险部署顺序**的 Story 明显偏低。正常估算应该在 8-12h（含 QA 验证时间）。

**改进**: 涉及「前后端同步改」或「部署顺序敏感」的 Story，工时估算应该上浮 50-100%，并在 PRD 中标注「⚠️ 高风险 Story」。

### 3. Epic 3.4（移动端手势）的工时在 PRD 和 feature-list 中不一致

PRD Epic 3 中 Story 3.4 写的是「4h」，但 feature-list 中 F3.3 也是「4h」，而 PRD Epic 3 里面还有 3.1（引导 Overlay，3h）、3.2（debounce，1h）、3.3（版本历史，2h），Epic 3 总计 10h。

feature-list 中 F3.3 标注的根因关联是 P2.3（版本历史），对应的是 PRD 的 Story 3.3，但 feature-list 的总工时是 43h 而 PRD 是 40h——两边数字对不上。

**改进**: PRD 和 feature-list 必须在同一份源文件生成，或建立版本对齐机制。两者之间**同一 Story 的工时差值必须为零**。

### 4. 提案阶段没有扫描其他角色的提案文档

PM 提案生成时没有读取 dev-proposals、architect-proposals、tester-proposals 等其他角色的提案，导致：
- PM 提案和 Dev 提案都在分析同样的构建失败问题，重复工作
- PM 的提案没有引用其他角色已有的分析和决策

虽然最终各个角色的提案都汇总到了同一个项目目录下，但**提案撰写阶段没有交叉引用**导致了信息孤岛。

**改进**: PM 提案阶段在执行 `autoplan` 之前，先用 `rg` 扫描 `docs/` 目录下的现有提案，确认哪些问题已被其他角色覆盖。

### 5. 验收标准覆盖了功能，但缺少性能指标

PRD 的验收标准几乎全部是「功能存在性检查」（hasLoadingState、hasConfirmDialog），但没有性能指标：
- AI 操作响应时间
- Canvas 引导 Overlay 的渲染时间
- 批量操作多选时的列表滚动性能
- Onboarding 流程完成率

功能存在 ≠ 功能好用。一个 6h 的 Onboarding Story 只有功能验收标准，没有「完成率 ≥ 80%」或「首次加载时间 < 2s」的性能指标。

**改进**: 每个 Epic 至少有一个性能/体验类验收标准（可以用 `should`/`performance` 前缀标注），不只是功能存在性检查。

---

## ♻️ 可复用的模式

### 模式 1：「提案 → PRD → Sprint 计划」三件套

PM 提案的标准产出应该是三份文档：
1. **proposal.md**：问题分析 + 方案选项 + 决策建议
2. **prd.md**：Epic/Story 划分 + 工时 + 验收标准
3. **IMPLEMENTATION_PLAN.md**：Sprint 分配 + Day 里程碑 + 代码修改路径

这三件套让提案从「想法」变成「可执行的 Sprint 计划」，不需要 Coord 或其他角色再加工。

**适用场景**: 所有涉及功能开发的 PM 提案。

### 模式 2：「快速方案 + 完整方案」双选项

提案中给决策者的选项不是 A 或 B，而是「方案 A 立即执行 + 方案 B 的哪些部分追加采纳」。这样避免了「要么全做要么不做」的二选一困境。

**适用场景**: 所有有时间压力的 P1/P2 问题提案。

### 模式 3：「Story ID 贯穿 PRD → feature-list → Sprint 计划 → 验收标准」

PRD 的 Story 编号 → feature-list 的 Feature ID → Sprint 计划的 Day 任务，使用同一套编号体系。这样 Coord 派发任务时引用的是同一个 ID，Dev 执行时追踪的是同一个 ID，Tester 写测试用例时关联的也是同一个 ID。

**适用场景**: 超过 10 个 Story 的大型提案。

### 模式 4：「业务影响矩阵」作为提案开场

每个提案的开头不是「我们发现了 X 个问题」，而是「这些问题在以下维度造成了 Y 影响」，让技术决策有业务语境。

**适用场景**: 所有 PM 提案。

### 模式 5：「高风险 Story 标注」机制

涉及以下情况的 Story 必须标注「⚠️ 高风险」：
- 前后端同步改造
- 部署顺序敏感
- 涉及认证/权限/数据迁移
- 依赖外部服务

**适用场景**: 所有涉及安全或部署风险的 Story。

---

## 🚫 下次避免的坑

### 1. 不要在提案阶段跳过扫描现有文档

本项目 PM 提案与其他角色的提案有内容重叠（都在分析构建失败），导致重复劳动。**下次：提案动笔前，先用 `rg` 扫描 `docs/` 目录，确认已有覆盖。**

### 2. 不要混用 Story 编号体系

PRD 用「Epic 1 Story 1.2」，feature-list 用「F1.2」，两套编号混在同一项目里。**下次：采用全局唯一的 Feature ID（格式：F1.1），PRD 和 feature-list 共用同一份 ID 映射表。**

### 3. 不要低估涉及前后端同步的 Story 工时

Epic 1.1（权限后移）4h 的估算是典型低估。**下次：涉及前后端同步改动的 Story，工时估算基准 × 2，并明确标注部署顺序要求。**

### 4. 不要只写功能验收标准，忽略性能指标

所有 Story 的验收标准都是「hasX」类型的功能存在性检查，没有性能指标。**下次：每个 Epic 至少有一个性能/体验类验收标准（加载时间、完成率、响应延迟）。**

### 5. 不要在没有确认 Story 唯一性的情况下直接写入 PRD

PRD 中有 Story 编号冲突（F1.2 在 Epic 1 和 Epic 4 中指向不同内容）。**下次：PRD 写入前，用 `rg -l "F[0-9]" prd.md` 检查所有 ID 唯一性。**

### 6. 不要让 PRD 和 feature-list 出现工时差异

PRD 总工时 40h，feature-list 总工时 43h，相差 3h 找不到来源。**下次：PRD 和 feature-list 从同一份数据源生成，或建立工时一致性检查（diff = 0）。**

---

## 📊 数据摘要

| 维度 | 数值 |
|------|------|
| PM 提案产出文档数 | 5 份（proposal + architecture + prd + implementation_plan + feature-list）|
| PRD Epic 数 | 6 |
| PRD Feature/Story 数 | 21 |
| PRD 总工时（PRD 口径）| 40h |
| PRD 总工时（feature-list 口径）| 43h（⚠️ 不一致）|
| Sprint 数 | 2 |
| 高风险 Story 标注数 | 1（Epic 1.1）|
| 有 expect() 验收标准的 Story | 21（100%）|
| 有性能指标的 Story | 0（⚠️）|
| 有代码修改路径的 Story（计划阶段）| 0（⚠️，计划未执行）|

---

*经验沉淀人: PM subagent (coord)*
*沉淀日期: 2026-04-11*
*下次参考项目: `vibex-pm-proposals-vibex-build-fixes-20260411`*
