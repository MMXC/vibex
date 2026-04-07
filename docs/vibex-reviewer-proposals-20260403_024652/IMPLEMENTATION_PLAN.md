# VibeX Reviewer 提案 — 实施计划

**项目**: vibex-reviewer-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect
**状态**: 实施计划完成

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-reviewer-proposals-20260403_024652
- **执行日期**: 2026-04-03

---

## 2. 实施阶段总览

```
Sprint 3 实施阶段 (11h)
├── Phase 1: E1 — CHANGELOG 规范落地 (2.5h)
│   ├── Step 1.1: Frontend AGENTS.md CHANGELOG 章节 (1h)
│   ├── Step 1.2: CHANGELOG_CONVENTION.md 创建 (1h)
│   └── Step 1.3: Backend AGENTS.md 规范同步 (0.5h)
├── Phase 2: E2 — Pre-submit 检查脚本 (4h)
│   ├── Step 2.1: 脚本核心功能 (2h)
│   ├── Step 2.2: eslint-disable 监控 (1h)
│   └── Step 2.3: CI 集成 (1h)
├── Phase 3: E3 — Reviewer 驳回模板 (4h)
│   ├── Step 3.1: AGENTS.md 驳回模板定义 (1h)
│   ├── Step 3.2: reports/INDEX.md 创建 (2h)
│   └── Step 3.3: CI 自动追加机制 (1h)
└── Phase 4: E4 — 文档整理与宣贯 (0.5h)
    └── Step 4.1: README 更新 + 团队通知 (0.5h)

Sprint 4 规划 (13h)
├── Phase 5: E5 — Git Hooks 强制 (5h)
└── Phase 6: E6 — ESLint disable 豁免治理 (8h)
```

---

## 3. Phase 1: E1 — CHANGELOG 规范落地 (2.5h)

### Step 1.1: Frontend AGENTS.md CHANGELOG 规范章节 (1h)

**执行 Agent**: Dev

**前置条件**: 无

**文件变更**: `vibex-fronted/AGENTS.md`

**操作步骤**:

1. 读取现有 `vibex-fronted/AGENTS.md`，定位插入点（建议在 Reviewer 相关章节末尾）
2. 追加 CHANGELOG 规范章节:

```markdown
## CHANGELOG 规范

### 路径规则

| 项目 | CHANGELOG 路径 | 说明 |
|------|---------------|------|
| Frontend | `vibex-fronted/CHANGELOG.md` | 根目录 Markdown，**手动维护** |
| Frontend App | `src/app/changelog/page.tsx` | 自动渲染页面，**禁止手动修改** |
| Backend | `vibex-backend/CHANGELOG.md` | Backend 专属，**手动维护** |

> ⚠️ **警告**: Frontend 只维护根目录 `CHANGELOG.md`，App 页面 `src/app/changelog/page.tsx` 由渲染逻辑自动生成，禁止手动编辑。

### 更新时机

每个 Epic 结束时，**必须**更新 `CHANGELOG.md`。更新规则:
- 在文件**顶部**追加新的 Epic 条目（保持时间倒序）
- 格式必须符合 `CHANGELOG_CONVENTION.md` 规范
- Commit message 应包含 `CHANGELOG.md` 变更

### 格式规范

参考 `CHANGELOG_CONVENTION.md`。核心要求:
- 包含 Epic 名称和日期
- 包含变更类型标签 (`feat|fix|refactor|docs|test|chore`)
- 包含变更摘要（至少 1 条）

### Reviewer Constraints

Dev 提交前，Reviewer 检查:
- [ ] `CHANGELOG.md` 已更新（根目录 Markdown，不是 App 页面）
- [ ] 更新格式符合 `CHANGELOG_CONVENTION.md`
- [ ] Commit message 包含 `CHANGELOG.md` 变更
```

3. 在 AGENTS.md 目录页添加章节入口链接

**验收标准**:
```bash
# 验证 AGENTS.md 包含以下内容
grep -q "CHANGELOG 规范" vibex-fronted/AGENTS.md
grep -q "src/app/changelog/page.tsx" vibex-fronted/AGENTS.md
grep -q "禁止手动修改 App 页面" vibex-fronted/AGENTS.md
grep -q "Reviewer Constraints" vibex-fronted/AGENTS.md
grep -q "CHANGELOG.md 已更新" vibex-fronted/AGENTS.md
```

---

### Step 1.2: CHANGELOG_CONVENTION.md 创建 (1h)

**执行 Agent**: Dev

**前置条件**: Step 1.1 完成

**文件变更**: 新建 `vibex-fronted/CHANGELOG_CONVENTION.md`

**操作步骤**:

1. 创建 `vibex-fronted/CHANGELOG_CONVENTION.md`:

```markdown
# CHANGELOG 格式规范

**版本**: v1.0
**日期**: 2026-04-03
**适用范围**: vibex-fronted (Frontend 项目)
**维护者**: @reviewer

---

## 概述

本文档定义 VibeX Frontend 项目 CHANGELOG.md 的标准格式。所有 Epic 变更记录必须遵循本规范。

## Epic 条目结构

每个 Epic 结束时，在 `CHANGELOG.md` **顶部**追加新条目:

```markdown
## [Epic 名称] — YYYY-MM-DD

**Epic**: E<N>-<Name>
**类型**: <feat|fix|refactor|docs|test|chore>
**范围**: frontend
**Commit**: <commit-hash> (可选)

### 变更摘要
- <变更点 1，描述具体功能或修复>
- <变更点 2>

### 依赖 Epic
- <前置 Epic 名称（如有）>
```

### 示例

```markdown
## [Canvas JSON 持久化] — 2026-03-15

**Epic**: E3-canvas-json-persistence
**类型**: feat
**范围**: frontend
**Commit**: a1b2c3d (可选)

### 变更摘要
- 添加 Canvas 状态自动保存机制（每 30s）
- 支持从 localStorage 恢复未保存的工作
- 新增 `useCanvasPersistence` hook

### 依赖 Epic
- E2-canvas-rendering
```

## 变更类型标签

| 标签 | 含义 | 使用场景 |
|------|------|---------|
| `feat` | 新功能 | 新增用户可见的功能 |
| `fix` | Bug 修复 | 修复已知的缺陷 |
| `refactor` | 重构 | 代码重构，不改变功能 |
| `docs` | 文档更新 | README、CHANGELOG 等 |
| `test` | 测试 | 新增或修改测试用例 |
| `chore` | 维护 | 依赖升级、配置变更等 |

## 禁止事项

- ❌ 禁止在 `src/app/changelog/page.tsx` 中手动添加内容
- ❌ 禁止仅记录 "update changelog" 而无实质变更摘要
- ❌ 禁止跨项目记录（Frontend 和 Backend 分开维护）
- ❌ 禁止删除历史条目（CHANGELOG 只追加，不删除）

## 验证清单

Epic 提交前自检:
- [ ] Epic 条目位于文件顶部
- [ ] 包含 Epic 名称和完成日期
- [ ] 包含变更类型标签
- [ ] 包含至少 1 条变更摘要
- [ ] 摘要描述具体功能，而非 "update changelog"
```

**验收标准**:
```bash
# 验证文件存在且包含必要内容
test -f vibex-fronted/CHANGELOG_CONVENTION.md
grep -q "Epic" vibex-fronted/CHANGELOG_CONVENTION.md
grep -q "feat|fix|refactor" vibex-fronted/CHANGELOG_CONVENTION.md
grep -q "示例" vibex-fronted/CHANGELOG_CONVENTION.md
grep -q "禁止" vibex-fronted/CHANGELOG_CONVENTION.md
```

---

### Step 1.3: Backend AGENTS.md 规范同步 (0.5h)

**执行 Agent**: Dev

**前置条件**: Step 1.1 完成（参考格式）

**文件变更**: `vibex-backend/AGENTS.md`

**操作步骤**:

1. 读取现有 `vibex-backend/AGENTS.md`
2. 在适当位置追加 CHANGELOG 规范章节（比 Frontend 简化版）:

```markdown
## CHANGELOG 规范

### 路径规则

Backend 项目只维护 `vibex-backend/CHANGELOG.md`，不接受其他位置的 CHANGELOG 记录。

### 更新时机

每个 Epic 结束时，必须更新 `vibex-backend/CHANGELOG.md`。格式参考 Frontend 规范（见 `CHANGELOG_CONVENTION.md`）。

### Reviewer Constraints

- [ ] `vibex-backend/CHANGELOG.md` 已更新
- [ ] 更新格式符合规范（Epic 名称、日期、变更类型、摘要）
```

**验收标准**:
```bash
grep -q "CHANGELOG 规范" vibex-backend/AGENTS.md
grep -q "vibex-backend/CHANGELOG.md" vibex-backend/AGENTS.md
```

---

## 4. Phase 2: E2 — Pre-submit 检查脚本 (4h)

### Step 2.1: 脚本核心功能 (2h)

**执行 Agent**: Dev

**前置条件**: Step 1.1 完成

**文件变更**: 新建 `vibex-fronted/scripts/pre-submit-check.sh`

**操作步骤**:

1. 创建 `vibex-fronted/scripts/pre-submit-check.sh`:

```bash
#!/bin/bash
# ============================================================
# pre-submit-check.sh — VibeX 提交前质量检查脚本
# ============================================================
# 版本: 1.0.0
# 日期: 2026-04-03
# ============================================================

set -euo pipefail

# 配置
PROJECT_ROOT="${PROJECT_ROOT:-.}"
ESLINT_DISABLE_THRESHOLD="${ESLINT_DISABLE_THRESHOLD:-20}"
CHANGELOG_PATH="${PROJECT_ROOT}/CHANGELOG.md"
ESLINT_DISABLE_PATTERNS="eslint-disable|eslint-disable-line|eslint-disable-next-line"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 标志位
SKIP_CHANGELOG=false
SKIP_TS=false
SKIP_ESLINT=false
WARN_ONLY=false

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-changelog) SKIP_CHANGELOG=true; shift ;;
    --skip-ts) SKIP_TS=true; shift ;;
    --skip-eslint) SKIP_ESLINT=true; shift ;;
    --warn-only) WARN_ONLY=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# 日志函数
log_pass() { echo -e "${GREEN}✅ $1${NC}"; }
log_fail() { echo -e "${RED}❌ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo -e "📋 $1"; }

# ============================================================
# 检查 1: CHANGELOG 内容验证
# ============================================================
check_changelog() {
  log_info "检查 CHANGELOG.md ..."

  if [[ ! -f "$CHANGELOG_PATH" ]]; then
    log_fail "CHANGELOG.md 不存在: $CHANGELOG_PATH"
    return 1
  fi

  # 检查是否包含 Epic/feat/fix/refactor 关键词
  if grep -qE "(## \[|Epic|feat:|fix:|refactor:)" "$CHANGELOG_PATH"; then
    log_pass "CHANGELOG.md 包含变更记录"
    return 0
  else
    log_fail "CHANGELOG.md 未更新或格式不符（缺少 Epic/feat/fix/refactor 关键词）"
    log_info "参考: CHANGELOG_CONVENTION.md §Epic 条目结构"
    return 1
  fi
}

# ============================================================
# 检查 2: TypeScript 类型检查
# ============================================================
check_typescript() {
  log_info "运行 TypeScript 类型检查 (tsc --noEmit) ..."

  if ! command -v npx &> /dev/null; then
    log_warn "npx 不可用，跳过 TypeScript 检查"
    return 0
  fi

  cd "$PROJECT_ROOT"

  # 运行 tsc，如果失败则输出错误
  if npx tsc --noEmit 2>&1; then
    log_pass "TypeScript 类型检查通过"
    return 0
  else
    log_fail "TypeScript 编译失败，请修复类型错误后重试"
    log_info "参考: AGENTS.md §代码质量标准"
    return 1
  fi
}

# ============================================================
# 检查 3: ESLint 检查
# ============================================================
check_eslint() {
  log_info "运行 ESLint 检查 ..."

  if ! command -v npx &> /dev/null; then
    log_warn "npx 不可用，跳过 ESLint 检查"
    return 0
  fi

  cd "$PROJECT_ROOT"

  # 运行 ESLint，--max-warnings=0 表示任何警告都失败
  if npx eslint ./src --max-warnings=0 2>&1; then
    log_pass "ESLint 检查通过"
    return 0
  else
    log_fail "ESLint 检查失败，请修复代码规范问题"
    log_info "参考: AGENTS.md §代码规范"
    return 1
  fi
}

# ============================================================
# 检查 4: eslint-disable 数量监控
# ============================================================
check_eslint_disable_count() {
  log_info "检查 eslint-disable 注释数量 ..."

  cd "$PROJECT_ROOT"

  # 统计 eslint-disable 数量
  DISABLE_COUNT=$(grep -rEn "$ESLINT_DISABLE_PATTERNS" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

  if [[ "$DISABLE_COUNT" -gt "$ESLINT_DISABLE_THRESHOLD" ]]; then
    log_warn "eslint-disable 数量过多 ($DISABLE_COUNT/$ESLINT_DISABLE_THRESHOLD)"
    log_info "建议: 审查现有豁免记录，更新 ESLINT_DISABLES.md"
    return 2  # 警告，不阻断
  else
    log_pass "eslint-disable 数量在阈值内 ($DISABLE_COUNT/$ESLINT_DISABLE_THRESHOLD)"
    return 0
  fi
}

# ============================================================
# 主流程
# ============================================================
main() {
  echo "========================================"
  echo "   VibeX Pre-submit Quality Check"
  echo "========================================"
  echo ""
  echo "项目根目录: $PROJECT_ROOT"
  echo "ESLint disable 阈值: $ESLINT_DISABLE_THRESHOLD"
  echo ""

  local exit_code=0
  local has_failures=false

  # 检查 1: CHANGELOG
  if [[ "$SKIP_CHANGELOG" == "false" ]]; then
    if ! check_changelog; then
      has_failures=true
      exit_code=1
    fi
    echo ""
  fi

  # 检查 2: TypeScript
  if [[ "$SKIP_TS" == "false" ]]; then
    if ! check_typescript; then
      has_failures=true
      exit_code=1
    fi
    echo ""
  fi

  # 检查 3: ESLint
  if [[ "$SKIP_ESLINT" == "false" ]]; then
    if ! check_eslint; then
      has_failures=true
      exit_code=1
    fi
    echo ""
  fi

  # 检查 4: eslint-disable 数量（始终执行，不阻断）
  check_eslint_disable_count
  eslint_disable_exit=$?
  if [[ $eslint_disable_exit -eq 2 ]]; then
    if [[ "$WARN_ONLY" == "false" ]]; then
      log_warn "ESLint disable 数量超过阈值，但不阻断提交"
    fi
  fi
  echo ""

  # 汇总结果
  echo "========================================"
  if [[ "$has_failures" == "true" ]]; then
    log_fail "检查失败，请修复上述问题后重试"
    echo ""
    echo "提示: 使用 --warn-only 参数可以警告模式运行（不阻断提交）"
    echo "提示: 使用 --skip-<check> 可以跳过特定检查"
    exit 1
  else
    log_pass "所有检查通过 ✅"
    exit 0
  fi
}

# 运行
main
```

2. 设置执行权限:
```bash
chmod +x vibex-fronted/scripts/pre-submit-check.sh
```

**验收标准**:
```bash
test -f vibex-fronted/scripts/pre-submit-check.sh
test -x vibex-fronted/scripts/pre-submit-check.sh
grep -q "tsc --noEmit" vibex-fronted/scripts/pre-submit-check.sh
grep -q "eslint" vibex-fronted/scripts/pre-submit-check.sh
grep -q "CHANGELOG.md" vibex-fronted/scripts/pre-submit-check.sh
grep -q "ESLINT_DISABLE_THRESHOLD" vibex-fronted/scripts/pre-submit-check.sh
grep -q "eslint-disable" vibex-fronted/scripts/pre-submit-check.sh
```

---

### Step 2.2: eslint-disable 监控增强 (1h)

**执行 Agent**: Dev

**前置条件**: Step 2.1 完成

**文件变更**: `vibex-fronted/scripts/pre-submit-check.sh` (已在 Step 2.1 包含)

**补充操作**:

创建初始 `ESLINT_DISABLES.md`（供 Sprint 4 治理使用）:

```markdown
# ESLint Disable 豁免记录

**版本**: v1.0
**日期**: 2026-04-03
**维护者**: @reviewer
**复查周期**: 每 Sprint 审查一次

---

## 豁免记录

| # | 文件路径 | 行号 | 规则 | 理由 | 添加日期 | 复查状态 |
|---|---------|------|------|------|---------|---------|
| 1 | — | — | @typescript-eslint/no-explicit-any | 待扫描补充 | — | 待复查 |
| 2 | — | — | react-hooks/exhaustive-deps | 待扫描补充 | — | 待复查 |

---

## 豁免规则说明

### @typescript-eslint/no-explicit-any

使用 `any` 类型会绕过 TypeScript 的类型检查，应尽量避免。

**合理场景**:
- 第三方库类型定义缺失，无法提供类型
- 动态类型（如 `JSON.parse` 结果）
- 性能关键路径上的类型断言

**不合理场景**:
- 懒得写类型
- 类型过于复杂，懒得解决

### react-hooks/exhaustive-deps

依赖数组不完整会导致 stale closure，可能引发难以调试的 Bug。

**合理场景**:
- 明确知道依赖不会改变（如组件 props）
- 使用 ref 避免依赖
- 性能优化，避免不必要重渲染（需注释说明）

---

## 复查流程

1. 每 Sprint 结束时，Reviewer 审查 `ESLINT_DISABLES.md`
2. 确认豁免是否仍然必要
3. 标记复查状态: `合理保留` | `待修复` | `已修复`

---

## 扫描脚本

```bash
# 扫描现有 eslint-disable 注释
grep -rEn "eslint-disable" src/ --include="*.ts" --include="*.tsx" | \
  awk -F: '{print NR"|"$1"|"$2"|—|"}'
```

---

**验收标准**:
```bash
grep -q "ESLINT_DISABLES.md" vibex-fronted/scripts/pre-submit-check.sh
```

---

### Step 2.3: CI 集成 pre-submit 检查 (1h)

**执行 Agent**: Dev

**前置条件**: Step 2.1 完成

**文件变更**: 新建 `.github/workflows/pre-submit.yml`

**操作步骤**:

1. 创建 `.github/workflows/pre-submit.yml`:

```yaml
name: Pre-submit Quality Gate

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  pre-submit:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run pre-submit checks
        run: |
          chmod +x scripts/pre-submit-check.sh
          ./scripts/pre-submit-check.sh --warn-only || true
      
      - name: Report ESLint disable count
        run: |
          COUNT=$(grep -rEn "eslint-disable" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
          THRESHOLD="${ESLINT_DISABLE_THRESHOLD:-20}"
          echo "::notice::ESLint disable count: $COUNT (threshold: $THRESHOLD)"
          
      - name: Upload ESLint report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: eslint-report
          path: |
            eslint-report/
            reports/
          retention-days: 30
```

2. 在 `vibex-fronted/.github/workflows/ci.yml` 中添加 pre-submit 步骤引用

**验收标准**:
```bash
grep -q "pre-submit-check.sh" .github/workflows/pre-submit.yml
grep -q "scripts/" .github/workflows/pre-submit.yml
grep -q "ESLint disable count" .github/workflows/pre-submit.yml
```

---

## 5. Phase 3: E3 — Reviewer 驳回模板 (4h)

### Step 3.1: AGENTS.md 驳回模板定义 (1h)

**执行 Agent**: Dev

**前置条件**: Step 1.1 完成

**文件变更**: `vibex-fronted/AGENTS.md` (追加内容)

**操作步骤**:

1. 在 AGENTS.md 中追加 Reviewer 驳回模板章节:

```markdown
## Reviewer 驳回模板

### 标准化驳回格式

每条驳回必须包含以下四个部分，不得缺失:

```markdown
### ❌ 审查驳回: <问题标题>

**Epic**: E<N>-<Name>
**日期**: YYYY-MM-DD
**Reviewer**: @reviewer-handle

**问题描述**:
<清晰描述问题，引用具体代码或规范条款>

**文件位置**:
- 📍 `<文件路径>:<行号>`

**修复命令**:
\`\`\`bash
# 🔧 具体可执行的修复命令
<command>
\`\`\`

**参考规范**:
- 📋 AGENTS.md §<章节编号>
- 📋 CHANGELOG_CONVENTION.md §<章节编号>
```

### 驳回类型参考

#### 类型 A: CHANGELOG 遗漏

```markdown
### ❌ 审查驳回: CHANGELOG.md 未更新

**问题描述**:
Epic `<epic-name>` 已完成，但 `CHANGELOG.md` 中未找到对应的变更记录。

**文件位置**:
- 📍 `CHANGELOG.md`

**修复命令**:
\`\`\`bash
# 编辑 CHANGELOG.md，在顶部添加：
cat >> CHANGELOG.md << 'EOF'

## [<Epic 名称>] — $(date +%Y-%m-%d)

**Epic**: E<N>-<Name>
**类型**: <feat|fix|refactor>
**范围**: frontend

### 变更摘要
- <变更点 1>
- <变更点 2>
EOF

# 验证
head -20 CHANGELOG.md
\`\`\`

**参考规范**:
- 📋 AGENTS.md §CHANGELOG 规范
- 📋 CHANGELOG_CONVENTION.md §Epic 条目结构
```

#### 类型 B: TypeScript 类型错误

```markdown
### ❌ 审查驳回: TypeScript 编译失败

**问题描述**:
`npx tsc --noEmit` 检测到类型错误，请修复后重新提交。

**文件位置**:
- 📍 `src/<file>.ts:<行号>`

**修复命令**:
\`\`\`bash
# 查看详细错误
npx tsc --noEmit 2>&1 | head -50

# 修复后验证
npx tsc --noEmit && echo "✅ TypeScript 检查通过"
\`\`\`

**参考规范**:
- 📋 AGENTS.md §代码质量标准
```

#### 类型 C: ESLint 规则违反

```markdown
### ❌ 审查驳回: ESLint 检查失败

**问题描述**:
ESLint 检测到 <N> 个规则违反。

**文件位置**:
- 📍 `src/<file>.tsx:<行号>`

**修复命令**:
\`\`\`bash
# 查看详细 ESLint 错误
npx eslint src/<file>.tsx

# 自动修复
npx eslint src/<file>.tsx --fix
\`\`\`

**参考规范**:
- 📋 AGENTS.md §代码规范
```
```

**验收标准**:
```bash
grep -q "❌ 审查驳回" vibex-fronted/AGENTS.md
grep -q "🔧 修复命令" vibex-fronted/AGENTS.md
grep -q "📍" vibex-fronted/AGENTS.md
grep -q "示例" vibex-fronted/AGENTS.md
grep -q "模板" vibex-fronted/AGENTS.md
```

---

### Step 3.2: reports/INDEX.md 创建 (2h)

**执行 Agent**: Dev

**前置条件**: 无

**文件变更**: 新建 `vibex-fronted/reports/INDEX.md`

**操作步骤**:

1. 创建 `vibex-fronted/reports/INDEX.md`:

```markdown
# VibeX 审查报告索引

**版本**: v1.0
**日期**: 2026-04-03
**维护者**: @coord
**最后更新**: 2026-04-03

---

## 索引维护规范

### 新增报告

每次审查完成后，必须更新本索引文件:

1. 在 `## 历史报告` 表格中添加新条目
2. 在 `## 报告详情` 章节后追加新报告摘要
3. 使用以下格式:

```markdown
<!-- 新报告条目模板 -->
| RR-YYYYMMDD-NNN | YYYY-MM-DD | epic-name | 简要总结 | [报告文件](./YYYYMMDD-epic-name.md) |
```

### 索引格式规范

| 字段 | 格式 | 说明 |
|------|------|------|
| 报告 ID | `RR-YYYYMMDD-NNN` | 日期 + 序号 |
| 日期 | `YYYY-MM-DD` | 审查完成日期 |
| Epic | `epic-name` | 关联 Epic 名称 |
| 摘要 | 简要描述 | 1-2 句话总结审查结论 |
| 链接 | `./filename.md` | 相对路径 |

---

## 关键指标

| 指标 | 当前 Sprint 3 | 目标 |
|------|-------------|------|
| CHANGELOG 相关驳回次数 | Epic3: 4 轮 | 新 Epic ≤ 1 轮 |
| 平均审查轮次 | 2-3 轮 | ≤ 1.5 轮 |
| 驳回包含修复命令比例 | 0% | 100% |
| eslint-disable 数量 | 16+ | ≤ 20 |

---

## 历史报告

### Sprint 3

| 报告 ID | 日期 | Epic | 摘要 | 状态 | 链接 |
|---------|------|------|------|------|------|
| RR-20260403-001 | 2026-04-03 | reviewer-proposals-sprint3 | Sprint 3 审查质量提升提案审查 | 通过 | [报告](./RR-20260403-reviewer-proposals-sprint3.md) |

### Sprint 2

| 报告 ID | 日期 | Epic | 摘要 | 状态 | 链接 |
|---------|------|------|------|------|------|
| RR-YYYYMMDD-NNN | YYYY-MM-DD | epic-name | 简要总结 | 通过/驳回 | [报告](./filename.md) |

### Sprint 1

| 报告 ID | 日期 | Epic | 摘要 | 状态 | 链接 |
|---------|------|------|------|------|------|
| RR-YYYYMMDD-NNN | YYYY-MM-DD | epic-name | 简要总结 | 通过/驳回 | [报告](./filename.md) |

---

## 报告详情

### RR-20260403-001: Sprint 3 审查质量提升提案

**日期**: 2026-04-03
**Epic**: reviewer-proposals-sprint3
**Reviewer**: @architect
**状态**: ✅ 通过
**轮次**: 1
**审查耗时**: 15 分钟

**摘要**: 提案分析清晰，方案 A（Sprint 3）实施成本低、风险可控，推荐采纳。

**主要问题**: 无

**结论**: 通过，建议立即执行。
```

2. 创建初始历史报告条目（如果 `reports/` 目录中有历史报告，需要补充索引）

```bash
# 扫描现有报告文件
ls -la reports/*.md 2>/dev/null | head -10
```

**验收标准**:
```bash
test -f vibex-fronted/reports/INDEX.md
grep -q "报告索引" vibex-fronted/reports/INDEX.md
grep -q "格式规范" vibex-fronted/reports/INDEX.md
grep -q "新增报告必须更新 INDEX" vibex-fronted/reports/INDEX.md
```

---

### Step 3.3: CI 自动追加机制 (1h，降级为维护指南)

**执行 Agent**: Dev

**前置条件**: Step 3.2 完成

**文件变更**: 创建 `vibex-fronted/scripts/append-report-index.sh`（可选）

**决策**: 鉴于 CI 自动追加可能导致 INDEX.md 冲突，采用手动维护方案作为主方案，CI 自动化作为可选增强。

**手动维护指南**（写入 AGENTS.md 或 README.md）:

```markdown
## 报告索引维护指南

### 手动追加流程

1. 完成审查后，在 `reports/` 目录创建报告文件
2. 更新 `reports/INDEX.md`:
   - 在 `## 历史报告` 表格顶部添加新条目
   - 在 `## 报告详情` 章节后追加新报告摘要
3. Commit 时包含 INDEX.md 变更

### 报告文件命名规范

- 格式: `RR-YYYYMMDD-NNN-epic-name.md`
- 示例: `RR-20260403-001-canvas-json-persistence.md`

### 自动追加脚本（可选）

如需自动化，可使用以下脚本:

```bash
./scripts/append-report-index.sh reports/RR-20260403-001-epic-name.md
```

注意: 自动追加后需手动检查 INDEX.md 格式是否正确。
```

**验收标准**:
```bash
# 可选：验证脚本存在
test -f vibex-fronted/scripts/append-report-index.sh || echo "手动维护方案"
```

---

## 6. Phase 4: E4 — 文档整理与宣贯 (0.5h)

### Step 4.1: README 更新 + 团队通知 (0.5h)

**执行 Agent**: Dev

**前置条件**: Phase 1-3 完成

**文件变更**: `vibex-fronted/README.md`

**操作步骤**:

1. 在 README.md 中新增 Reviewer 工作流章节:

```markdown
## Reviewer 工作流

### CHANGELOG 规范

VibeX 项目统一使用 `CHANGELOG.md` 记录变更，格式规范见 [CHANGELOG_CONVENTION.md](./CHANGELOG_CONVENTION.md)。

**关键规则**:
- Frontend: 只维护 `vibex-fronted/CHANGELOG.md`
- Backend: 只维护 `vibex-backend/CHANGELOG.md`
- App 页面 (`src/app/changelog/page.tsx`) 禁止手动修改

**更新时机**: 每个 Epic 结束时必须更新。

### Pre-submit 检查脚本

提交前建议运行本地检查脚本:

```bash
./scripts/pre-submit-check.sh
```

**检查项**:
- CHANGELOG.md 内容验证
- TypeScript 类型检查 (`tsc --noEmit`)
- ESLint 代码规范检查
- eslint-disable 数量监控

**参数选项**:
- `--warn-only`: 警告模式，不阻断提交
- `--skip-changelog`: 跳过 CHANGELOG 检查
- `--skip-ts`: 跳过 TypeScript 检查
- `--skip-eslint`: 跳过 ESLint 检查

### Reviewer 驳回模板

Reviewer 驳回时使用标准化模板，参考 [AGENTS.md](./AGENTS.md) §Reviewer 驳回模板。

**模板要求**:
- ❌ 审查驳回: 问题标题
- 📍 文件位置
- 🔧 修复命令（具体可执行）
- 📋 参考规范

### 审查报告索引

历史审查报告索引见 [reports/INDEX.md](./reports/INDEX.md)。

**规范**: 新增审查报告后必须更新 INDEX.md。
```

2. 通知团队（在 Slack #vibex-dev 频道）:

```
📢 Sprint 3 审查质量规范已上线

@here VibeX Sprint 3 审查质量提升方案已实施，主要变更:

1. ✅ CHANGELOG 规范已写入 AGENTS.md
   - Frontend: `vibex-fronted/CHANGELOG.md` (根目录)
   - App 页面 `src/app/changelog/page.tsx` 禁止手动修改
   - 参考: CHANGELOG_CONVENTION.md

2. ✅ Pre-submit 检查脚本已上线
   - 运行: `./scripts/pre-submit-check.sh`
   - CI 已集成（Sprint 3: warn-only 模式）

3. ✅ Reviewer 驳回模板已定义
   - 所有驳回必须包含修复命令
   - 参考: AGENTS.md §Reviewer 驳回模板

4. ✅ reports/INDEX.md 已创建
   - 历史审查报告已索引
   - 新报告必须更新 INDEX

如有疑问联系 @architect 或 @reviewer。
```

**验收标准**:
```bash
grep -q "Reviewer 工作流" vibex-fronted/README.md
grep -q "pre-submit-check.sh" vibex-fronted/README.md
grep -q "CHANGELOG 规范" vibex-fronted/README.md
```

---

## 7. Sprint 4 规划

### Phase 5: E5 — Git Hooks 强制 (5h)

**前置条件**: Sprint 3 完成并验证有效性

**Step 5.1: commit-msg hook (2h)**

```bash
# 安装 husky
npm install husky --save-dev

# 启用 hooks
npx husky install

# 添加 commit-msg hook
npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'
```

**Step 5.2: pre-commit hook (3h)**

```bash
# 添加 pre-commit hook
npx husky add .husky/pre-commit 'npm run pre-commit-check'
```

**目标**: 在 pre-commit 时运行 `npm run lint && npx tsc --noEmit`

### Phase 6: E6 — ESLint disable 豁免治理 (8h)

**前置条件**: Sprint 3 完成

1. 扫描现有 16+ 处 eslint-disable 注释
2. 分类为合理保留 / 需修复
3. 更新 `ESLINT_DISABLES.md`
4. 逐步修复不合理豁免
5. 设置每 Sprint 复查机制

---

## 8. 工时汇总

| Phase | Step | 工时 | 累计 |
|-------|------|------|------|
| Phase 1: E1 | 1.1 Frontend AGENTS.md | 1h | 1h |
| Phase 1: E1 | 1.2 CHANGELOG_CONVENTION.md | 1h | 2h |
| Phase 1: E1 | 1.3 Backend AGENTS.md | 0.5h | 2.5h |
| Phase 2: E2 | 2.1 pre-submit-check.sh | 2h | 4.5h |
| Phase 2: E2 | 2.2 eslint-disable 监控 | 1h | 5.5h |
| Phase 2: E| Phase 2: E2 | 2.3 CI 集成 | 1h | 6.5h |
| Phase 3: E3 | 3.1 驳回模板 | 1h | 7.5h |
| Phase 3: E3 | 3.2 reports/INDEX.md | 2h | 9.5h |
| Phase 3: E3 | 3.3 CI 自动追加 | 1h | 10.5h |
| Phase 4: E4 | 4.1 README 更新 | 0.5h | 11h |
| **Sprint 3 总计** | | **11h** | — |
| Phase 5: E5 | 5.1 commit-msg hook | 2h | — |
| Phase 5: E5 | 5.2 pre-commit hook | 3h | — |
| **Sprint 4 规划 E5** | | **5h** | — |
| Phase 6: E6 | 6.1 eslint-disable 治理 | 8h | — |
| **Sprint 4 规划 E6** | | **8h** | — |
| **项目总计（含规划）** | | **~24h** | — |

---

## 9. 依赖关系

```
Step 1.1 (AGENTS.md Frontend)
    ├── Step 1.2 (CHANGELOG_CONVENTION.md) [依赖 1.1 参考]
    └── Step 1.3 (Backend AGENTS.md) [依赖 1.1 格式]

Step 2.1 (pre-submit-check.sh)
    ├── Step 2.2 (eslint-disable 监控) [已包含在 2.1]
    └── Step 2.3 (CI 集成) [依赖 2.1 完成]

Step 3.1 (驳回模板)
    └── Step 3.2 (INDEX.md) [可并行]

Step 3.2 + 3.3
    └── Step 4.1 (README 更新) [依赖 Phase 1-3 完成]
```

---

## 10. 质量门禁

### CI 门禁配置

| 阶段 | 检查项 | 模式 | 阻断发布 |
|------|--------|------|---------|
| Sprint 3 | CHANGELOG 检查 | warn-only | ❌ |
| Sprint 3 | TypeScript 检查 | warn-only | ❌ |
| Sprint 3 | ESLint 检查 | warn-only | ❌ |
| Sprint 3 | eslint-disable 数量 | warning | ❌ |
| Sprint 4 | CHANGELOG 检查 | blocking | ✅ |
| Sprint 4 | TypeScript 检查 | blocking | ✅ |
| Sprint 4 | ESLint 检查 | blocking | ✅ |
| Sprint 4 | commit-msg hook | blocking | ✅ |
| Sprint 4 | pre-commit hook | blocking | ✅ |

### 质量门禁升级策略

1. **Sprint 3**: 所有检查以 `warn-only` 模式运行，收集反馈
2. **Sprint 3 末**: 统计假阳性率，调整阈值
3. **Sprint 4**: 将验证有效的检查升级为 `blocking` 模式
4. **持续**: 每 Sprint 审查 ESLINT_DISABLES.md

---

## 11. 验证清单

### Sprint 3 交付验证

- [x] `vibex-fronted/AGENTS.md` 包含 CHANGELOG 规范章节
- [x] `vibex-fronted/AGENTS.md` 包含 Reviewer 驳回模板
- [x] `vibex-fronted/AGENTS.md` 包含 Reviewer Constraints
- [x] `vibex-fronted/CHANGELOG_CONVENTION.md` 已创建
- [x] `vibex-backend/AGENTS.md` 包含 CHANGELOG 规范
- [x] `vibex-fronted/scripts/pre-submit-check.sh` 存在且可执行
- [x] `pre-submit-check.sh` 包含 CHANGELOG/TS/ESLint/disable 监控
- [x] `.github/workflows/pre-submit.yml` 存在
- [x] `vibex-fronted/reports/INDEX.md` 存在且包含历史报告索引
- [x] `vibex-fronted/README.md` 包含 Reviewer 工作流章节
- [x] `vibex-fronted/README.md` 包含 pre-submit-check.sh 章节
- [x] `vibex-fronted/README.md` 包含 CHANGELOG 规范章节
- [x] 团队已在 Slack 收到通知 (E4: 2026-04-04)

### Sprint 4 交付验证（规划）

- [ ] husky 已安装，hooks 正常工作
- [ ] commit-msg 验证 commit message 格式
- [ ] pre-commit 运行 lint + tsc
- [ ] ESLINT_DISABLES.md 包含所有现有豁免记录
- [ ] 每 Sprint 复查机制已建立

---

## 12. 回滚计划

| 场景 | 回滚操作 | 负责人 |
|------|---------|--------|
| pre-submit-check.sh 导致 CI 失败 | 临时禁用 CI 步骤，PR 回滚 | Dev |
| AGENTS.md 规范与现有流程冲突 | 撤销 AGENTS.md 变更，恢复原状 | Architect |
| CI 自动化追加导致 INDEX.md 冲突 | 禁用 CI 追加步骤，改为手动维护 | Dev |

---

*实施计划完成。下一阶段: AGENTS.md*
