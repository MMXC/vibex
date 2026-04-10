# VibeX 构建修复测试提案

> 项目路径: `/root/.openclaw/vibex`
> 生成时间: 2026-04-11
> 测试角色: Tester
> 目标: 验证前端 + 后端构建修复方案的正确性，并建立 CI 回归防护

---

## 1. 问题概览

| # | 影响范围 | 问题类型 | 严重性 | 根因 |
|---|---------|---------|--------|------|
| 1 | `vibex-fronted` | 前端构建失败 | 🔴 Critical | `CanvasHeader.stories.tsx` 引入了不存在的 `CanvasHeader` 组件 |
| 2 | `vibex-backend` | 后端构建失败 | 🔴 Critical | 3 个 route 文件中使用了 Unicode 弯引号（未在当前版本中复现，疑似已部分修复） |

---

## 2. 问题 1: 前端构建失败 — 详细分析

### 2.1 错误信息

```
./src/components/canvas/stories/CanvasHeader.stories.tsx:2:30
Type error: Cannot find module '../CanvasHeader' or its corresponding type declarations.
```

### 2.2 根因

`CanvasHeader.stories.tsx` 第 2 行：
```tsx
import { CanvasHeader } from '../CanvasHeader';
```

`CanvasHeader` 组件在 `/src/components/canvas/` 目录下不存在，导致 Storybook 构建失败，进而阻断整个 Next.js 构建流程。

### 2.3 当前组件状态

```bash
$ ls /src/components/canvas/
# 结果（部分）:
# BoundedContextGroup.tsx  BoundedContextTree.tsx  CanvasPage.tsx
# CanvasToolbar.tsx  ComponentTree.tsx  ...
# 注意: 无 CanvasHeader.tsx
```

---

## 3. 问题 2: 后端 Unicode 弯引号 — 详细分析

### 3.1 受影响文件

| 文件 | 路径 |
|------|------|
| agents route | `vibex-backend/src/app/api/agents/route.ts` |
| pages route | `vibex-backend/src/app/api/pages/route.ts` |
| prototype-snapshots route | `vibex-backend/src/app/api/prototype-snapshots/route.ts` |

### 3.2 问题字符

Unicode 弯引号（U+2018, U+2019, U+201C, U+201D）会导致：
- **ESLint 解析失败**: TypeScript 编译器不识别弯引号为字符串定界符
- **构建中断**: `next build` / `tsx` 进程提前退出
- **跨平台问题**: macOS 默认输入法常自动替换直引号为弯引号

### 3.3 当前验证结果

> ⚠️ **扫描结论**: 在当前版本中，3 个 route 文件均未检测到 Unicode 弯引号。
> 可能原因: (a) 已被手动修复，或 (b) 复现条件为特定编辑器/输入法环境。

---

## 4. 测试策略

### 4.1 整体策略

| 阶段 | 策略 | 说明 |
|------|------|------|
| 修复验证 | 白盒验证 + 构建确认 | 确认修复后两仓库均能成功构建 |
| 功能回归 | 黑盒 API 测试 | 确保修复不破坏现有功能 |
| CI 防护 | Lint 规则强化 | 防止 Unicode 字符再次引入 |
| 监控 | 构建健康度指标 | 持续监控构建时长、失败率 |

### 4.2 修复路径假设

**问题 1 (前端)** 的修复路径有 2 种可能:

| 方案 | 描述 | 测试策略 |
|------|------|---------|
| A | 删除 `CanvasHeader.stories.tsx`（组件不存在则删除 story） | 验证 story 被删除，构建通过 |
| B | 创建缺失的 `CanvasHeader` 组件 + story | 验证组件存在、story 可运行 |

> **测试需覆盖**: 无论采用哪种修复方案，构建必须通过。

---

## 5. 具体测试用例

### 5.1 构建验证测试 (Build Verification)

#### TC-001: 前端全量构建成功

```
前置条件: 问题1已修复
步骤:
  1. cd vibex-fronted
  2. npx next build
预期结果:
  - 退出码 = 0
  - 无 TypeScript 错误
  - 生成 .next/ 目录
  - 输出 "✓ Compiled successfully"
验证命令:
  npx next build && echo "BUILD_SUCCESS"
```

#### TC-002: 后端全量构建成功

```
前置条件: 问题2已修复
步骤:
  1. cd vibex-backend
  2. npm run build
预期结果:
  - 退出码 = 0
  - 无 TypeScript 错误
  - dist/ 目录生成产物
验证命令:
  npm run build && echo "BUILD_SUCCESS"
```

#### TC-003: Storybook 构建（条件触发）

```
前置条件: 如果问题1按方案B修复（创建组件）
步骤:
  1. cd vibex-fronted
  2. npm run storybook 或 npx storybook build
预期结果:
  - Storybook 构建成功
  - CanvasHeader story 可在 UI 中渲染
```

### 5.2 Unicode 字符检测测试

#### TC-004: 后端 route 文件无 Unicode 弯引号

```
前置条件: 问题2已修复
步骤:
  1. 对 3 个 route 文件执行字符扫描
  2. 检查 U+2018, U+2019, U+201C, U+201D
预期结果:
  - 0 个 Unicode 弯引号
验证命令:
  python3 -c "
  import glob
  files = glob.glob('src/app/api/**/route.ts', recursive=True)
  for f in files:
      with open(f, 'rb') as fh:
          for i, line in enumerate(fh.read().decode('utf-8', errors='replace').split('\n'), 1):
              for ch in line:
                  if 0x2018 <= ord(ch) <= 0x201F:
                      print(f'FAIL: {f}:{i} U+{ord(ch):04X}')
                      exit(1)
  print('PASS: No curly quotes found')
  "
```

### 5.3 功能回归测试

#### TC-005: /api/agents 接口回归

```
前置条件: agents/route.ts 修复后后端正常运行
步骤:
  1. 启动后端服务
  2. GET /api/agents（带 Auth Header）
预期结果:
  - HTTP 200
  - 返回 JSON 数组（含 Deprecation 相关 header）
  - 响应结构: { id, name, userId, ... }
```

#### TC-006: /api/pages 接口回归

```
前置条件: pages/route.ts 修复后后端正常运行
步骤:
  1. GET /api/pages?projectId=<id>
预期结果:
  - HTTP 200
  - 返回 JSON 数组
```

#### TC-007: /api/prototype-snapshots 接口回归

```
前置条件: prototype-snapshots/route.ts 修复后后端正常运行
步骤:
  1. GET /api/prototype-snapshots
预期结果:
  - HTTP 200
  - 返回 JSON 数组
```

### 5.4 边界条件测试

#### TC-008: Unicode 字符输入容错（API 层）

```
前置条件: 3 个 route 正常运行
步骤:
  1. POST /api/agents（带 Unicode 字符的 body）
  2. 内容包含: 中文、emoji、弯引号（作为数据内容而非代码）
预期结果:
  - API 正确处理请求（数据可被 sanitize）
  - 不因字符串中的弯引号产生解析错误
```

---

## 6. 自动化测试建议（CI 防护）

### 6.1 ESLint 规则增强

在 `vibex-backend/.eslintrc` 中添加规则，防止 Unicode 引号:

```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "Literal[value=/[\u2018\u2019\u201C\u201D]/]",
      "message": "Unicode curly quotes are not allowed. Use straight quotes (' or \")."
    }
  ]
}
```

或在 `.eslintrc` 中添加:

```json
{
  "rules": {
    "quotes": ["error", "single", { "avoidEscape": true }],
    "prettier/prettier": ["error", { "singleQuote": true }]
  }
}
```

### 6.2 pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit 或 husky pre-commit

echo "Running build checks..."

# 1. 检查 Unicode 弯引号（仅检查 .ts/.tsx 文件）
python3 -c "
import glob, sys
for f in glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True):
    with open(f, 'rb') as fh:
        content = fh.read().decode('utf-8', errors='replace')
        for i, line in enumerate(content.split('\n'), 1):
            for ch in line:
                if 0x2018 <= ord(ch) <= 0x201F:
                    print(f'ERROR: {f}:{i} contains Unicode curly quote U+{ord(ch):04X}')
                    sys.exit(1)
print('✓ No Unicode curly quotes')
"

# 2. 快速类型检查
cd vibex-fronted && npx tsc --noEmit --skipLibCheck && echo "✓ Frontend types OK" || exit 1
cd ../vibex-backend && npx tsc --noEmit --skipLibCheck && echo "✓ Backend types OK" || exit 1
```

### 6.3 CI Pipeline 配置

#### GitHub Actions (`.github/workflows/build.yml`)

```yaml
name: Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # ── 前端构建 ──
      - name: Build Frontend
        run: |
          cd vibex-fronted && npm run build
        env:
          CI: true

      # ── 后端构建 ──
      - name: Build Backend
        run: |
          cd vibex-backend && npm run build
        env:
          CI: true

  unicode-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check Unicode quotes
        run: |
          python3 << 'EOF'
          import glob, sys
          found = False
          for f in glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.tsx', recursive=True):
              with open(f, 'rb') as fh:
                  content = fh.read().decode('utf-8', errors='replace')
                  for i, line in enumerate(content.split('\n'), 1):
                      for ch in line:
                          if 0x2018 <= ord(ch) <= 0x201F:
                              print(f'::error file={f},line={i}::Unicode curly quote U+{ord(ch):04X}')
                              found = True
          if found:
              sys.exit(1)
          print('✓ No Unicode curly quotes found')
          EOF
```

### 6.4 自动化测试脚本

```bash
#!/bin/bash
# test-build-fixes.sh — 完整验证脚本

set -e

echo "=========================================="
echo "VibeX Build Fixes — Test Runner"
echo "=========================================="

PASS=0
FAIL=0

run_test() {
    local name="$1"
    local cmd="$2"
    echo -n "[TEST] $name ... "
    if eval "$cmd" > /dev/null 2>&1; then
        echo "✓ PASS"
        PASS=$((PASS+1))
    else
        echo "✗ FAIL"
        FAIL=$((FAIL+1))
    fi
}

# ── 前端构建验证 ──
run_test "Frontend build" "cd /root/.openclaw/vibex/vibex-fronted && npx next build --no-lint"

# ── 后端构建验证 ──
run_test "Backend build" "cd /root/.openclaw/vibex/vibex-backend && npm run build"

# ── Unicode 检测 ──
run_test "Unicode quotes check (backend)" "
  cd /root/.openclaw/vibex/vibex-backend && python3 -c \"
import glob, sys
for f in glob.glob('src/app/api/**/route.ts', recursive=True):
    with open(f, 'rb') as fh:
        for i, line in enumerate(fh.read().decode('utf-8').split('\n'), 1):
            for ch in line:
                if 0x2018 <= ord(ch) <= 0x201F:
                    sys.exit(1)
print('ok')
\"
"

echo "=========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "=========================================="
exit $FAIL
```

---

## 7. 回归测试计划

### 7.1 回归范围

| 模块 | 风险等级 | 测试重点 |
|------|---------|---------|
| `vibex-fronted` Next.js 构建 | 🔴 高 | 修复后完整构建通过 |
| `vibex-fronted` Storybook | 🟡 中 | 如果方案B，验证 story 渲染 |
| `vibex-backend` Next.js 构建 | 🔴 高 | 修复后完整构建通过 |
| `vibex-backend` API routes | 🟡 中 | 3 个 route 接口功能正常 |
| CI pipeline | 🟡 中 | Lint + Build job 稳定 |

### 7.2 回归时间表

| 阶段 | 时间 | 内容 | 负责人 |
|------|------|------|-------|
| 修复前基线 | T+0 | 运行当前构建，记录失败点 | Dev |
| 修复应用 | T+1 | 应用修复补丁 | Dev |
| 构建验证 | T+2 | 执行 TC-001, TC-002 | Tester |
| 功能回归 | T+3 | 执行 TC-005, TC-006, TC-007 | Tester |
| CI 集成 | T+4 | 部署 pre-commit + GitHub Actions | DevOps |
| 上线确认 | T+5 | `main` 分支构建绿灯 | Tester |

### 7.3 回归检查清单

- [ ] 前端 `npm run build` 成功（退出码 0）
- [ ] 后端 `npm run build` 成功（退出码 0）
- [ ] `/api/agents` 返回 200 + Deprecation header
- [ ] `/api/pages` 返回 200
- [ ] `/api/prototype-snapshots` 返回 200
- [ ] Unicode 检测脚本执行通过（0 个弯引号）
- [ ] GitHub Actions `build` job 绿灯
- [ ] `git log` 无回退到问题版本

### 7.4 监控指标

| 指标 | 目标 | 告警阈值 |
|------|------|---------|
| 前端构建时长 | < 5 min | > 8 min |
| 后端构建时长 | < 3 min | > 5 min |
| 构建失败率 | 0% | > 0% |
| Unicode 检测失败 | 0 次 | ≥ 1 次 |

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|---------|
| 方案B修复后组件行为与预期不符 | 中 | 中 | Storybook 交互测试 + 截图对比 |
| Unicode 问题在特定输入法下复现 | 高 | 高 | pre-commit hook + CI 检测 |
| 修复引入新的 TypeScript 类型错误 | 低 | 高 | `tsc --noEmit` 全量检查 |
| CI/CD pipeline 配置错误 | 低 | 高 | 先在 fork 测试，确认后合入 |
| 修复后 API 响应格式变化 | 低 | 中 | 功能回归测试覆盖所有 route |

---

## 9. 验收标准

| # | 条件 | 验证方式 |
|---|------|---------|
| 1 | `vibex-fronted` 构建成功 | `npm run build` 退出码 0 |
| 2 | `vibex-backend` 构建成功 | `npm run build` 退出码 0 |
| 3 | 3 个 route 文件无 Unicode 弯引号 | Python 扫描脚本通过 |
| 4 | `/api/agents`, `/api/pages`, `/api/prototype-snapshots` 接口正常 | HTTP 200 + 响应结构正确 |
| 5 | CI pipeline 构建 job 绿灯 | GitHub Actions 运行通过 |
| 6 | pre-commit hook 有效 | 故意引入弯引字被拒绝 |

---

## 10. 附录

### A. 快速验证命令

```bash
# 一键验证修复
cd /root/.openclaw/vibex

# 前端构建
cd vibex-fronted && npx next build

# 后端构建
cd ../vibex-backend && npm run build

# Unicode 检测
python3 -c "
import glob
files = glob.glob('vibex-backend/src/app/api/**/route.ts', recursive=True)
for f in files:
    with open(f, 'rb') as fh:
        for i, line in enumerate(fh.read().decode('utf-8').split('\n'), 1):
            for ch in line:
                if 0x2018 <= ord(ch) <= 0x201F:
                    print(f'FAIL {f}:{i}')
                    exit(1)
print('ALL PASS: No Unicode curly quotes')
"
```

### B. 相关文件路径

```
vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx   ← 问题1
vibex-backend/src/app/api/agents/route.ts                               ← 问题2
vibex-backend/src/app/api/pages/route.ts                                 ← 问题2
vibex-backend/src/app/api/prototype-snapshots/route.ts                  ← 问题2
```
