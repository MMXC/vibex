# SPEC: E3 — Reviewer 驳回命令模板 & 报告索引

**项目**: vibex-reviewer-proposals-20260403_024652
**Epic**: E3: Reviewer 驳回命令模板 & 报告索引
**版本**: v1.0
**日期**: 2026-04-03
**状态**: 待开发

---

## 1. Epic 概述

### 1.1 目标
规范化 Reviewer 驳回格式（每条驳回附带具体修复命令），并建立审查报告索引机制（让历史审查结论可快速定位）。

### 1.2 背景问题
- Reviewer 驳回描述过于抽象，Dev 需要猜测修复方式
- `reports/` 目录无索引，历史问题难以追溯
- 同一问题重复驳回（如 CHANGELOG 问题在多个 Epic 中反复出现）

### 1.3 预期收益
- 每条驳回附带具体修复命令，减少 Dev 沟通轮次
- 审查报告有索引，Reviewer 和 Coord 可快速定位历史结论
- 减少重复驳同一个问题的概率

---

## 2. Stories

### E3-S1: AGENTS.md 驳回模板定义

**功能点**:
在 `vibex-fronted/AGENTS.md` 中定义标准化驳回模板格式：

1. **模板格式**
   ```markdown
   ## 审查驳回模板

   每条审查驳回必须包含以下字段：

   ❌ 审查驳回: <问题描述>
   📍 文件: <文件路径>
   🔧 修复命令: <具体命令>
   📋 参考: AGENTS.md §<章节>
   ```

2. **示例片段**（至少 3 个）

   **示例 1: CHANGELOG 遗漏**
   ```
   ❌ 审查驳回: CHANGELOG.md 未更新
   📍 文件: vibex-fronted/CHANGELOG.md
   🔧 修复命令: 在 CHANGELOG.md 中添加 Epic <名称> 条目，格式参考 CHANGELOG_CONVENTION.md
   📋 参考: AGENTS.md §CHANGELOG 规范
   ```

   **示例 2: TypeScript 类型错误**
   ```
   ❌ 审查驳回: TypeScript 编译失败，存在类型错误
   📍 文件: src/components/Example.tsx:15
   🔧 修复命令: npx tsc --noEmit 查看具体错误并修复
   📋 参考: AGENTS.md §TypeScript 规范
   ```

   **示例 3: ESLint 规则违反**
   ```
   ❌ 审查驳回: ESLint 检查失败，代码不符合 lint 规则
   📍 文件: src/utils/helper.ts:8
   🔧 修复命令: npx eslint ./src --fix 或手动修复指定行的规则违反
   📋 参考: AGENTS.md §ESLint 规范
   ```

3. **Reviewer 操作规范**
   - 每条驳回必须包含 `🔧 修复命令` 字段
   - 修复命令必须是**可直接执行**的具体命令，不是抽象描述
   - 示例引用必须实际存在于 AGENTS.md 中

**验收标准**:
```javascript
// E3-S1 验收测试
const fs = require('fs');
const agentsMd = fs.readFileSync('vibex-fronted/AGENTS.md', 'utf8');

expect(agentsMd).toContain('❌ 审查驳回');
expect(agentsMd).toContain('🔧 修复命令');
expect(agentsMd).toContain('📍 文件');
expect(agentsMd).toContain('📋 参考');
expect(agentsMd).toContain('示例');
expect(agentsMd).toContain('AGENTS.md §');
```

**工时**: 1h
**依赖**: E1-S1
**优先级**: P0

---

### E3-S2: reports/INDEX.md 创建与初始索引

**功能点**:
创建 `vibex-fronted/reports/INDEX.md`，包含：

1. **索引格式规范**
   ```markdown
   # VibeX 审查报告索引

   ## 维护规范
   - 新增审查报告后必须更新本索引
   - 每条索引包含：报告文件名、日期、Epic 关联、摘要、状态

   ## 索引格式
   | 报告文件名 | 日期 | Epic | 摘要 | 状态 |
   |-----------|------|------|------|------|
   ```

2. **历史报告条目**（至少包含 Sprint 1-2 的历史报告）
   - 从 `reports/` 目录扫描已有报告文件
   - 按时间倒序排列
   - 每条记录包含：文件名、日期、Epic 名称、审查结论摘要、状态（通过/需修改/已驳回）

3. **索引维护指南**
   - 新增报告的标准流程
   - 如何更新 INDEX.md
   - 冲突解决（手动编辑与 CI 自动追加的冲突处理）

4. **报告文件命名规范**
   - 格式：`review-<epic-name>-<date>.md`
   - 示例：`review-canvas-json-persistence-20260320.md`

**验收标准**:
```javascript
// E3-S2 验收测试
const fs = require('fs');
const indexPath = 'vibex-fronted/reports/INDEX.md';

expect(fs.existsSync(indexPath)).toBe(true);
const indexMd = fs.readFileSync(indexPath, 'utf8');

expect(indexMd).toContain('报告索引');
expect(indexMd).toContain('维护规范');
expect(indexMd).toContain('格式规范');
expect(indexMd).toContain('新增报告必须更新 INDEX');
expect(indexMd).toContain('审查结论');
expect(indexMd).toContain('Epic');

// 检查是否有历史报告条目（至少 1 条）
const lines = indexMd.split('\n').filter(l => l.includes('|') && l.includes('review-'));
expect(lines.length).toBeGreaterThan(0);
```

**工时**: 2h
**依赖**: 无
**优先级**: P1

---

### E3-S3: 审查报告 CI 自动追加机制

**功能点**:
探索在 CI 中自动追加审查通过报告到 INDEX.md：

1. **方案 A: CI 自动追加**
   - 在 PR merge workflow 中添加步骤
   - 脚本在 merge 后自动追加新记录到 INDEX.md
   - 风险：可能与手动编辑冲突

2. **方案 B: 手动维护指南（主方案）**
   - 提供明确的维护流程指南
   - 每次审查通过后，Reviewer 手动更新 INDEX.md
   - 降低复杂度，避免自动化冲突风险

3. **如果采用方案 A，脚本功能**：
   ```bash
   # scripts/update-report-index.sh
   REPORT_FILE=$1
   REPORT_DATE=$2
   EPIC_NAME=$3
   SUMMARY=$4
   
   # 使用 sed 或 awk 在 INDEX.md 表格末尾追加新行
   # 格式：| review-epic-xxx.md | YYYY-MM-DD | Epic名称 | 摘要 | 通过 |
   ```

**验收标准**:
```javascript
// E3-S3 验收测试
// 方案 B（主方案）验收
const fs = require('fs');
const indexMd = fs.readFileSync('vibex-fronted/reports/INDEX.md', 'utf8');

// 检查是否包含手动维护指南
expect(indexMd).toContain('手动维护') || expect(indexMd).toContain('维护指南') || expect(indexMd).toContain('新增报告必须更新');

// 或者方案 A（如果实现了自动化）
const autoScriptPath = 'vibex-fronted/scripts/update-report-index.sh';
if (fs.existsSync(autoScriptPath)) {
  const script = fs.readFileSync(autoScriptPath, 'utf8');
  expect(script).toContain('INDEX.md');
  expect(script).toContain('append') || expect(script).toContain('sed');
}
```

**工时**: 1h（若自动化不可行则降为 0.5h 维护指南）
**依赖**: E3-S2
**优先级**: P2

---

## 3. 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `vibex-fronted/AGENTS.md` | 修改 | 增加驳回模板章节 |
| `vibex-fronted/reports/INDEX.md` | 创建 | 报告索引文件 |
| `vibex-fronted/reports/` | 扫描 | 确认已有历史报告 |

---

## 4. 测试计划

| 测试 ID | 测试内容 | 预期结果 |
|---------|---------|---------|
| T-E3-01 | 读取 `AGENTS.md`，搜索驳回模板关键词 | 包含完整模板格式 |
| T-E3-02 | 检查 `AGENTS.md` 是否包含至少 3 个示例 | 包含多个示例片段 |
| T-E3-03 | 检查 `reports/INDEX.md` 是否存在 | 文件存在 |
| T-E3-04 | 检查 `INDEX.md` 是否包含历史报告条目 | 至少 1 条记录 |
| T-E3-05 | 检查 `INDEX.md` 是否包含维护规范 | 包含新增报告更新指南 |
| T-E3-06 | 检查 `INDEX.md` 格式是否符合命名规范 | 包含命名规范说明 |

---

## 5. DoD Checklist

- [ ] `vibex-fronted/AGENTS.md` 包含完整驳回模板（E3-S1）
- [ ] 驳回模板包含至少 3 个实际示例（E3-S1）
- [ ] `vibex-fronted/reports/INDEX.md` 已创建（E3-S2）
- [ ] `INDEX.md` 包含历史报告索引（E3-S2）
- [ ] `INDEX.md` 包含维护规范（E3-S2）
- [ ] 所有验收测试通过
