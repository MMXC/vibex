# 经验教训：Dev 视角 — 构建修复 + 提案收集（2026-04-11）

**项目**: `vibex-dev-proposals-vibex-build-fixes-20260411`
**角色**: Dev
**分析视角**: 执行者 + 提案撰写人
**日期**: 2026-04-11
**关联项目**: `vibex-architect-proposals-vibex-build-fixes-20260411`（Epic2 CI 防护层）

---

## 📋 项目概述

**任务一**：Dev 视角提案收集（提案输出角色）
- 输出完整的 proposal.md（含两个 P0 构建错误的技术分析）
- 包含额外发现的 4 个技术债（P0-P3 优先级分类）
- 配套 architecture.md、feature-list.md、IMPLEMENTATION_PLAN.md

**任务二**：Epic 1 构建修复（执行角色）
- P0-1: 删除孤立 `CanvasHeader.stories.tsx`（前端）
- P0-2: 替换 Unicode 弯引号为 ASCII 引号（后端 × 3 文件）
- 验证前后端 `pnpm build` 通过
- git commit + push

**总工时**: 提案 ~20min，执行 ~15min

---

## ✅ 做得好的地方

### 1. 先检查工作区再动手（节省了重复劳动）

Dev 提案在执行前通过 `git diff` 发现后端 Unicode 弯引号已经**在工作区被修复**（未 commit），直接跳过了"发现问题→修复→验证"的第一步。这节省了约 5 分钟，也避免了重复 sed 操作。

**模式固化**: 执行任何修复前，先运行 `git status` 和 `git diff` 确认工作区状态。

### 2. 提案包含完整的时间线根因链路

提案对 `CanvasHeader.stories.tsx` 绘制了 3 个 commit 的链路：
```
de829cd5 → 引入组件 + Story
d0557ab0 → feat/e2-code-cleanup 分支删除组件（从未合 main）
79ebe010 → revert 只恢复了 Story，没恢复组件
```

有了这条链路，执行者**无需再次调查**，直接执行删除命令即可。根因清晰 = 修复决策快。

### 3. feature-list 依赖关系图防止误序执行

```bash
F1.1 → F1.5  # 先删文件
F1.2 → F1.5  # 先修引号
F1.3 → F1.5  # 验证通过后才能提交
F1.4 → F1.5
```

虽然这个项目只有 4 个并行步骤，但依赖图防止了"先 commit 未验证的修复"这种错误。**工时再短也画依赖图**。

### 4. 风险矩阵中覆盖了"构建缓存"风险

提案中的一条风险：
> 风险：构建缓存导致验证不准确 | 可能性：中 | 影响：低 | 缓解：清除 `.next` / `.turbo`

这条被大多数紧急修复提案忽略，但它是**真实风险**。dev 本地 `.next` 缓存可能导致修复看似有效，但 CI 仍然失败。

### 5. 提案格式克制（P0 场景正确选择轻量级）

Dev 提案的 proposal.md 控制在了合理篇幅：
- 问题描述 + 错误日志截取
- 根因时间线（3 行）
- 修复 diff（几行 bash/diff）
- 风险矩阵（3 行）
- 验收标准（ checkbox 列表）

**没有过度工程化**。15 分钟的修复不需要 200 行 PRD。

### 6. 额外发现没有原地开坑（隐性自律）

提案在执行构建修复过程中额外发现了 4 个问题（OOM、TODO、Snapshot、confirmDialogStore）。Dev 提案**没有试图在这次紧急修复中一并解决**，而是按优先级分类并留作 follow-up。

**这是执行者最重要的自律**。紧急修复最怕扩大化，最后两个问题都没修好。

---

## ⚠️ 需要改进的地方

### 1. 缺少构建通过的硬证据

提案的验收标准写了 `pnpm build` 退出码 = 0，但没有记录**实际构建日志尾部**作为证据。

**改进**: 执行后追加一行：
```bash
date && cd vibex-fronted && pnpm build 2>&1 | tail -10
# 输出：Build completed successfully in 45.2s
git log --oneline -1 # 记录 commit hash
```

这样事后审查时不需要重新运行构建，直接看文档即可。

### 2. 提案末尾混入额外发现使范围模糊

proposal.md 的后半部分（P0-P3 的 4 个额外问题）**不是本次项目的 scope**。Reviewer 阅读时容易混淆："这是要我修的吗？" 提案末尾应该加：

```markdown
---
> **范围说明**: 以上 Epic 1 两个修复（CanvasHeader + 弯引号）为本次执行范围。
> Epic 2（CI 防护）、问题 3-6 作为 follow-up 项目另开提案。
```

### 3. CI 防护层没有绑定到同一项目

Architect 提案设计了 CI TypeScript Gate + ESLint 规则 + pre-commit hook，Tester 提案输出了完整的 CI 配置。但这些**没有绑定到同一个项目编号**（Epic 2 属于 `vibex-architect-proposals-vibex-build-fixes-20260411`，与执行项目分离）。

结果是：Epic 1 修完了，Epic 2 没有实际部署，防护层悬空。

**改进**: 紧急修复提案应在末尾包含一个 P1 任务：
> P1: 将 CI 防护（TypeScript Gate + Unicode 检测）部署到主分支 → 绑定执行

### 4. IMPLEMENTATION_PLAN.md 缺少"实际执行记录"

IMPLEMENTATION_PLAN.md 写的是**计划**，没有记录**执行结果**。如果 reviewer 想确认执行质量，只能看 git log。

**改进**: 执行完成后追加执行记录块：
```markdown
## 执行记录

| 时间 | 操作 | 结果 | 确认人 |
|------|------|------|--------|
| 03:20 | 删除 CanvasHeader.stories.tsx | ✅ | dev |
| 03:22 | 确认弯引号已替换 | ✅ | dev |
| 03:25 | 前端构建 | ✅ 45s | dev |
| 03:26 | 后端构建 | ✅ 32s | dev |
| 03:28 | git push | ✅ 378f8a56 | dev |
```

### 5. "Dev 提案收集"的角色混淆

这个项目的特殊之处在于：**Dev 同时是提案撰写者和执行者**。大多数项目中 Dev 只接收提案执行，但这里 Dev 输出了提案分析。

这带来一个问题：提案中的风险矩阵和验收标准是 Dev 自己写的，执行时可能缺乏"第三方验证"视角（自己测自己的代码）。

**改进**: 如果 Dev 负责提案，建议至少由 Reviewer 角色做一次独立的验收确认，或者 Dev 自己写 test-run.md 留档。

---

## 🔁 可复用的模式

### 模式 1：工作区优先检查（执行前必做）

```bash
# 执行任何修复前
git status        # 看有没有未提交的相关改动
git diff          # 确认改动内容
git log -3 --oneline  # 确认当前 HEAD 状态
```

这一步骤应该在 Dev 的 AGENTS.md 中固化，而非每次靠自觉。

### 模式 2：P0 修复的最小提案格式

适用于：构建阻断、工时 < 30min、修复明确

```
proposal.md 结构：
├── 问题N: [标题]
│   ├── 问题描述（错误日志截取）
│   ├── 根因时间线（2-3 个 commit）
│   ├── 技术修复方案（diff）
│   ├── 实施步骤（3 步以内）
│   └── 验收标准（ checkbox）
├── 综合实施计划（表格）
├── 风险矩阵（3-4 行）
└── 评审结论 + 执行决策
```

**总篇幅**: 1-2 页，避免过度文档化。

### 模式 3：构建缓存清除 SOP

```bash
# 构建验证前强制清除缓存
rm -rf .next .turbo node_modules/.cache
# 再运行构建
pnpm build
```

这个 SOP 应固化到每个构建修复项目的 feature-list 中，而不是每次靠 dev 自觉。

### 模式 4：Scope 边界标注（防止扩大化）

在提案的"评审结论"段落后加：

```markdown
---
**本次 scope**: [精确列出执行内容]
**非 scope（follow-up）**: [列出本次发现但未解决的问题]
```

### 模式 5：构建验证截图/日志留档

```bash
# 构建成功后截图（如果 CLI）
pnpm build 2>&1 | grep -E "(success|error|warn|✓|✗)" | tee build-log.txt
git add build-log.txt && git commit --amend --no-edit
```

**关键**: 验收证据必须留档，不能只靠"当时跑了没问题"。

---

## 🚫 下次避免的坑

### 坑 1：Feature branch 删除代码后"悬空"

`feat/e2-code-cleanup` 分支删除了 `CanvasHeader` 组件但从未合 main，导致 revert 回来的 Story 文件孤零零挂在仓库里。

**避免**:
- 删除文件/组件前：**必须检查 main 分支是否有其他引用方**
- 命令：`grep -r "CanvasHeader" --include="*.ts" --include="*.tsx" --include="*.stories.tsx"`
- GitHub PR 规则：删除公共文件的 PR 必须有 reviewer 确认无下游依赖

### 坑 2：弯引号被 IDE/输入法静默替换

开发者用 macOS + VSCode 默认设置，打字时 `'` 自动变成 `'`（弯引号），TypeScript 编译时才发现。**开发者完全不知道自己改了什么**。

**避免**:
- IDE 设置：`"typescript.preferences.autoImportFileSuffixes"` 避免干扰
- `.editorconfig`：`quote_type = single` 配合 ESLint
- pre-commit hook（见可复用模式）强制检测 U+2018-U+201F

### 坑 3：构建验证靠本地缓存（假通过）

dev 本地 `.next` 缓存了旧构建产物，删了 story 文件后旧缓存可能还在"假装构建成功"。CI 真实构建时才发现问题。

**避免**:
- 每次验证前**强制清除缓存**：`rm -rf .next .turbo`
- CI 配置 `CI=true pnpm build` 强制完整构建
- 或者使用 Docker 容器做**干净环境构建验证**

### 坑 4：紧急修复后防护层悬空

修完 P0 bug → 庆祝 → 切任务 → CI 防护没部署 → 同样的 bug 再次出现 → 再紧急修复。

**避免**:
- 每个紧急修复项目**必须附带一个 P1 follow-up**：CI 防护/自动化检测
- PR description 标注 `[needs-follow-up: <描述>]` 标签
- Coord 在 `coord-completed` 阶段检查：本次修复是否需要追加 CI 防护？

### 坑 5：提案与执行是同一个人（缺乏交叉验证）

Dev 写提案 → Dev 执行 → Dev 确认通过。缺少"第二双眼睛"验证。

**避免**:
- 提案阶段引入 Reviewer 角色做"提案 review"
- 或者执行阶段让 Reviewer 做"执行验收"
- 即使是紧急项目，也保持至少一个跨角色确认节点

---

## 📊 Dev 角色自评

| 维度 | 评分 | 说明 |
|------|------|------|
| 提案质量 | ⭐⭐⭐⭐ | 根因清晰，修复明确，克制不扩大 |
| 执行效率 | ⭐⭐⭐⭐⭐ | 15min 完成，无返工 |
| 证据留档 | ⭐⭐ | 缺少真实构建日志截图 |
| 范围管理 | ⭐⭐⭐ | 额外发现正确归类，但混在提案里 |
| 防护跟进 | ⭐⭐ | CI 防护层未绑定到同一项目执行 |
| **综合** | **⭐⭐⭐⭐** | **执行快且准，但证据意识和防护绑定需加强** |

---

## 📎 关联文件索引

- Dev 提案: `docs/vibex-dev-proposals-vibex-build-fixes-20260411/proposal.md`
- Architect 提案（Epic2 CI 防护）: `docs/vibex-architect-proposals-vibex-build-fixes-20260411/`
- Analyst 提案: `docs/vibex-analyst-proposals-vibex-build-fixes-20260411/`
- 已有经验教训: `.learning/vibex-build-fixes-20260411-lessons.md`（团队综合视角）
