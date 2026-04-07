# VibeX Reviewer 提案 — Sprint 3 审查质量提升

**项目**: vibex-reviewer-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: PM
**状态**: 已完成

---

## 1. Executive Summary

### 1.1 背景

VibeX 当前处于 Sprint 3，审查流程已建立基础（E1-E4），但仍存在以下核心痛点：

| 痛点 | 影响 | 现状 |
|------|------|------|
| **CHANGELOG 分散** | Epic3 经历 4 轮审查驳回 | Frontend 有 2 个位置（根目录 Markdown + App 页面），Backend 有独立文件 |
| **eslint-disable 滥用** | 质量门禁被系统性绕过 | 16+ 处 disable 分散各处，无复查机制 |
| **审查报告无索引** | 历史问题无法追溯，重复驳回 | `reports/` 目录缺少 INDEX.md |
| **Dev 自查机制缺失** | 每次提交平均 2-3 轮审查来回 | CHANGELOG 遗漏等可预检问题未在提交前拦截 |

### 1.2 目标

通过轻量规范（方案 A）解决 Sprint 3 的审查效率问题：

1. **统一 CHANGELOG 路径规范**：消除路径歧义，减少重复驳回
2. **建立 Dev 自查机制**：在提交前拦截可预检问题，减少审查来回
3. **规范化 Reviewer 驳回格式**：每条驳回附带具体修复命令，减少沟通轮次
4. **建立报告索引机制**：让历史审查结论可快速定位

### 1.3 成功指标

| 指标 | 当前基线 | Sprint 3 目标 |
|------|---------|--------------|
| CHANGELOG 相关驳回次数 | Epic3 已驳回 4 轮 | 新 Epic 驳回次数 ≤ 1 轮 |
| 平均审查轮次 | 2-3 轮/Epic | ≤ 1.5 轮/Epic |
| 驳回包含修复命令比例 | 0% | 100% |
| reports/INDEX.md 覆盖率 | 0%（不存在） | 100%（历史报告全部索引） |

### 1.4 范围决策

**本期实施（方案 A，Sprint 3）**：
- E1: CHANGELOG 规范写入 AGENTS.md
- E2: Pre-submit 自查脚本开发
- E3: Reviewer 驳回命令模板
- E4: reports/INDEX.md 创建

**下期规划（方案 B，Sprint 4）**：
- E5: Git Hooks 强制（commit-msg + pre-commit）
- E6: ESLint disable 豁免记录 + 定期复查

---

## 2. Epic Breakdown

---

### E1: CHANGELOG 规范落地

**目标**: 在 AGENTS.md 中明确 CHANGELOG 路径规范，消除路径歧义导致的重复驳回

#### Stories

| 字段 | 内容 |
|------|------|
| **Story** | E1-S1: AGENTS.md CHANGELOG 规范章节编写 |
| **功能点** | 在 `vibex-fronted/AGENTS.md` 和 `vibex-backend/AGENTS.md` 中增加 CHANGELOG 规范章节，包含：路径规则（Frontend 只维护根目录 `CHANGELOG.md`，App 页面 `src/app/changelog/page.tsx` 为自动渲染禁止手动修改；Backend 只维护 `vibex-backend/CHANGELOG.md`）、更新时机（每个 Epic 结束时必须更新）、格式规范（参考 CHANGELOG_CONVENTION.md）、Reviewer Constraints 检查项 |
| **验收标准** | `expect(ag agents.md).toContain('CHANGELOG 规范')`<br>`expect(ag agents.md).toContain('src/app/changelog/page.tsx')`<br>`expect(ag agents.md).toContain('禁止手动修改 App 页面')`<br>`expect(ag agents.md).toContain('Reviewer Constraints')`<br>`expect(ag agents.md).toContain('CHANGELOG.md 已更新')` |
| **页面集成** | 无 |
| **工时** | 1h |
| **依赖** | 无 |

| 字段 | 内容 |
|------|------|
| **Story** | E1-S2: CHANGELOG_CONVENTION.md 格式规范文档 |
| **功能点** | 创建 `vibex-fronted/CHANGELOG_CONVENTION.md`，定义标准更新格式：Epic 维度记录（Epic 名称、日期、变更摘要）、变更类型标签（feat/fix/refactor/docs/test/chore）、Commit ID 关联（可选）、示例模板 |
| **验收标准** | `expect(fs.existsSync('CHANGELOG_CONVENTION.md')).toBe(true)`<br>`expect(conv.md).toContain('Epic')`<br>`expect(conv.md).toContain('feat/fix/refactor')`<br>`expect(conv.md).toContain('示例')` |
| **页面集成** | 无 |
| **工时** | 1h |
| **依赖** | E1-S1 |

| 字段 | 内容 |
|------|------|
| **Story** | E1-S3: Backend AGENTS.md CHANGELOG 规范同步 |
| **功能点** | 在 `vibex-backend/AGENTS.md` 中同步 CHANGELOG 规范，明确 Backend 项目只维护 `vibex-backend/CHANGELOG.md`，不接受其他位置的 CHANGELOG 记录 |
| **验收标准** | `expect(backend agents.md).toContain('CHANGELOG 规范')`<br>`expect(backend agents.md).toContain('vibex-backend/CHANGELOG.md')` |
| **页面集成** | 无 |
| **工时** | 0.5h |
| **依赖** | E1-S1 |

**E1 估算工时: 2.5h**

---

### E2: Pre-submit 自查脚本开发

**目标**: 提供本地预检脚本，在提交前拦截 CHANGELOG 遗漏、TypeScript 编译失败、ESLint 错误等可预检问题

#### Stories

| 字段 | 内容 |
|------|------|
| **Story** | E2-S1: Pre-submit 检查脚本核心功能 |
| **功能点** | 创建 `scripts/pre-submit-check.sh`：CHANGELOG.md 内容检查（包含 Epic/feat/fix/refactor 关键词）、TypeScript 类型检查（`npx tsc --noEmit`）、ESLint 检查（`npx eslint ./src --max-warnings=0`）、脚本以非零退出码报告失败、chmod +x 可执行权限 |
| **验收标准** | `expect(fs.existsSync('scripts/pre-submit-check.sh')).toBe(true)`<br>`expect(isExecutable('scripts/pre-submit-check.sh')).toBe(true)`<br>`expect(script).toContain('tsc --noEmit')`<br>`expect(script).toContain('eslint')`<br>`expect(script).toContain('CHANGELOG.md')` |
| **页面集成** | 无 |
| **工时** | 2h |
| **依赖** | E1-S1 |

| 字段 | 内容 |
|------|------|
| **Story** | E2-S2: eslint-disable 数量监控 |
| **功能点** | 在 pre-submit 脚本中增加 eslint-disable 数量统计，设定阈值警告（默认阈值 20，可通过环境变量 ESLINT_DISABLE_THRESHOLD 覆盖），超过阈值输出 ⚠️ 警告但不阻断提交 |
| **验收标准** | `expect(script).toContain('eslint-disable')`<br>`expect(script).toContain('ESLINT_DISABLE_THRESHOLD')`<br>`expect(script).toContain('grep -rn')` |
| **页面集成** | 无 |
| **工时** | 1h |
| **依赖** | E2-S1 |

| 字段 | 内容 |
|------|------|
| **Story** | E2-S3: CI 集成 pre-submit 检查 |
| **功能点** | 在 GitHub Actions CI 流程中集成 pre-submit-check.sh（作为附加检查，失败时警告但不阻断主流程，或作为 blocking 检查提升质量门禁），更新 CI 配置文件 |
| **验收标准** | `expect(ci config).toContain('pre-submit-check.sh')`<br>`expect(ci config).toContain('scripts/')` |
| **页面集成** | 无 |
| **工时** | 1h |
| **依赖** | E2-S1 |

**E2 估算工时: 4h**

---

### E3: Reviewer 驳回命令模板

**目标**: 规范化 Reviewer 驳回格式，每条驳回必须包含具体修复命令，减少 Dev 沟通轮次

#### Stories

| 字段 | 内容 |
|------|------|
| **Story** | E3-S1: AGENTS.md 驳回模板定义 |
| **功能点** | 在 AGENTS.md 中定义标准化驳回模板格式：问题描述（❌ 审查驳回: <问题>）、文件位置（📍 文件: <路径>）、修复命令（🔧 修复命令: <具体命令>）、参考章节（📋 参考: AGENTS.md §<章节>）、示例片段（3 个示例） |
| **验收标准** | `expect(ag agents.md).toContain('❌ 审查驳回')`<br>`expect(ag agents.md).toContain('🔧 修复命令')`<br>`expect(ag agents.md).toContain('示例')`<br>`expect(ag agents.md).toContain('模板')` |
| **页面集成** | 无 |
| **工时** | 1h |
| **依赖** | E1-S1 |

| 字段 | 内容 |
|------|------|
| **Story** | E3-S2: reports/INDEX.md 创建与初始索引 |
| **功能点** | 创建 `vibex-fronted/reports/INDEX.md`，包含报告索引格式（报告名、日期、Epic 关联、摘要、链接）、历史报告条目（至少包含 Sprint 1-2 的历史报告）、索引维护规范（新增报告必须更新 INDEX.md）、自动追加指南（可选的 CI 自动化方案） |
| **验收标准** | `expect(fs.existsSync('reports/INDEX.md')).toBe(true)`<br>`expect(index.md).toContain('报告索引')`<br>`expect(index.md).toContain('格式规范')`<br>`expect(index.md).toContain('新增报告必须更新 INDEX')` |
| **页面集成** | 无 |
| **工时** | 2h |
| **依赖** | 无 |

| 字段 | 内容 |
|------|------|
| **Story** | E3-S3: 审查报告 CI 自动追加机制（可选增强） |
| **功能点** | 探索在 CI 中自动追加审查通过报告到 INDEX.md（通过脚本在 PR merge 后追加记录），或提供手动维护指南作为主方案 |
| **验收标准** | `expect(index auto script).toBeDefined() OR expect(ag agents.md).toContain('手动维护指南')` |
| **页面集成** | 无 |
| **工时** | 1h（若自动化不可行则降为 0.5h 维护指南） |
| **依赖** | E3-S2 |

**E3 估算工时: 4h**

---

### E4: 文档整理与团队宣贯

**目标**: 整理所有新增文档，确保团队成员知晓并能够使用新规范

#### Stories

| 字段 | 内容 |
|------|------|
| **Story** | E4-S1: 新规范宣贯与 README 更新 |
| **功能点** | 更新 `vibex-fronted/README.md`，增加 Reviewer 工作流章节（CHANGELOG 规范、驳回模板引用、pre-submit 脚本使用说明）；在 Slack 频道通知团队新规范上线 |
| **验收标准** | `expect(readme.md).toContain('Reviewer 工作流')`<br>`expect(readme.md).toContain('pre-submit-check.sh')`<br>`expect(readme.md).toContain('CHANGELOG 规范')` |
| **页面集成** | 无 |
| **工时** | 0.5h |
| **依赖** | E1-S1, E2-S1, E3-S1 |

**E4 估算工时: 0.5h**

---

### E5: Git Hooks 强制（规划，Sprint 4）

**目标**: 通过 Git hooks 强制执行 CHANGELOG 检查和代码质量检查

| 字段 | 内容 |
|------|------|
| **Story** | E5-S1: commit-msg hook 安装与验证（规划） |
| **功能点** | 安装 husky + commitlint，验证 commit message 格式 `feat/fix/refactor: <描述> (E<n>-S<n>)`，验证 CHANGELOG.md 在变更列表中 |
| **验收标准** | `expect(husky installed).toBe(true)`<br>`expect(commit-msg hook).toBeDefined()` |
| **工时** | 2h（规划） |
| **依赖** | Sprint 3 完成 |

| 字段 | 内容 |
|------|------|
| **Story** | E5-S2: pre-commit hook 安装与验证（规划） |
| **功能点** | 在 pre-commit hook 中运行 `npm run lint` + `npx tsc --noEmit`，失败时阻断 commit |
| **验收标准** | `expect(pre-commit hook).toContain('tsc --noEmit')`<br>`expect(pre-commit hook).toContain('eslint')` |
| **工时** | 3h（规划） |
| **依赖** | E5-S1 |

**E5 估算工时: 5h（规划）**

---

### E6: ESLint disable 豁免治理（规划，Sprint 4）

**目标**: 系统性治理 eslint-disable 滥用，建立豁免记录和定期复查机制

| 字段 | 内容 |
|------|------|
| **Story** | E6-S1: 现有 eslint-disable 分类与记录（规划） |
| **功能点** | 扫描全量 eslint-disable 注释，分类为合理保留/需修复，创建 `ESLINT_DISABLES.md` 记录所有豁免及理由，设定复查周期（每 Sprint 审查一次） |
| **验收标准** | `expect(eslint disables.md).toBeDefined()`<br>`expect(fs.readdirSync('src/').length).toBeGreaterThan(0)` |
| **工时** | 8h（规划） |
| **依赖** | Sprint 3 完成 |

**E6 估算工时: 8h（规划）**

---

## 3. 验收标准汇总表

| ID | Story | 验收标准 | 优先级 |
|----|-------|---------|--------|
| E1-S1 | AGENTS.md CHANGELOG 规范章节编写 | `expect(ag agents.md).toContain('CHANGELOG 规范')` 等 5 条 | P0 |
| E1-S2 | CHANGELOG_CONVENTION.md 格式规范文档 | `expect(fs.existsSync('CHANGELOG_CONVENTION.md')).toBe(true)` 等 4 条 | P0 |
| E1-S3 | Backend AGENTS.md CHANGELOG 规范同步 | `expect(backend agents.md).toContain('CHANGELOG 规范')` 等 2 条 | P0 |
| E2-S1 | Pre-submit 检查脚本核心功能 | `expect(fs.existsSync('scripts/pre-submit-check.sh')).toBe(true)` 等 5 条 | P0 |
| E2-S2 | eslint-disable 数量监控 | `expect(script).toContain('eslint-disable')` 等 3 条 | P1 |
| E2-S3 | CI 集成 pre-submit 检查 | `expect(ci config).toContain('pre-submit-check.sh')` 等 2 条 | P1 |
| E3-S1 | AGENTS.md 驳回模板定义 | `expect(ag agents.md).toContain('❌ 审查驳回')` 等 4 条 | P0 |
| E3-S2 | reports/INDEX.md 创建与初始索引 | `expect(fs.existsSync('reports/INDEX.md')).toBe(true)` 等 4 条 | P1 |
| E3-S3 | 审查报告 CI 自动追加机制 | `expect(index auto script).toBeDefined()` 或维护指南 | P2 |
| E4-S1 | 新规范宣贯与 README 更新 | `expect(readme.md).toContain('Reviewer 工作流')` 等 3 条 | P1 |

---

## 4. Definition of Done (DoD)

### 4.1 Sprint 3 交付完成标准

每个 Story 完成后，必须满足：

1. **代码完成**
   - [ ] 相关文件已创建/修改并提交到分支
   - [ ] `pre-submit-check.sh` 脚本可执行（`chmod +x`）
   - [ ] CI 配置已更新

2. **验收标准通过**
   - [ ] 所有 `expect()` 断言对应的检查通过
   - [ ] Pre-submit 脚本在本地运行无报错

3. **文档更新**
   - [ ] AGENTS.md 包含 CHANGELOG 规范章节（E1-S1）
   - [ ] AGENTS.md 包含驳回模板（E3-S1）
   - [ ] CHANGELOG_CONVENTION.md 已创建（E1-S2）
   - [ ] README.md 已更新（E4-S1）

4. **团队知晓**
   - [ ] 新规范已在 Slack 频道通知

### 4.2 Epic 完成标准

| Epic | 完成标准 |
|------|---------|
| E1 | `vibex-fronted/AGENTS.md` 和 `vibex-backend/AGENTS.md` 均包含 CHANGELOG 规范，`CHANGELOG_CONVENTION.md` 已创建 |
| E2 | `scripts/pre-submit-check.sh` 可执行且 CI 已集成 |
| E3 | AGENTS.md 包含驳回模板，`reports/INDEX.md` 已创建且包含历史报告索引 |
| E4 | README.md 已更新，团队已收到通知 |

---

## 5. Non-Functional Requirements

| 维度 | 要求 |
|------|------|
| **性能** | Pre-submit 脚本执行时间 ≤ 120s（包含 tsc + eslint 全量检查） |
| **可靠性** | Pre-submit 脚本所有检查命令必须使用绝对路径或 `npx` 调用，避免环境依赖 |
| **可维护性** | 所有文档（AGENTS.md, CHANGELOG_CONVENTION.md, ESLINT_DISABLES.md）使用 Markdown 格式，便于版本管理和搜索 |
| **可逆性** | CI 中的 pre-submit 检查最初以 warning 模式运行（不阻断），稳定后升为 blocking |
| **兼容性** | Pre-submit 脚本兼容 bash（Linux/macOS），不依赖 zsh 特有功能 |
| **可发现性** | 所有规范文档在 AGENTS.md 目录页有入口链接 |

---

## 6. Implementation Constraints

| 约束 | 描述 |
|------|------|
| **C1: 不破坏现有流程** | 新增规范不得使现有开发流程倒退，不强制要求 Dev 在所有 commit 前运行脚本（CI 作为主要保障） |
| **C2: 历史问题不追溯** | 新规范仅约束新 Epic，历史 Epic（Epic1-Epic3）按原规范执行，不要求补全 CHANGELOG |
| **C3: Frontend/Backend 分隔** | Frontend 和 Backend 各自维护自己的 AGENTS.md 和 CHANGELOG，不得混用 |
| **C4: 脚本零外部依赖** | pre-submit-check.sh 只依赖系统已有工具（bash, grep, git, npm/npx），不引入额外依赖 |
| **C5: CI 失败不阻断发布** | Sprint 3 阶段 CI pre-submit 检查结果仅警告，不阻断 PR merge；Sprint 4 评估后决定是否升为 blocking |
| **C6: 规范冲突解决** | 若 AGENTS.md 与其他文档冲突，以 AGENTS.md 为准（团队宪章） |

---

## 7. 工时汇总

| Epic | Story | 工时 |
|------|-------|------|
| E1 | E1-S1 AGENTS.md CHANGELOG 规范章节编写 | 1h |
| E1 | E1-S2 CHANGELOG_CONVENTION.md 格式规范文档 | 1h |
| E1 | E1-S3 Backend AGENTS.md CHANGELOG 规范同步 | 0.5h |
| **E1 合计** | | **2.5h** |
| E2 | E2-S1 Pre-submit 检查脚本核心功能 | 2h |
| E2 | E2-S2 eslint-disable 数量监控 | 1h |
| E2 | E2-S3 CI 集成 pre-submit 检查 | 1h |
| **E2 合计** | | **4h** |
| E3 | E3-S1 AGENTS.md 驳回模板定义 | 1h |
| E3 | E3-S2 reports/INDEX.md 创建与初始索引 | 2h |
| E3 | E3-S3 审查报告 CI 自动追加机制 | 1h |
| **E3 合计** | | **4h** |
| E4 | E4-S1 新规范宣贯与 README 更新 | 0.5h |
| **E4 合计** | | **0.5h** |
| **Sprint 3 总计** | | **11h** |
| E5（规划） | E5-S1 commit-msg hook | 2h |
| E5（规划） | E5-S2 pre-commit hook | 3h |
| **E5 规划** | | **5h** |
| E6（规划） | E6-S1 eslint-disable 豁免记录 | 8h |
| **Sprint 4 规划** | | **13h** |
| **项目总计（含规划）** | | **~24h** |

---

## 8. MoSCoW 优先级

| 分类 | Stories |
|------|---------|
| **Must（Sprint 3）** | E1-S1, E1-S2, E1-S3, E2-S1, E3-S1, E3-S2 |
| **Should（Sprint 3）** | E2-S2, E2-S3, E4-S1 |
| **Could（Sprint 3）** | E3-S3 |
| **Won't（移至 Sprint 4）** | E5-S1, E5-S2, E6-S1 |

---

## 9. 依赖关系图

```
E1-S1 ──┬── E1-S2 ──┐
        └── E1-S3 ──┤
                    │
E2-S1 ──┬── E2-S2 ──┤
        └── E2-S3 ──┤
                    │
E3-S1 ──┬── E3-S2 ──┬── E3-S3
        │           │
        └── E4-S1 ──┘
```

---

*本文档由 PM Agent 生成，基于 Analyst 分析报告（vibex-reviewer-proposals-20260403_024652/analysis.md）*
