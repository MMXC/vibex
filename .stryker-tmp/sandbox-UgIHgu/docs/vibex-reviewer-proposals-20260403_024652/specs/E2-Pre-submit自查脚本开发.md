# SPEC: E2 — Pre-submit 自查脚本开发

**项目**: vibex-reviewer-proposals-20260403_024652
**Epic**: E2: Pre-submit 自查脚本开发
**版本**: v1.0
**日期**: 2026-04-03
**状态**: 待开发

---

## 1. Epic 概述

### 1.1 目标
提供本地预检脚本，在提交前拦截 CHANGELOG 遗漏、TypeScript 编译失败、ESLint 错误等可预检问题，减少 Reviewer 和 Dev 之间的来回次数。

### 1.2 背景问题
- CHANGELOG 遗漏、测试覆盖不足等低级问题未在提交前拦截
- 每个 Epic 平均经历 2-3 轮审查，Epic3 达 4+ 轮
- 主要是 CHANGELOG 遗漏导致重复驳回

### 1.3 预期收益
- Dev 在本地就能发现 CHANGELOG 问题，无需 Reviewer 提醒
- 预计减少 50%+ 的 CHANGELOG 相关驳回
- 平均审查轮次从 2-3 轮降至 ≤ 1.5 轮

---

## 2. Stories

### E2-S1: Pre-submit 检查脚本核心功能

**功能点**:
创建 `scripts/pre-submit-check.sh`，包含以下核心检查：

1. **CHANGELOG.md 内容检查**
   ```bash
   # 检查 vibex-fronted/CHANGELOG.md 是否包含 Epic/feat/fix/refactor 关键词
   if ! grep -qE "(Epic|feat|fix|refactor|docs|test|chore)" "$PROJECT_ROOT/CHANGELOG.md"; then
     echo "❌ CHANGELOG.md 未更新或格式不符"
     exit 1
   fi
   ```

2. **TypeScript 类型检查**
   ```bash
   npx tsc --noEmit || {
     echo "❌ TypeScript 编译失败"
     exit 1
   }
   ```

3. **ESLint 检查**
   ```bash
   npx eslint ./src --max-warnings=0 || {
     echo "❌ ESLint 检查失败"
     exit 1
   }
   ```

4. **脚本规范**
   - 使用 `set -e` 确保任何命令失败时脚本退出
   - 使用绝对路径或基于 `$PROJECT_ROOT` 的相对路径
   - 输出清晰的错误信息，指明哪个检查失败
   - 支持 `--skip-changelog` 参数跳过 CHANGELOG 检查（仅用于 WIP commit）

**验收标准**:
```javascript
// E2-S1 验收测试
const fs = require('fs');
const path = require('path');
const scriptPath = 'vibex-fronted/scripts/pre-submit-check.sh';

expect(fs.existsSync(scriptPath)).toBe(true);

// 检查文件可执行权限（Unix 系统）
const stats = fs.statSync(scriptPath);
const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
expect(isExecutable).toBe(true);

// 检查脚本内容包含核心检查命令
const script = fs.readFileSync(scriptPath, 'utf8');
expect(script).toContain('tsc --noEmit');
expect(script).toContain('eslint');
expect(script).toContain('CHANGELOG.md');
expect(script).toContain('Epic');
expect(script).toContain('exit 1');
expect(script).toContain('set -e');
```

**工时**: 2h
**依赖**: E1-S1（需要知道 CHANGELOG 检查关键词）
**优先级**: P0

---

### E2-S2: eslint-disable 数量监控

**功能点**:
在 pre-submit 脚本中增加 eslint-disable 数量监控：

1. **禁用注释统计**
   ```bash
   DISABLE_COUNT=$(grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx" | wc -l)
   THRESHOLD=${ESLINT_DISABLE_THRESHOLD:-20}
   if [ "$DISABLE_COUNT" -gt "$THRESHOLD" ]; then
     echo "⚠️  eslint-disable 数量过多 ($DISABLE_COUNT/$THRESHOLD)，请审查是否必要"
   fi
   ```

2. **环境变量配置**
   - `ESLINT_DISABLE_THRESHOLD`: 阈值配置，默认 20
   - 超过阈值仅警告，不阻断提交

3. **详细报告**（可选增强）
   - 超过阈值时列出所有 eslint-disable 位置
   - ```bash
     if [ "$DISABLE_COUNT" -gt "$THRESHOLD" ]; then
       echo "⚠️  eslint-disable 数量过多 ($DISABLE_COUNT/$THRESHOLD)"
       grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx"
     fi
     ```

**验收标准**:
```javascript
// E2-S2 验收测试
const script = fs.readFileSync('vibex-fronted/scripts/pre-submit-check.sh', 'utf8');

expect(script).toContain('eslint-disable');
expect(script).toContain('ESLINT_DISABLE_THRESHOLD');
expect(script).toContain('grep -rn');
expect(script).toContain('wc -l');
expect(script).toContain('THRESHOLD');
expect(script).toContain('⚠️');
```

**工时**: 1h
**依赖**: E2-S1
**优先级**: P1

---

### E2-S3: CI 集成 pre-submit 检查

**功能点**:
在 GitHub Actions CI 流程中集成 pre-submit-check.sh：

1. **CI 配置文件更新**
   - 在 `.github/workflows/` 的 CI 配置中添加步骤：
   ```yaml
   - name: Pre-submit checks
     run: |
       chmod +x scripts/pre-submit-check.sh
       ./scripts/pre-submit-check.sh
     continue-on-error: true  # Sprint 3 阶段不阻断，仅警告
   ```

2. **阶段说明**
   - Sprint 3: `continue-on-error: true`（警告模式，不阻断）
   - Sprint 4: 评估后决定是否升为 blocking

3. **独立 job**
   - 建议将 pre-submit 作为一个独立 job，失败时不影响其他 jobs
   ```yaml
   pre-submit:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - name: Setup Node
         uses: actions/setup-node@v4
         with:
           node-version: '20'
           cache: 'npm'
       - run: npm ci
       - run: chmod +x scripts/pre-submit-check.sh && ./scripts/pre-submit-check.sh
         continue-on-error: true
   ```

**验收标准**:
```javascript
// E2-S3 验收测试
const fs = require('fs');
const ciFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/test.yml',
  '.github/workflows/checks.yml'
];

const found = ciFiles.find(f => {
  if (!fs.existsSync(f)) return false;
  const content = fs.readFileSync(f, 'utf8');
  return content.includes('pre-submit-check.sh');
});

expect(found).toBeDefined();
expect(fs.readFileSync(found, 'utf8')).toContain('pre-submit-check.sh');
```

**工时**: 1h
**依赖**: E2-S1
**优先级**: P1

---

## 3. 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `vibex-fronted/scripts/pre-submit-check.sh` | 创建 | Pre-submit 检查脚本 |
| `.github/workflows/ci.yml` 或类似 | 修改 | CI 集成 pre-submit 检查 |

---

## 4. 测试计划

| 测试 ID | 测试内容 | 预期结果 |
|---------|---------|---------|
| T-E2-01 | 检查 `scripts/pre-submit-check.sh` 是否存在 | 文件存在 |
| T-E2-02 | 检查脚本是否可执行（chmod +x） | 权限正确 |
| T-E2-03 | 检查脚本是否包含 `tsc --noEmit` | 包含 TypeScript 检查 |
| T-E2-04 | 检查脚本是否包含 eslint 检查 | 包含 ESLint 检查 |
| T-E2-05 | 检查脚本是否包含 CHANGELOG.md 检查 | 包含 CHANGELOG 检查 |
| T-E2-06 | 检查脚本是否包含 eslint-disable 统计 | 包含禁用注释统计 |
| T-E2-07 | 检查脚本是否支持 `ESLINT_DISABLE_THRESHOLD` 环境变量 | 支持可配置阈值 |
| T-E2-08 | 在本地运行脚本（mock 环境） | 脚本可执行，错误信息清晰 |
| T-E2-09 | 检查 CI 配置是否包含 pre-submit 集成 | CI 包含检查步骤 |

---

## 5. DoD Checklist

- [ ] `scripts/pre-submit-check.sh` 已创建且可执行（E2-S1）
- [ ] 脚本包含 CHANGELOG、TypeScript、ESLint 三项核心检查（E2-S1）
- [ ] 脚本包含 eslint-disable 数量监控和阈值警告（E2-S2）
- [ ] CI 配置已集成 pre-submit-check.sh（E2-S3）
- [ ] 所有验收测试通过
- [ ] 脚本在本地测试运行正常

---

## 6. 使用示例

```bash
# 正常运行（全部检查）
./scripts/pre-submit-check.sh

# WIP commit（跳过 CHANGELOG 检查）
ESLINT_DISABLE_THRESHOLD=25 ./scripts/pre-submit-check.sh --skip-changelog
```
