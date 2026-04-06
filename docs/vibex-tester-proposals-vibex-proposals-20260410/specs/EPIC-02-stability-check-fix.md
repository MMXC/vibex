# Epic 2: 稳定性监控修复

**Epic ID**: E2
**项目**: vibex-tester-proposals-vibex-proposals-20260410
**概述**: 修复 stability.spec.ts 检查路径错误，使 F1.1/F1.2/F1.3 稳定性检查真正生效

---

## 1. 背景

`tests/e2e/stability.spec.ts` 定义检查路径：
```ts
const E2E_DIR = resolve(__dirname, '../../e2e');
```
`./e2e/` 目录在项目中不存在。E2E 测试实际在 `vibex-fronted/tests/e2e/`。

结果：F1.1 检查（waitForTimeout 清理）永远返回 0 个结果，掩盖真实问题。

## 2. 范围

### 2.1 包含
- 修改 stability.spec.ts 中 E2E_DIR 路径
- 添加目录存在性断言（不存在时 FAIL 而非 PASS）
- 修正 F1.2 canvas-e2e 测试路径检查
- 验证 F1.1/F1.2/F1.3 在正确路径上运行

### 2.2 不包含
- waitForTimeout 清理（Epic 3）
- daily-stability.md 建立（单独 Epic）

## 3. 技术方案

### 3.1 路径修复

**修改前** (`tests/e2e/stability.spec.ts`):
```ts
const E2E_DIR = resolve(__dirname, '../../e2e');
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```

**修改后**:
```ts
const E2E_DIR = resolve(__dirname, './tests/e2e');
const testFiles = globSync('tests/e2e/**/*.spec.ts', { cwd: resolve(__dirname, '..') });
```

### 3.2 目录存在性断言

```ts
import { existsSync } from 'fs';
import { strictEqual } from 'assert';

// 在测试开始前添加
strictEqual(existsSync(E2E_DIR), true, 
  `E2E_DIR ${E2E_DIR} does not exist. Stability checks will be skipped.`);
```

### 3.3 F1.2 canvas-e2e 路径检查

F1.2 当前检查 playwright.config.ts 中的 canvas-e2e testDir。修复后应检查：
```ts
const configPath = resolve(__dirname, '../playwright.config.ts');
// 确保 testDir: './tests/e2e' 而非 './e2e'
```

### 3.4 验证

```bash
cd vibex-fronted && npx playwright test stability.spec.ts --project=chromium
# 应正常运行（非 "0 tests found"）
# waitForTimeout 残留应被检测到（Epic 3 清理后为 0）
```

## 4. 验收标准

| Story | 验收条件 | 验证命令 |
|-------|---------|---------|
| S2.1 | E2E_DIR 指向 `./tests/e2e/` | `grep "E2E_DIR" vibex-fronted/tests/e2e/stability.spec.ts` 包含 `./tests/e2e/` |
| S2.1 | 目录不存在时测试 FAIL | 临时 mv tests/e2e/ tmp && npx playwright test stability.spec.ts; 应 FAIL |
| S2.1 | stability.spec.ts 运行正常 | `npx playwright test stability.spec.ts --project=chromium` 不含 "0 tests found" |
| S2.2 | F1.1 在正确路径检测 waitForTimeout | stability.spec.ts 运行后 F1.1 检查返回正确结果（非 0 除非 Epic 3 完成） |
| S2.2 | F1.2 检测 canvas-e2e testDir 正确性 | stability F1.2 PASS |

## 5. 预期文件变更

```
# 修改
vibex-fronted/tests/e2e/stability.spec.ts
```

## 6. 风险

- 修复路径后，F1.1 会立即检测到 20+ 处 waitForTimeout 残留（Epic 3 的工作量）
- 缓解: Epic 3 在 Epic 2 之后紧接着 Sprint Day 2

## 7. 依赖

- Epic 1（Playwright 配置统一）: stability.spec.ts 需要正确的配置加载
- 无外部依赖
