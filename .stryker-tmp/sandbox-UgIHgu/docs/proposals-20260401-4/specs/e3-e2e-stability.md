# Spec: E3 - E2E 测试稳定性加固

## 概述
解决 E2E 测试偶发超时问题，确保测试结果可信。

## F3.1: 测试隔离（afterEach cleanup）

### 规格
- 要求: 每个 E2E 测试文件有 `afterEach` cleanup
- 清理: localStorage、global state、mock handlers

### 验收
```typescript
test('canvas E2E files have afterEach cleanup', () => {
  const testFiles = glob.sync('e2e/**/*.spec.ts');
  for (const f of testFiles) {
    const content = readFileSync(f, 'utf-8');
    if (f.includes('canvas')) {
      expect(content).toMatch(/afterEach\s*\(/);
    }
  }
});
```

---

## F3.2: waitForResponse 替代 waitForTimeout

### 规格
- 替换: canvas E2E 中所有 `waitForTimeout(n)` 替换为 `waitForResponse`
- 原因: timeout 不稳定，response 等待更可靠

### 验收
```typescript
test('no waitForTimeout in canvas E2E', () => {
  const canvasTests = glob.sync('e2e/**/canvas*.spec.ts');
  for (const f of canvasTests) {
    const content = readFileSync(f, 'utf-8');
    expect(content).not.toMatch(/waitForTimeout\s*\(/);
  }
});
```

---

## F3.3: CI blocking 配置

### 规格
- 配置: `.github/workflows/e2e-ci.yml` 中 E2E 失败时 `exit 1`
- 验证: workflow 定义中 `if: failure()` 不存在（应该是 `if: cancelled()` 即可）

### 验收
```typescript
test('E2E CI fails on test failure', () => {
  const ciFile = readFileSync('.github/workflows/e2e-ci.yml', 'utf-8');
  // E2E step 应该没有 "continue-on-error: true"
  expect(ciFile).not.toMatch(/continue-on-error:\s*true/);
});
```

---

## F3.4: 连续运行验证

### 规格
- 验证: E2E 测试连续运行 3 次，结果一致（flaky = 0）
- 工具: `npx playwright test` × 3

### 验收
```bash
# 验证无 flaky 测试
cd vibex
npx playwright test --project=chromium > /tmp/run1.txt 2>&1
npx playwright test --project=chromium > /tmp/run2.txt 2>&1  
npx playwright test --project=chromium > /tmp/run3.txt 2>&1

# 比较 3 次结果（passed/failed 数应一致）
PASSED=$(grep -c "passed" /tmp/run1.txt)
FAILED=$(grep -c "failed" /tmp/run1.txt)
# run2 和 run3 应与 run1 一致
```
