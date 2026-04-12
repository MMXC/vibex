# 经验教训：VibeX 紧急构建修复（2026-04-11）

**项目**: vibex-build-fixes-20260411
**类型**: 紧急 P0 构建修复
**日期**: 2026-04-11
**问题数量**: 2 个 P0（前端孤立 Story + 后端 Unicode 弯引号）
**总工时**: ~15 分钟（实际执行）

---

## 📋 项目概述

两个 P0 构建错误同时阻断前后端构建：

| # | 影响范围 | 根因 | 修复方案 |
|---|---------|------|---------|
| P0-1 | `vibex-fronted` | `CanvasHeader.stories.tsx` 引用已删除的组件（`feat/e2-code-cleanup` 分支删除但从未合入 main） | 删除孤立 Story 文件 |
| P0-2 | `vibex-backend` × 3 | `agents/pages/prototype-snapshots` 三个 route.ts 使用 Unicode 弯引号 `'''` 而非标准单引号 | sed 替换为标准引号 |

---

## ✅ 做得好的地方

### 1. 根因链路追溯完整（Analyst 提案）

Analyst 提案对 CanvasHeader 问题绘制了完整的时间线链路：
```
de829cd5 → 引入组件 + Story
d0557ab0 → feat/e2-code-cleanup 分支删除组件（但未合 main）
79ebe010 → revert 阶段只恢复了 Story 文件，组件未恢复
```

这使得 dev 执行时无需再次调查，直接定位到删除命令。**根因追溯是快速修复的前提。**

### 2. 工作区已有修复 diff（Dev 提案）

后端 Unicode 弯引号问题在工作区已处于 "已修复未提交" 状态。Dev 提案准确识别了这一点（`git diff 显示弯引号已替换`），避免了重复劳动。这说明**构建前先检查工作区状态**是好的习惯。

### 3. 风险矩阵结构化（Analyst 提案）

提案包含 4 条风险的：可能性 / 影响 / 缓解方案 评估，虽然最后 3 条风险均为 "低" 可能性，但这种结构化思维确保了不遗漏潜在问题。

### 4. Tester 提案的 CI 防护建议超预期

Tester 提案输出了：
- Python Unicode 弯引号扫描脚本
- ESLint 规则增强配置
- pre-commit hook 脚本（bash + Python）
- GitHub Actions CI Pipeline 配置
- 自动化测试脚本 `test-build-fixes.sh`

这些不只是 "修复这个 bug"，而是建立了**防止同类问题再次发生的防护网**。这是 Tester 角色的最佳实践。

### 5. PM Epic 规划结构清晰

PM 的 feature-list.md 以表格形式呈现，每个 feature 有：ID / 功能点 / 根因关联 / 工时估算，且包含依赖关系图和验收条件。**15 分钟的小项目依然保持完整结构**，说明流程不是负担而是保障。

### 6. 快速闭环

从发现构建失败 → Analyst 分析 → Dev 执行 → Tester 验证 → PM 归档，总工时约 15 分钟。多角色并行工作，无需人工协调，体现了 AI Agent 团队的快速响应能力。

---

## ⚠️ 需要改进的地方

### 1. Tester 角色缺少独立验证

Tester 提案的 `analysis.md` 中写道："**状态**: ⚠️ 无提案可分析"。Tester 没有独立输出测试验证计划，只是依赖其他角色的验收标准。

**改进**: 即使是紧急修复，Tester 也应输出至少一个 `test-run.md` 或测试清单，验证构建实际通过（不仅是假设通过）。

### 2. 提案扩散（Reviewer 提案超范围）

Reviewer 提案从最初的两个构建错误（P0-1、P0-2）扩展到 6 个问题（增加了 OOM/TODO/Snapshot/confirmDialogStore API），且均为新的技术债。

**改进**: 紧急修复阶段应严格限定范围。Reviewer 提案可以将额外发现的问题作为 **follow-up 项目** 另开提案，而不是混入当前提案。

### 3. PM 提案交付延迟

PM 提案在 `vibex-pm-proposals-vibex-build-fixes-20260411` 目录中，但 dev 执行时 PM 提案尚未完成。说明 PM 没有与 dev 同步启动。

**改进**: 紧急项目应要求 PM 在 Analyst 提案完成后立即启动，无需等待其他角色。

### 4. 修复后未验证真实构建通过

从文档记录看，implementation plan 的验收条件是 `pnpm build` 退出码 = 0，但没有记录实际运行结果。**缺少构建通过的真实日志**作为证据。

**改进**: 执行后应保留 `date && pnpm build 2>&1 | tail -5` 的输出作为验收记录。

### 5. pre-commit hook 方案未落地

Tester 提案输出了完整的 pre-commit hook 和 CI 配置，但这些防护措施在本次项目中没有被实际部署。

**改进**: 即使紧急修复，也要将 CI 防护纳入同一 PR 或标记为 P1 跟进任务，不能只修 bug 不修流程。

---

## 🔁 可复用的模式

### 模式 1：Lightweight 构建修复 SOP

适用于：P0/P1 构建错误，工时 < 1h

```
1. Analyst: 15min 内完成根因分析 + 风险矩阵 + 2-3 行修复命令
2. Dev: 直接执行修复命令 + git commit/push
3. Tester: 保留构建通过日志作为验收证据
4. PM: 完成 feature-list 归档
```

**关键**: 不需要完整 PRD、不需要 architecture 文档、不需要设计评审。

### 模式 2：Unicode 弯引号自动化检测

Tester 提案中的 Python 脚本高度可复用：

```python
# 检测 .ts/.tsx 文件中的 Unicode 弯引号
python3 -c "
import glob, sys
for f in glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True):
    with open(f, 'rb') as fh:
        content = fh.read().decode('utf-8', errors='replace')
        for i, line in enumerate(content.split('\n'), 1):
            for ch in line:
                if 0x2018 <= ord(ch) <= 0x201F:
                    print(f'{f}:{i} U+{ord(ch):04X}')
                    sys.exit(1)
print('PASS')
"
```

**建议**: 将此脚本固化到项目中（如 `scripts/check-unicode-quotes.py`），作为 pre-commit hook 的一部分。

### 模式 3：孤立 Story 文件检测

定期检查 Story 文件是否引用了不存在的组件：

```bash
# 扫描所有 .stories.tsx 文件的 import 路径
for story in $(find vibex-fronted/src -name "*.stories.tsx"); do
  imports=$(grep -oP "from '\.\./[^']+'" "$story" | sed "s|from '||g;s|'||g")
  for imp in $imports; do
    resolved=$(realpath "$(dirname "$story")/$imp" 2>/dev/null)
    [ -f "$resolved" ] || echo "ORPHAN: $story → $imp"
  done
done
```

### 模式 4：Git 分支健康度检查

在 CI 中增加分支状态检查，防止未合并的 feature branch 删除关键代码：

```bash
# 检查是否有分支删除了其他分支引用的文件
git log --all --oneline --name-status | grep "^D" | while read _ file; do
  grep -r "$file" . --include="*.ts" --include="*.tsx" | grep -v "^Binary" && \
    echo "WARNING: $file deleted but still referenced"
done
```

### 模式 5：紧急修复的最小化提案格式

Analyst 提案控制在 1 页内，包含：
- 问题描述（错误日志截取）
- 根因时间线（2-3 个 commit）
- 修复命令（3 行 bash）
- 风险矩阵（3-4 行）
- 验收标准（5 项 checkboxes）

这种格式适合 P0 阻塞的紧急场景。

---

## 🚫 下次避免的坑

### 坑 1：Feature Branch 删除代码未同步

**根因**: `feat/e2-code-cleanup` 分支删除了 `CanvasHeader` 组件，但这个分支从未合并到 main。同时，其他分支 revert 了删除操作但只恢复了部分文件。

**避免方法**:
- Feature branch 删除组件/文件前，必须检查 main 分支是否有依赖方
- 或者使用 **分支删除前哨检查**：删除前 `grep -r "ComponentName" --include="*.ts" --include="*.tsx"`，确认无引用
- 更好的做法：**git branch 策略** 要求 feature 分支在合并前必须 rebase onto main，避免 "stale branch 删除，main 仍引用" 的孤岛效应

### 坑 2：macOS/输入法自动替换弯引号

**根因**: 开发者使用 macOS 默认输入法或某些编辑器，会自动将 ASCII 单引号 `'` 替换为 Unicode 弯引号 `'` `'`。

**避免方法**:
- IDE 设置中**禁用智能引号/弯引号自动替换**
- ESLint 配置 `quotes: ["error", "single", { "avoidEscape": true }]` 并开启 `prettier` 的 `singleQuote` 选项
- pre-commit hook 扫描 U+2018-U+201F 范围的 Unicode 字符
- CI 增加 Unicode 检测 job（见模式 2）

### 坑 3：构建错误只在 CI 或手动运行时暴露

**根因**: dev 本地可能有缓存（`.next` / `.turbo`），掩盖了真实构建状态。

**避免方法**:
- 修复后**清除构建缓存**再验证：`rm -rf .next .turbo node_modules/.cache`
- CI 配置应使用 `CI=true` 强制完整构建
- **每次 PR 前在干净环境中运行一次全量构建**

### 坑 4：问题根因是历史积压（静默腐化）

**根因**: CanvasHeader.stories.tsx 是个遗留问题，可能是数周前引入的，但一直没有构建检查所以没暴露。

**避免方法**:
- **主分支保护规则**强制 `pnpm build` 通过才能 merge
- 定期运行全量构建（建议在 CI 中每夜构建 `nightly build`）
- 新增功能时，同步检查相关 story 文件是否仍然有效

### 坑 5：紧急修复后立即忘记

**根因**: 15 分钟修完构建错误，团队快速切换到下一个任务，忘记了需要建立防护机制。

**避免方法**:
- **每个紧急修复必须产出 follow-up 任务**：如 "增加 Unicode 检测 pre-commit hook"
- 在 PR description 中添加 `[prevent-regression]` 标签，标记需要后续处理的项目
- Coord 在 `coord-completed` 阶段应主动检查：本次修复是否需要追加 CI 防护？

---

## 📊 团队评分

| 角色 | 评分 | 说明 |
|------|------|------|
| Analyst | ⭐⭐⭐⭐⭐ | 根因链路完整，风险矩阵结构化，提案格式简洁 |
| Dev | ⭐⭐⭐⭐⭐ | 快速定位工作区已有修复，准确执行，修复明确 |
| Reviewer | ⭐⭐⭐ | 防护建议完整，但提案超范围（混入技术债）|
| Tester | ⭐⭐⭐ | CI 防护方案超预期，但缺少独立验证执行记录 |
| PM | ⭐⭐⭐⭐ | feature-list 结构清晰，但提案交付稍晚 |
| **整体** | ⭐⭐⭐⭐ | **快速闭环，但防护落地不足** |

---

## 📎 关键文件索引

- 构建错误日志: `docs/vibex-build-fixes-20260411/BUILD_ERRORS.md`
- Analyst 提案: `docs/vibex-analyst-proposals-vibex-build-fixes-20260411/proposal.md`
- Dev 提案: `docs/vibex-dev-proposals-vibex-build-fixes-20260411/proposal.md`
- Tester 提案: `docs/vibex-tester-proposals-vibex-build-fixes-20260411/proposal.md`
- PM 提案: `docs/vibex-pm-proposals-vibex-build-fixes-20260411/proposal.md`
- 相关 Git commits: `378f8c56`, `f8743472`, `56bea5b6`, `78df3d5b`
