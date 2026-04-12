# 经验教训：Reviewer 视角 — 构建修复提案 + PR 合入标准 + CI 防护体系（2026-04-11）

**项目**: `vibex-reviewer-proposals-vibex-build-fixes-20260411`
**角色**: Reviewer
**分析视角**: Reviewer 提案撰写人 + PR 合入标准制定者 + CI 防护体系设计者
**日期**: 2026-04-11
**关联项目**: `vibex-dev-proposals-vibex-build-fixes-20260411`（Epic 1 执行）, `vibex-architect-proposals-vibex-build-fixes-20260411`（Epic 2 CI 防护）, `vibex-tester-proposals-vibex-build-fixes-20260411`（Epic 2 QA 验证）

---

## 📋 项目概述

**任务一**：Reviewer 视角提案（提案输出角色）
- 分析了两个阻塞性构建失败（前端 Story 孤立文件 + 后端 Unicode 弯引号）
- 输出了完整的 `proposal.md`（代码审查要点 + 修复方案 + 预防规则）
- 配套产出了 `PR_MERGE_CRITERIA.md`（PR 合入标准 v1.0）

**任务二**：CI 防护体系设计（提案输出角色）
- 4 条预防规则（Story 孤立检查 + Unicode 检测 + CI Storybook 构建 + TypeScript Gate）
- 3 层质量门禁体系（自动化 CI → 人工 Review → 长期质量）
- Epic 2（PR 合入标准文档化）+ Epic 3（CI/ESLint 预防规则）+ Epic 4（质量门禁）

**总工时**: 纯提案输出，未执行（implementation/ 目录为空）

---

## ✅ 做得好的地方

### 1. `PR_MERGE_CRITERIA.md` 是本次最实用的产出物

Reviewer 提案的核心贡献不是技术修复方案（那是 Dev 的活），而是将构建修复的**隐性经验显性化为可执行清单**。

`PR_MERGE_CRITERIA.md` 的结构值得固化：
- **检查项 + 命令 + 退出码** 三要素并列（reviewer 不需要猜"通过标准是什么"）
- 驳回标准 P0/P1/P2 分级（让 author 知道优先级，不混淆）
- OOM 警告单独标注（`NODE_OPTIONS: "--max-old-space-size=4096"`）在检查项注释里

这个文档的价值在于：**新人 onboarding 之后直接读这个文件，不需要问任何人就能知道"什么能合，什么不能合"**。

**模式固化**: Reviewer 角色的每个提案都必须配套 `PR_MERGE_CRITERIA.md`，格式固定为：检查项（表格）+ 驳回标准（分级）+ Commit 规范（示例）。

### 2. 代码审查要点做到了"根因 → 触发条件 → 修复方案"三层结构

Reviewer 对每个问题的分析都包含：

```
问题描述（现状代码片段）
    ↓ 根因分析（是什么导致）
审查要点（检查项表格）
    ↓ 修复方案（方案A vs 方案B + 理由）
```

这个结构对执行者（Dev）非常友好——Reviewer 的分析就是 Dev 的实施指南，执行者不需要再做二次判断。

**模式固化**: Reviewer 提案的问题分析统一采用三层结构：描述（带代码片段）→ 根因（带触发条件）→ 方案（带 A/B 选项和推荐意见）。

### 3. 预防规则的可执行性高于平均水准

Reviewer 提案的 4 条预防规则不只说"应该做什么"，还提供了**可直接运行的脚本和 CI 配置片段**：

- Story 孤立检查：`glob` + `existsSync` 的 TypeScript 脚本
- Unicode 检测：`grep -rPl` + 字符范围 `$'[\xE2\x80\x98-\xE2\x80\x99]'`
- pre-commit hook：`#!/bin/bash` 完整脚本
- Storybook CI：`build-storybook` job YAML

这些脚本的共同特点：**零配置，复制过来直接能用**。不需要阅读理解，直接 `cat` 进 CI 配置。

### 4. 两阶段 Epic 依赖关系最清晰（相比 Dev/Architect/Tester 提案）

```
Epic 1（15min）: 构建修复 → 先执行（解除阻塞）
Epic 2（1h）: PR 合入标准 → 可与 Epic 1 并行
Epic 3（4h）: CI/ESLint 预防规则 → 依赖 Epic 1 完成
Epic 4（2h）: 质量门禁体系 → 依赖 Epic 3 完成
```

Reviewer 的 Epic 划分相比 Dev 提案（只有 Epic 1）更完整，相比 Tester 提案（Epic 2 无执行者）更清晰——每个 Epic 都有明确的边界和前置条件。

### 5. 分层质量门禁（CI → Reviewer → 长期）设计合理

| 层级 | 机制 | 强制力 |
|------|------|--------|
| CI 自动化 | TypeScript + ESLint + Unicode 扫描 | ✅ 强制，CI 失败即阻断 |
| Code Review | 人工审查引号一致性、Import 路径准确性 | ⚠️ 依赖 Reviewer 认真程度 |
| 长期质量 | Prettier + EditorConfig + husky | ❌ 非强制，依赖团队纪律 |

这个分层的价值在于：**明确哪些是机器保证的，哪些是人工保证的**。Reviewer 提案没有把所有规则都扔给 CI（那是 Architect 的活），也没有全部依赖人工（那是不可靠的）。

---

## ⚠️ 需要改进的地方

### 1. proposal.md 缺少根因时间线（不如 Dev 提案深入）

Reviewer 对 `CanvasHeader.stories.tsx` 的分析停留在"组件不存在"层面，没有像 Dev 提案那样绘制 3 个 commit 的链路：
```
de829cd5 → 引入组件 + Story
d0557ab0 → feat/e2-code-cleanup 删除组件（从未合 main）
79ebe010 → revert 只恢复了 Story，没恢复组件
```

这条链路对 Coord 决策和 Coord 审查非常重要——它解释了"为什么会发生"，而不只是"发生了什么"。Reviewer 作为审查者，应该比执行者更清楚问题的历史渊源。

**改进**: Reviewer 提案的问题分析必须包含根因时间线（commit hash + 操作描述），即使只是一两行。这让后续的跨项目分析（learnings）有据可查。

### 2. Epic 2/3/4 没有指定执行者，防护体系最终悬空

| Epic | 主题 | 工时 | 执行者 |
|------|------|------|--------|
| Epic 1 | 构建修复 | 15min | dev（已确认）|
| Epic 2 | PR 合入标准文档化 | 1h | ❓ |
| Epic 3 | CI/ESLint 预防规则 | 4h | ❓ |
| Epic 4 | 质量门禁体系 | 2h | ❓ |

`PR_MERGE_CRITERIA.md` 已经写完了（Epic 2 的核心产出），但其他两个 Epic 的**脚本需要有人去部署**。结果是：Reviewer 提案质量很高，但 CI 防护层没有真正落地。

**改进**: Reviewer 提案在 plan 阶段必须明确每个 Epic 的执行角色。对于 CI 防护类 Epic（Epic 3/4），应明确标注"绑定 dev 执行"或"绑定 architect 执行"，而不是留给 Coord 自己去猜。

### 3. PR 合入标准文档化后没有强制机制

`PR_MERGE_CRITERIA.md` 写得很好，但没有回答一个关键问题：**谁来检查这些标准是否被执行？**

Reviewer 提案本身是给 Coord/Analyst 看的，但实际合入检查是 CI 自动化的职责。如果 CI 没有配置这些检查项，`PR_MERGE_CRITERIA.md` 就只是一份文档，而不是门禁。

**改进**: `PR_MERGE_CRITERIA.md` 的每个检查项必须附带 CI 配置状态：
```markdown
| TypeScript 编译 | `tsc --noEmit` | ✅ CI 已配置 |
| ESLint 检查 | `eslint src` | ❌ CI 未配置 |
```

这样 Coord 和 Reviewer 可以一眼看出哪些标准有 CI 保证，哪些是纯人工检查。

### 4. 审查规则（4 条）有脚本但没有"谁来部署"的承诺

Reviewer 提案输出了：
- Story 孤立组件检查脚本（`check-stories.ts`）
- pre-commit hook 脚本（`check-curly-quotes.sh`）
- Storybook CI job YAML

但这些脚本**躺在 proposal.md 里，没有人去部署到仓库**。Dev 修复完 Epic 1 就去干别的了，Architect 的 CI 防护提案是另一套脚本，Tester 的 QA 验证提案也有自己的 CI YAML——**三套脚本，三个提案，没有一个落地**。

**改进**: Reviewer 提案应包含一个 "Deployment Plan" 段落，明确：
1. 每个脚本/配置的部署位置（文件路径）
2. 部署由谁执行（Epic 3/4 的执行者）
3. 部署后的验证步骤

### 5. PR 合入标准中的"安全检查"部分偏弱

`PR_MERGE_CRITERIA.md` 的安全检查只有 3 个子项：
- 无敏感信息（`no-console` ESLint）
- 依赖安全（`npm audit`）
- 认证安全（middleware 检查）

但 Reviewer 提案本身的"审查要点"里提到的**弯引号**和**孤立 Story 文件**这两个问题，在 PR 合入标准里**没有对应的强制检查项**。这两个是导致本次构建失败的根本原因，但 PR 合入标准没有明确说"提交前必须跑 Unicode 扫描"。

**改进**: PR 合入标准必须覆盖本次事故的**所有根因**。检查项表应该加一行：
```markdown
| Unicode 弯引号扫描 | `grep -rPl $'[弯引号]' --include='*.ts'` | 0 | 无 Unicode 弯引号 |
```

---

## 🔁 可复用的模式

### 模式 1：`PR_MERGE_CRITERIA.md` 标准格式

```
# PR 合入标准 v1.0

## 1. 构建检查（必须通过）
| 检查项 | 命令 | 退出码 | 说明 |
|------|------|--------|------|
| ... | ... | 0 | ... |

## 2. 代码质量
...

## 3. 安全检查
...

## 4. 提交流程
...

## 5. Review Checklist（Reviewer 用）
| # | 检查项 | 通过标准 |
|---|--------|----------|
| ... | ... | ... |

## 6. 驳回标准（Reviewer 触发）
| 触发条件 | 严重程度 | 动作 |
|----------|----------|------|
| ... | P0 | 立即驳回 |
```

**适用范围**: 所有涉及多角色协作的项目。Reviewer 角色必须为每个项目产出这个文件。

### 模式 2：审查要点三层结构

```
问题N: [标题]
├── 现状（代码片段截取）
├── 根因分析（commit 链路或触发条件）
├── 审查要点（检查项表格）
│   ├── 检查项 | 说明
│   └── ...
└── 修复方案
    ├── 方案A（推荐）: 具体命令/diff
    └── 方案B: 备选方案 + 适用条件
```

**适用范围**: Reviewer 的所有提案。确保每个问题都有代码证据、根本原因、可执行方案。

### 模式 3：CI 脚本即文档（可直接复制的脚本片段）

Reviewer 提案的 Unicode 检测脚本和 pre-commit hook 都是 **heredoc-ready**——可以直接 `cat << 'EOF' > script.sh` 使用。

**模式固化**: Reviewer 提案中的所有脚本必须满足：
1. 硬编码目标路径（或接受 `$1` 参数）
2. 带有 `#!/bin/bash` 或 `#!/usr/bin/env node` shebang
3. 包含使用说明（`# Usage: check-curly-quotes.sh`）

### 模式 4：三层质量门禁（CI 自动化 → Reviewer 人工 → 长期机制）

```
自动化 CI 门禁（机器保证）→ 人工 Code Review（人保证）→ 长期质量机制（制度保证）
```

这个分层让 Coord 可以快速判断"哪个层级出了问题"：CI 红 → Dev 负责；Reviewer 漏过 → Reviewer 负责；长期机制缺失 → Architect 负责。

**适用范围**: 所有涉及代码质量的 Reviewer 提案。

### 模式 5：Epic 依赖链（Fix → Guard → Monitor）

```
Epic 1: 紧急修复（先执行，解除阻塞）
Epic 2: 文档化与标准化（可并行，快速产出）
Epic 3: 预防规则（依赖 Epic 1，CI 脚本部署）
Epic 4: 质量门禁（依赖 Epic 3，全链路验证）
```

**适用范围**: 所有 P0/P1 构建修复项目。这个模式比"修复完就结束"更能防止同类问题再次发生。

---

## 🚫 下次避免的坑

### 坑 1：PR 合入标准文档化后 CI 没有配套（虚假安全）

`PR_MERGE_CRITERIA.md` 写得完整，但 CI 配置里没有跑这些检查。Dev 合 PR 时只看"构建通过了"（`pnpm build`），不知道还有一整套人工 Review 检查项。

结果是：**PR 合入标准是给 Reviewer 看的，不是给 CI 看的**。Reviewer 每次都要手工检查，效率低且容易遗漏。

**避免**:
- `PR_MERGE_CRITERIA.md` 必须标注每个检查项的 CI 覆盖状态
- CI 未覆盖的检查项，在 proposal 的 "Deployment Plan" 段落里必须有人认领部署
- Coord 在 `coord-completed` 阶段检查：提案中的 CI 防护脚本是否已部署？

### 坑 2：多角色输出多套 CI 脚本，最后没有一个落地

Reviewer 提案输出了 Story 孤立检查脚本，Architect 提案输出了 CI TypeScript Gate，Tester 提案输出了 GitHub Actions YAML。三套脚本分散在三个 `proposal.md` 里，没有统一合并。

结果是：每个提案的 CI 部分看起来都是"完整"的，但合并时发现脚本冲突、配置重复、路径不一致。

**避免**:
- Reviewer 提案的 CI 脚本只负责**检测逻辑**（输出 error），不负责 CI 配置细节（那是 Architect 的活）
- 或者在 `proposals-summary-xxx` 项目中统一合并所有 CI 脚本，再派发给 Architect 执行部署
- 原则：**检测逻辑（Reviewer/Tester）和部署配置（Architect/Dev）必须分离**

### 坑 3：审查要点停留在"建议"而非"规则"

Reviewer 提案的预防规则写了：
> "建议在 CI 中加入自动化检查"、"建议配置 pre-commit hook"

这种表述是**给 Architect 的建议，不是 Reviewer 的规则**。Reviewer 应该输出的是：

> "Epic 3 执行者必须在合入前将以下脚本部署到 CI：1. check-stories.ts 2. check-curly-quotes.sh"

**避免**: Reviewer 提案的预防规则必须包含 **"谁来部署"** 和 **"部署到哪里"**，而不是只写"建议配置"。

### 坑 4：PR 合入标准的"安全检查"没有覆盖本次事故根因

本次构建失败的两个根因（Unicode 弯引号 + 孤立 Story 文件）在 `PR_MERGE_CRITERIA.md` 的安全检查部分**完全没有体现**。安全检查只覆盖了传统意义上的安全问题（密钥、Token），忽略了**字符编码问题**这种"技术债类"风险。

**避免**: PR 合入标准的检查项必须覆盖**本次事故的所有根因**，不能只覆盖"传统意义上的安全"。每次构建失败的根因都应该转化为至少一个 CI 检查项。

### 坑 5：Reviewer 提案的 Epic 2/3/4 变成"文档自嗨"

Epic 2 的 `PR_MERGE_CRITERIA.md` 产出质量很高，但 Epic 3（CI 预防规则）和 Epic 4（质量门禁）停留在"写文档"阶段，**没有实际的 CI 脚本被部署**。结果是：Reviewer 提案在 plan 阶段列了 4 个 Epic，但实际只有 1.5 个被执行。

**避免**:
- 每个 Epic 必须有明确的**执行者和执行时间窗口**
- Epic 2（文档化）可以纯提案，但 Epic 3/4（脚本部署）必须走执行流程
- Coord 在派发任务时应将 Epic 3/4 单独派发给 Dev/Architect 执行，不应让 Reviewer 自己写完提案就算完成

---

## 📊 Reviewer 角色自评

| 维度 | 评分 | 说明 |
|------|------|------|
| 提案质量 | ⭐⭐⭐⭐⭐ | PR 合入标准完整，审查要点深入，预防规则可执行 |
| 根因分析 | ⭐⭐⭐ | 有审查要点但缺少 commit 时间线链路 |
| CI 脚本实用性 | ⭐⭐⭐⭐ | 脚本零配置可用，但分散在多套提案里未统一 |
| 执行绑定 | ⭐⭐ | Epic 3/4 无执行者，防护层悬空 |
| PR 合入标准落地 | ⭐⭐⭐ | 文档完整，但 CI 覆盖状态未标注 |
| Scope 管理 | ⭐⭐⭐⭐ | Epic 1/2/3/4 划分合理，边界清晰 |
| **综合** | **⭐⭐⭐⭐** | **提案质量高，但执行落地和 CI 部署断链** |

---

## 🎯 对 Coord 的建议

1. **Epic 3/4 必须正式派发**: `PR 合入标准文档化`（Epic 2）可以标记为提案产出，但 `CI 预防规则`（Epic 3）和 `质量门禁体系`（Epic 4）必须派发给 Dev/Architect 执行，不能让 Reviewer 提案只停在文档阶段。

2. **CI 脚本统一合并**: Reviewer + Architect + Tester 三个角色都输出了 CI 相关脚本，应该在 `proposals-summary-xxx` 项目中统一合并后再派发部署任务，避免三套脚本冲突。

3. **PR 合入标准的 CI 覆盖状态**: Coord 在审查 Reviewer 提案时，应要求 `PR_MERGE_CRITERIA.md` 中每个检查项标注 CI 状态（✅/❌），未覆盖的检查项必须分配执行者。

4. **Reviewer 提案必须包含根因时间线**: 建议 Reviewer 提案的 `proposal.md` 格式模板中强制包含"根因时间线"段落（commit hash + 操作），这样后续 learnings 才有据可查。

---

## 📎 关联文件索引

- Reviewer 提案: `docs/vibex-reviewer-proposals-vibex-build-fixes-20260411/proposal.md`
- PR 合入标准: `docs/vibex-reviewer-proposals-vibex-build-fixes-20260411/PR_MERGE_CRITERIA.md`
- Feature List: `docs/vibex-reviewer-proposals-vibex-build-fixes-20260411/plan/feature-list.md`
- Dev 经验教训: `.learning/vibex-dev-proposals-build-fixes-20260411-lessons.md`
- Tester 经验教训: `.learning/vibex-tester-proposals-build-fixes-20260411-lessons.md`
- Architect CI 防护: `docs/vibex-architect-proposals-vibex-build-fixes-20260411/`
- Team 综合经验: `.learning/vibex-build-fixes-20260411-lessons.md`
