# 经验教训：vibex-canvas-button-audit-proposal

> **项目**: Canvas 页按钮审查与清理提案
> **时间**: 2026-04-10
> **阶段**: 提案阶段（analysis → prd → architecture → 6 Epic 执行）
> **概述**: 从两个 P0 Bug 扩展为 6 Epic 完整提案生命周期的经验沉淀
> **Sprint 结果**: Sprint 1 ✅ PASS | Sprint 2 ❌ REJECTED（E3 未完成）

---

## 📋 项目背景

**起点**: 两个 P0 Bug
1. Flow 树"继续→"按钮未绑定事件
2. Phase2 canvas 增强功能未集成上线

**演进结果**: 经 Analyst/Architect 分析，扩展为 6 Epic、4 Sprint 的系统性按钮清理：
- E1: Flow 树批量删除 undo 修复（P0）
- E2: TreeToolbar 三树语义统一（P1）
- E3: confirmDialogStore 统一确认弹窗（P2）
- E4: 重新生成按钮文案优化（P2）
- E5: 重置按钮语义明确化（P2）
- E6: ProjectBar 按钮收拢设计方案（P2）

---

## ✅ 做得好的地方

### 1. 文档链完整，流程严谨

**analyst → prd → architecture → implementation_plan** 四件套齐全，每个角色职责清晰。

特别值得肯定的：
- **analyst 阶段做了充分的 git history research**，引用了 3 轮历史审查结论（`canvas-button-cleanup`、`canvas-button-consolidation`、`tree-toolbar-consolidation`），避免了重复劳动
- **analyst 识别出了 14 处按钮重复实现**的根因，让后续开发有据可查
- **architect 阶段产出了 4 个 ADR**（Architecture Decision Record），每个决策都有上下文、决策、后果三段式，清晰可追溯

### 2. 按钮图谱方法论扎实

analyst 产出的 `analysis.md` 是本次提案的核心资产：
- **35 个按钮全覆盖**：ProjectBar(12) + TabBar(3) + TreeToolbar×3树(9) + LeftDrawer(2) + 其他(5)
- **每按钮都有位置/功能/来源 Epic/状态**：易于追踪历史决策
- **问题与按钮一一对应**：根因定位精准（如"P0: contextStore.deleteSelectedNodes 对 flow 分支只清空选择状态"）

### 3. 优先级矩阵清晰

| 问题 | RICE | 优先级 |
|------|------|--------|
| P0: Flow 删除 undo | 高 | Must Have |
| P1: 语义统一 | 高 | Must Have |
| P2: 清空二次确认 | 高 | Must Have |
| P3: 重新生成文案 | 中 | Should Have |
| P4: 重置语义明确 | 中 | Should Have |
| P5: ProjectBar 收拢 | 低 | Could Have |

**RICE 评分让优先级决策有据可依**，避免了"凭感觉排优先级"。

### 4. Sprint 拆分合理，DoD 可量化

每个 Sprint 有明确的成功标准和量化指标：

| Sprint | 目标 | 验收标准 |
|--------|------|----------|
| Sprint 1 | P0 + P1 | Flow 批量删除 undo 100% + Toolbar 文案三树统一 |
| Sprint 2 | P2 | confirmDialogStore 覆盖率 > 90%，无 window.confirm |
| Sprint 3 | P3 + P4 | tooltip 可见率 100% |
| Sprint 4 | P5 | 仅设计方案，不含实现 |

**可量化 DoD 比"完成某功能"更有利于验收**。

### 5. 架构决策质量高

ADR 格式的四项技术决策都很有价值：
- **ADR-001（统一 confirm 弹窗）**：避免多处 `window.confirm()` 行为不一致
- **ADR-002（Flow 批量删除修复）**：精确定位根因（一行代码遗漏）
- **ADR-003（语义统一规范）**：给出具体的文案替换对照表
- **ADR-004（ProjectBar 收拢）**：明确核心按钮 ≤5 个，次要按钮收拢

### 6. tester 报告质量极高

Epic 3 的 tester 报告堪称模板级：
- **逐项验证** 每个成功标准（SC1-SC5）
- **每项都有证据**（具体行号、实际代码片段、commit 文件列表）
- **区分 P0/P1/P2** 严重程度
- **附带修复方案**，不只说"不行"，还说"怎么改"

### 7. reviewer 审查流程高效

- Sprint 1 的 reviewer 审查在 tester 之前先跑了一遍，提前发现 CHANGELOG 未更新等问题
- reviewer 的 E1E2 报告简洁明了（✅/❌ 表格），便于 Coord 快速决策

### 8. E1/E2 代码质量高

dev 在 Sprint 1 的实现：
- 修改范围精准（只改 contextStore 一处，加一行 `useFlowStore.getState().deleteSelectedNodes()`）
- CHANGELOG 更新及时
- 测试覆盖充分（flowStore.test.ts 20/20 通过）

---

## ❌ 需要改进的地方

### 1. Sprint 2（E3）产出不完整：store 创建了但未接入使用方

**问题**: dev 创建了 `confirmDialogStore` 和 `ConfirmDialog` 组件，但：
- `ConfirmDialog` **未注册到 CanvasPage**（弹窗永远无法渲染）
- `componentStore.clearComponentCanvas` **未接入** confirmDialogStore（仍在用 `window.confirm`）
- `flowStore.resetFlowCanvas` **未接入**（直接删除，无确认）
- **多处 `window.confirm` 未替换**（TreeToolbar、ComponentTree、BoundedContextTree）

**根因**: IMPLEMENTATION_PLAN 中 Step 数量多（6 个 step 涉及 6 个不同文件），dev 可能按顺序做完前面的就交稿了，没有回查完整性。"新增"和"接入"是两个不同性质的动作，但被放在同一个 Epic 里。

**教训**: **"新增 + 修改"的实现，必须逐项核对清单，不能只数文件数量**。对于多点修改任务，应该分 Epic 而不是一个 Epic 包含太多分散修改点。

### 2. tester 在 E1 阶段发现测试缺口但未能推动修复

**问题**: E1 tester 报告明确指出 `deleteSelectedNodes` 的 undo 测试缺失，但 dev 没有在 phase2 补充测试就直接 push 了。reviewer 审查时也没有检查 tester FAIL 项就放行了。

**根因**: reviewer 的审查清单没有包含"测试完整性"检查项（只检查了"CHANGELOG 更新"和"测试通过"），所以遗漏了 tester 明确标记的 ❌ FAIL 项。

**教训**: **reviewer 审查清单必须包含 tester 报告中标记为 FAIL 的项目**，形成闭环。tester FAIL → reviewer 必须验证修复 → 通过后才能合并。

### 3. E3 commit 描述与实际代码不符

**问题**: commit message 声称 "flowStore.ts: deleteSelectedNodes now shows confirm dialog first"，但实际代码中没有 confirm 调用。

**教训**: commit message 应该如实描述变更内容，不能写"计划做什么"而要写"实际做了什么"。reviewer 应增加"commit message 与实际 diff 一致性"检查。

### 4. 多个 Epic 在同一 Sprint 内修改同一文件的不同区域

**问题**: E1（contextStore）、E2（TreeToolbar）、E3（componentStore/flowStore/TreeToolbar/BusinessFlowTree）都在同一 Sprint 内，涉及 6 个文件 10+ 处修改。这种高密度的分散修改增加了回归风险。

**教训**: **单 Sprint 修改文件数应控制在 3 个以内**，超过应拆 Sprint。

### 5. 测试覆盖不完整但用"总体通过"掩盖

**现象**: flowStore 20/20 测试通过，但关键场景 `deleteSelectedNodes` 的 undo 测试缺失。

**教训**: 核心功能的测试用例清单（必须项）应该在 PRD 或 IMPLEMENTATION_PLAN 中明确列出，reviewer 按清单逐一打勾，不能只看"通过率"。

### 6. 新 UI 组件创建后忘记注册

**现象**: `ConfirmDialog` 组件存在但未在 `CanvasPage.tsx` 中注册，永远不渲染。

**教训**: 新增 UI 组件必须有"在父组件中注册"的检查清单项，且 tester 验收时应检查该组件是否可见。

---

## 🔁 可复用的模式

### 1. ADR（Architecture Decision Record）模式

四件套中的 architecture.md 采用了 ADR 格式，每个技术决策包含：
- **状态**: Proposed / Accepted / Deprecated
- **上下文**: 为什么需要这个决策
- **决策**: 具体方案
- **后果**: 正面 + 负面

**适用场景**: 任何涉及技术选型、接口设计、规范变更的决策都应该写 ADR。

### 2. tester 报告模板

```
§N Epic 名称 — tester 验证报告
  ↓
成功标准逐项验证（SC1, SC2, ...）
  ↓
每项带证据（文件路径、行号、实际代码）
  ↓
区分严重程度（P0/P1/P2）
  ↓
结论 + 修复建议
```

**适用场景**: 所有 Epic 验收都应采用此格式。

### 3. 分析驱动扩展模式

```
P0 Bug 修复
  ↓ Analyst 分析（button atlas）
  ↓ 发现 6 个问题，扩展为 6 Epic
  ↓ Architect 架构设计（ADR）
  ↓ 拆 Sprint
```

**适用场景**: 小范围 Bug fix 上线后，应该做一次系统性的影响面扫描，看是否需要扩大修复范围。

### 4. Sprint 1 reviewer 预审

在 tester 测试之前，先由 reviewer 跑一遍代码质量检查，提前发现 CHANGELOG 等非功能性遗漏。

**适用场景**: 所有开发 Sprint 都应该加这个环节。

### 5. 按钮图谱方法论

将页面所有按钮按位置/功能/来源 Epic/状态分类，识别冗余和语义问题。

**适用场景**: 任何 UI 审查类提案都可以采用。

### 6. 根因精确到代码行

ADR-002 中将 P0 根因精确定位到 `contextStore.ts` 的一个空 if 分支，这种粒度的分析才能给出精准修复方案。

**适用场景**: Bug 修复类提案必须有根因代码定位。

---

## 🚫 下次避免的坑

### 坑 1: 创建新 store 但不接入使用方

**现象**: 新增了 `confirmDialogStore`，但使用方还是调用 `window.confirm()`。
**预防**: 
- IMPLEMENTATION_PLAN 中"新增"和"接入"作为两个独立 Epic
- 验收时必须运行 `grep -r "window.confirm" --include="*.ts" --include="*.tsx"` 确认所有旧调用已替换

### 坑 2: tester FAIL 但未修复就合并

**现象**: tester 报告明确标记了测试缺失，reviewer 审查时没有检查 tester FAIL 项就放行了。
**预防**: reviewer 审查清单中必须包含"tester 报告中的 FAIL 项是否已修复"，只有全部 PASS 才能合并。

### 坑 3: 单 Epic 包含大量分散文件修改

**现象**: E3 一个 Epic 要改 6 个文件，遗漏了 3 个。
**预防**: 
- 单 Epic 修改文件数 ≤ 3
- 超过拆 Epic
- IMPLEMENTATION_PLAN 每个 Step 后面加 ✅/❌ 验收状态标记

### 坑 4: commit message 描述与实际不符

**现象**: commit 写"接入了 confirmDialog"，实际没接入。
**预防**: 
- commit 前运行 `git diff --stat` 对照检查
- reviewer 增加"commit message 与实际 diff 一致性"检查

### 坑 5: 新 UI 组件创建后忘记注册

**现象**: `ConfirmDialog` 组件存在但未在 `CanvasPage.tsx` 中注册，永远不渲染。
**预防**: 
- AGENTS.md 中明确列出"注册步骤"
- tester 验收时检查该组件是否在父组件中注册并可见

### 坑 6: 测试覆盖不完整但用"总体通过"掩盖

**现象**: 整体测试通过率看起来不错，但关键场景缺少测试。
**预防**: 
- 核心功能的测试用例清单（必须项）在 IMPLEMENTATION_PLAN 中明确列出
- Reviewer 按清单逐一打勾，不能只看"通过率"

---

## 📊 项目数据汇总

| 维度 | 数据 |
|------|------|
| 项目周期 | 2026-04-10（单日） |
| Epic 总数 | 6 |
| Sprint 总数 | 4 |
| Sprint 1 结果 | ✅ PASS（E1 + E2）|
| Sprint 2 结果 | ❌ REJECTED（E3 未完成）|
| tester 报告数量 | 4 份（E1 + E2 合并 + E3 ConfirmDialog + E3 最终）|
| reviewer 报告数量 | 3 份 |
| 核心代码修改文件数 | ~8 个 |
| 新增 store | 1 个（confirmDialogStore）|
| 新增组件 | 1 个（ConfirmDialog）|
| 主要遗留问题 | E3 Epic 未完成，E4/E5/E6 未开发 |

---

## 💡 核心建议

1. **引入 Epic 粒度控制规则**: 单 Epic 修改文件 ≤ 3 个，超过拆 Epic
2. **reviewer 审查清单增加 tester FAIL 项检查**: 形成 tester → reviewer 闭环
3. **IMPLEMENTATION_PLAN 末尾增加"变更清单"**: 列出所有被修改的文件，提交前逐项打勾
4. **新增 UI 组件必须包含注册步骤**: 在 IMPLEMENTATION_PLAN 中明确要求
5. **E3 需要重新执行**: confirmDialogStore 的接入工作未完成，Sprint 2 需要返工
6. **核心功能测试清单前置**: 在 IMPLEMENTATION_PLAN 中明确列出必须覆盖的测试用例，不能只看通过率
