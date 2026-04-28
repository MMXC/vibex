# S17-P2-1: TypeScript noUncheckedIndexedAccess

**ID**: S17-P2-1
**标题**: TypeScript noUncheckedIndexedAccess
**优先级**: P2
**Sprint**: S17
**状态**: 待开发
**依赖**: 无

---

## 1. 问题描述

当前 `tsconfig.json` 开启了 `strict` + `strictNullChecks`，但**未开启 `noUncheckedIndexedAccess`**。这意味着数组下标访问（如 `arr[0]`）即使越界也返回 `T | undefined`，但 TypeScript 不强制检查下游代码处理 undefined。

历史上未开启可能是因为担心大规模重构。Sprint 16 的 TypeScript debt 清理（P001）已经解决了 169 个 TS 错误，这是继续推进的窗口期。

---

## 2. 影响范围

- `vibex-fronted/tsconfig.json`
- 所有使用数组下标访问的 `.ts/.tsx` 文件，重点审查：
  - `vibex-fronted/src/services/`（业务服务层）
  - `vibex-fronted/src/lib/`（工具库）

---

## 3. 前置条件

- `pnpm exec tsc --version` 可用
- `tsconfig.json` 可写

---

## 4. 验收标准（DoD）

| # | 断言 | 说明 |
|---|------|------|
| TS-01 | `"noUncheckedIndexedAccess": true` 存在于 `tsconfig.json` | 配置已添加 |
| TS-02 | `pnpm exec tsc --noEmit` 在 `vibex-fronted/` 返回 `0` errors | 全量编译通过 |
| TS-03 | `src/services/` 下所有数组下标访问通过类型检查 | 业务服务层无 TS 错误 |
| TS-04 | `src/lib/` 下所有数组下标访问通过类型检查 | 工具库无 TS 错误 |
| TS-05 | CI gate 通过（`.github/workflows/test.yml` 中 tsc 检查返回 0） | 自动化回归保护 |

---

## 5. 实现方案

### 5.1 修改 tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 5.2 扫描与修复工作流

```bash
# Step 1: 开启 flag，扫描错误数量
cd vibex-fronted
pnpm exec tsc --noEmit 2>&1 | grep -c "possibly undefined"  # 统计错误数

# Step 2: 分类错误
pnpm exec tsc --noEmit 2>&1 > /tmp/ts-errors.txt
grep "possibly undefined" /tmp/ts-errors.txt | head -50  # 查看前 50 个
grep "src/services/" /tmp/ts-errors.txt | wc -l          # services 层错误数
grep "src/lib/" /tmp/ts-errors.txt | wc -l              # lib 层错误数

# Step 3: 修复策略
# - 高风险（直接赋值给变量）：立即修复
# - 中风险（在条件判断中）：添加 undefined guard
# - 低风险（在循环中）：使用 for...of 或显式类型断言
```

### 5.3 高频修复模式

#### 模式 1：数组下标访问 + undefined 处理

```typescript
// 修复前
const first = arr[0];
const name = items[0].name;

// 修复后（方案 A：显式检查）
const first = arr[0];
if (first === undefined) return;
const name = first.name;

// 修复后（方案 B：非空断言（仅限极端情况））
// @ts-expect-error: 数组已确认非空
const first = arr[0]!;

// 修复后（方案 C：显式类型 + 默认值）
const first: T = arr[0] ?? fallbackDefault;
```

#### 模式 2：循环中使用下标

```typescript
// 修复前
for (let i = 0; i < items.length; i++) {
  process(items[i].id);
}

// 修复后
for (const item of items) {
  process(item.id);
}
```

#### 模式 3：对象属性访问（Object.keys/Object.values）

```typescript
// 修复前
const keys = Object.keys(obj);
const firstKey = keys[0];

// 修复后
const keys = Object.keys(obj) as (keyof T)[];
const firstKey = keys[0];
if (firstKey === undefined) return;
const value = obj[firstKey];
```

#### 模式 4：数组解构

```typescript
// 修复前
const [first, second] = arr;

// 修复后（方案 A）
const [first, second] = arr as [T, T, ...T[]]; // 使用元组类型

// 修复后（方案 B）
const [first, second, ...rest] = arr;
if (first === undefined || second === undefined) {
  throw new Error('Expected at least 2 items');
}
```

---

## 6. 完整测试代码

### 6.1 CI Gate 测试

```typescript
/**
 * ts-strict-gate.spec.ts — S17-P2-1 TypeScript noUncheckedIndexedAccess
 *
 * 验证：tsc --noEmit 在开启 noUncheckedIndexedAccess 后返回 0 errors
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '../../vibex-fronted');

test.describe('S17-P2-1: TypeScript noUncheckedIndexedAccess Gate', () => {
  test('tsconfig.json 包含 noUncheckedIndexedAccess: true', () => {
    const tsconfigPath = path.join(FRONTEND_ROOT, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    expect(tsconfig.compilerOptions?.noUncheckedIndexedAccess).toBe(true);
  });

  test('tsc --noEmit 返回 0 errors', () => {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      stdout = execSync('pnpm exec tsc --noEmit', {
        cwd: FRONTEND_ROOT,
        stdio: 'pipe',
        timeout: 120000,
      }).toString();
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1;
      stdout = (err as { stdout?: Buffer }).stdout?.toString() ?? '';
      stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? '';
    }

    // 如果有错误，打印前 20 行帮助调试
    if (exitCode !== 0) {
      console.log('=== tsc errors ===');
      console.log(stdout.split('\n').slice(0, 20).join('\n'));
      console.log('=== stderr ===');
      console.log(stderr);
    }

    expect(exitCode).toBe(0);
  });

  test('src/services/ 目录无类型错误', () => {
    let exitCode = 0;
    try {
      execSync('pnpm exec tsc --noEmit --pretty false 2>&1 | grep "src/services/"', {
        cwd: FRONTEND_ROOT,
        stdio: 'pipe',
        timeout: 120000,
      });
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 0;
    }
    // grep 返回 1 表示没有匹配（即无 services 层错误）
    expect(exitCode).toBe(1);
  });

  test('src/lib/ 目录无类型错误', () => {
    let exitCode = 0;
    try {
      execSync('pnpm exec tsc --noEmit --pretty false 2>&1 | grep "src/lib/"', {
        cwd: FRONTEND_ROOT,
        stdio: 'pipe',
        timeout: 120000,
      });
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 0;
    }
    expect(exitCode).toBe(1);
  });
});
```

### 6.2 CI Workflow 配置

在 `.github/workflows/ts-gate.yml`：

```yaml
name: TypeScript Type Check

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'vibex-fronted/src/**'
      - 'vibex-fronted/tsconfig.json'

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
        working-directory: vibex-fronted
      - name: Type check
        run: pnpm exec tsc --noEmit
        working-directory: vibex-fronted
```

---

## 7. 已知风险与缓解

### 风险 1：大量现有错误

**缓解**：开启前先运行 `pnpm exec tsc --noEmit` 统计错误数量。如果错误数 > 200，考虑分两步走：
1. 第一步：开启 flag + 添加白名单注释（`// @ts-expect-error: legacy`）
2. 第二步：Sprint 18 再逐步消除白名单

### 风险 2：第三方库类型不兼容

**缓解**：使用 `// @ts-ignore` 或在 `tsconfig.json` 中使用 `skipLibCheck: true`（当前已开启）。

### 风险 3：影响 CI 流水线

**缓解**：PR 前确保 `pnpm exec tsc --noEmit` 返回 0，再合并。错误信息需包含文件路径和行号。

---

## 8. DoD Checklist

- [ ] `tsconfig.json` 添加 `"noUncheckedIndexedAccess": true`
- [ ] `pnpm exec tsc --noEmit` 在 `vibex-fronted/` 返回 `0` errors
- [ ] `src/services/` 和 `src/lib/` 目录下无 TS 错误
- [ ] `pnpm playwright test ts-strict-gate.spec.ts` 全通过
- [ ] CI TypeScript gate 通过

---

## 9. 执行依赖

| 类型 | 内容 |
|------|------|
| 需要修改的文件 | `vibex-fronted/tsconfig.json` |
| 前置依赖 | 无 |
| 预计工时 | 2d（含全量扫描 + 高风险修复） |
| 验证命令 | `pnpm exec tsc --noEmit` |
