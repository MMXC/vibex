# 经验沉淀：vibex-proposals-20260411-page-structure

**项目**: vibex-proposals-20260411-page-structure
**角色**: 经验沉淀（coord subagent）
**日期**: 2026-04-12

---

## 项目概述

**项目目标**：在组件树中增加 `pageName` 可选字段，允许用户覆盖默认 BusinessFlowNode.name 展示名称；分组元数据增加 `pageId` + `componentCount`；组件树顶部增加「📋 JSON」预览入口，展示 pageId + pageName + 组件结构的 JSON 树视图。

**Epic 列表**：

| Epic | 名称 | 描述 |
|------|------|------|
| E1 | ComponentNode 页面元数据增强 | pageName 类型扩展 + getPageLabel 优先级 + 分组元数据 |
| E2 | JSON 预览功能 | JSON 按钮 + JSON 树视图渲染 + 通用组件组 JSON |
| E3 | 回归与测试 | 单元测试覆盖 + E2E 测试 |

**关键 commits**：`60cd1ac4`（单元测试）、`02c735f1`（E2 JSON preview 重构）、`03ce811a`（matchFlowNode/CSS 修复）

---

## 做得好的地方

### 1. 选择最小可行方案（方案 A）而非过度设计

项目开始时，Architect 提出了 3 套方案：
- **方案 A（推荐）**：~3h，复用 `flowId` 作为 `pageId`，增量修改
- **方案 B**：~8h，引入独立 Page 概念，重构 Store
- **方案 C**：~15h，废弃 flowId 分组逻辑，完全按 Page 维度重组

最终采纳方案 A，实际执行 ~4.5h，风险极低，不破坏现有分组逻辑。**经验**：增量增强优于大范围重构，小步快跑让项目按时交付。

### 2. 在分析阶段充分研究 Git History，避免重蹈覆辙

Analyst 在 `analysis.md` 中系统梳理了 ComponentTree.tsx 的 32 次提交记录，提炼出 5 条关键 lessons：
- L3：JSON Preview 是独立能力，需先建立 catalog+registry+error boundary
- L5：`matchFlowNode()` 共享函数抽取后，测试从失败→29 tests pass

这些教训直接影响了方案选择和实现路径，避免了重复踩坑。**经验**：PRD 前置的 Git History 分析是高价值行为，应该成为标准流程。

### 3. 验收标准（expect 断言）前置到 PRD 层面

PRD 中直接写了 TypeScript 测试代码片段（`expect()` 断言），而非仅用文字描述功能。Dev 按图索骥，Reviewer 有明确的判断依据，减少了理解偏差。**经验**：PRD 层写清楚"如何验证"，能让后续所有阶段（设计/开发/测试/审查）的对齐成本大幅降低。

---

## 做得不好的地方

### 1. E2 Epic 实现与 spec 不符，触发返工

Dev 完成 E2 JSON 预览功能后，Reviewer 发现：
- **原实现**：modal 接收 raw `componentNodes` 直接传给 `JsonRenderPreview` 渲染 canvas 组件
- **问题**：无法展示 pageId/pageName/componentCount 等页面级元数据
- **根因**：spec 要求 `{ pages: [{pageId, pageName, componentCount, components}] }` 结构，但实现时偏离了 spec

**结果**：需要重构 `JsonTreePreviewModal`，改为 `groups: ComponentGroup[]` → `buildPagesData()` → spec JSON 结构，并新增 7 个单元测试。**教训**：实现前应先跑通 spec 中的数据流（输入→转换→输出），而不是先实现再对标 spec。

### 2. E2E 测试 selector 缺失导致首轮 Review 被拒

第一轮 Reviewer（E1）发现：`data-testid="json-preview-button"` 在 ComponentTree.tsx 中缺失，导致 E2E 测试找不到按钮。**结果**：Review 被标记 `rejected`，需要修复 selector 后重新提交。**教训**：涉及 UI 交互的功能，selector 的 `data-testid` 应在开发阶段同步写入代码，而非事后补。

### 3. CHANGELOG.md 出现孤儿 header

Review 过程中发现 CHANGELOG.md 有孤儿 header（没有内容跟随的章节标题），说明 CHANGELOG 写入流程缺少格式校验。**教训**：CHANGELOG 条目应在 commit hook 或 CI 中做格式检查（header 后面必须有内容），避免积累格式问题。

---

## 技术决策记录

### TD-1：pageId 复用 flowId，而非引入独立 Page 概念

| 属性 | 值 |
|------|-----|
| 决策 | `pageId = flowId`，不复用独立的 Page 实体 |
| 理由 | 方案 A 成本最低（~3h vs 8h），风险可控；flowId 已唯一标识一个业务流，复用为 pageId 无需引入新实体 |
| 结果 | ✅ 实现顺利，向后兼容，无破坏性变更 |

### TD-2：pageName 作为可选字段，优先于 BusinessFlowNode.name

| 属性 | 值 |
|------|-----|
| 决策 | `pageName?: string` 为可选，getPageLabel 优先级：`pageName > BusinessFlowNode.name > fallback` |
| 理由 | 用户可能需要覆盖默认名称（如 AI 生成名称不准确），但大多数场景用默认值即可；可选字段确保向后兼容 |
| 结果 | ✅ 35 个单元测试全部通过，无回归 |

### TD-3：JSON 预览数据从 groupByFlowId 输出构建，而非直接渲染 componentNodes

| 属性 | 值 |
|------|-----|
| 决策 | JSON modal 使用 `buildPagesData(groups)` 将 `ComponentGroup[]` 转换为 `{ pages: [...] }` 结构 |
| 理由 | 页面级元数据（pageId/pageName/componentCount）存在于 group 层面，而非单个 component 层面 |
| 结果 | ⚠️ 首次实现错误，用了 JsonRenderPreview 直接渲染；重构后正确 |
| 教训 | 数据转换函数的输入输出应在实现前明确定义并测试 |

### TD-4：通用组件组 pageId='__common__'，置顶展示

| 属性 | 值 |
|------|-----|
| 决策 | flowId ∈ {mock, manual, common, __ungrouped__, ''} 的组件归入 `__common__` 组，label='🔧 通用组件' |
| 理由 | 复用现有 `inferIsCommon()` 逻辑，避免引入新的分组规则 |
| 结果 | ✅ 已在历史 commit (fc8162d3) 中验证，鲁棒 |

---

## 关键教训

### 教训 1：实现前先画数据流，不要先写代码再对齐 spec

E2 Epic 返工的根本原因是：开发时没有先明确"输入是什么 → 转换函数做什么 → 输出是什么"。`buildPagesData()` 这个转换函数的接口和实现是在重构阶段才补上的，而非一开始就设计好的。

**行动项**：implementation-plan 阶段应明确写出每个函数的签名、输入、输出及边界情况，并作为开发前的 checkpoint。

### 教训 2：UI 交互功能的 `data-testid` 应在开发阶段同步写入，而非事后补

Review 流程发现 selector 缺失，说明开发阶段没有对照 E2E 测试用例检查实现。`data-testid` 是沟通前端实现和 E2E 测试的桥梁，两者应同步。

**行动项**：开发任务领取时，同步确认 E2E 测试所需的 selector 列表；实现时在对应位置写入 `data-testid`。

### 教训 3：方案选择时，实际工时往往比预期高，保守估算留 buffer

Architect 估算方案 A ~3h，PM 估算 4.5h，实际执行也接近 4.5h。分析师和 PM 的估算更接近实际，说明多角色交叉估算能提高准确性。

**行动项**：多角色（Architect + PM + Dev Lead）联合估算，作为基准；实现过程记录实际工时，反哺后续估算模型。

---

## 状态

- 项目状态：✅ 已完成
- 完成日期：2026-04-12
- Epic 数：3
- 单元测试：35/35 pass
- E2E 测试：修复后全部 pass
- 关键返工：E2 JSON preview 重构 1 次
- 最终 commits：`60cd1ac4`、`02c735f1`、`906e4e13`、`f76e62ad`
