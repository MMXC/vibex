# Epic 3: waitForTimeout 清理

**Epic ID**: E3
**项目**: vibex-tester-proposals-vibex-proposals-20260410
**概述**: 替换 E2E 测试中的 20+ 处 waitForTimeout 为确定性等待，提升测试稳定性

---

## 1. 背景

`waitForTimeout` 是非确定性的硬等待，在 CI 环境和慢网络下容易超时失败。当前在以下文件中残留：

| 文件 | 残留数 | timeout 范围 |
|------|--------|-------------|
| conflict-resolution.spec.ts | 8 | 500ms ~ 2000ms |
| conflict-dialog.spec.ts | 6 | 500ms ~ 3000ms |
| auto-save.spec.ts | 5 | 500ms ~ 2500ms |
| homepage-tester-report.spec.ts | 1 | 2000ms |
| login-state-fix.spec.ts | 2 | 1000ms ~ 2000ms |

**总计**: 20+ 处

## 2. 范围

### 2.1 包含
- 替换所有 spec 文件中的 waitForTimeout
- 添加 ESLint 规则检测新增的 waitForTimeout
- 验证 stability.spec.ts F1.1 通过（0 残留）

### 2.2 不包含
- 修改 E2E 测试的业务逻辑（仅替换等待方式）
- 修改 API 或前端代码

## 3. 替换策略

### 3.1 conflict-resolution.spec.ts

```ts
// 修改前
await page.waitForTimeout(1000);

// 修改后（优先方案）
await page.waitForResponse(
  (response) => response.url().includes('/api/') && response.status() === 200,
  { timeout: 5000 }
);

// 修改后（备选方案，UI 状态变化场景）
await page.waitForSelector('.conflict-dialog', { state: 'visible', timeout: 5000 });

// 修改后（网络空闲场景）
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

### 3.2 conflict-dialog.spec.ts

同 3.1 策略。重点关注：
- 冲突对话框打开 → `waitForSelector('.conflict-dialog', { state: 'visible' })`
- API 响应返回 → `waitForResponse('/api/conflicts/')`

### 3.3 auto-save.spec.ts

```ts
// 修改前
await page.waitForTimeout(2500);

// 修改后
await page.waitForResponse(
  /\/api\/.*snapshot/,
  { timeout: 5000 }
);
```

### 3.4 homepage-tester-report.spec.ts & login-state-fix.spec.ts

- `waitForTimeout(2000)` → `page.waitForLoadState('networkidle')`
- `waitForTimeout(1000)` → `page.waitForResponse(/\/api\/.*/)`

### 3.5 ESLint 规则

在 `.eslintrc.js` 中添加：
```js
rules: {
  // 检测 waitForTimeout 的使用
  'no-restricted-syntax': [
    'error',
    {
      selector: 'CallExpression[callee.name="waitForTimeout"]',
      message: 'Use deterministic waits instead of waitForTimeout. ' +
        'Prefer page.waitForSelector(), page.waitForResponse(), or page.waitForLoadState().'
    }
  ]
}
```

## 4. 验收标准

| Story | 验收条件 | 验证命令 |
|-------|---------|---------|
| S3.1 | conflict-resolution.spec.ts 中 waitForTimeout 残留为 0 | `grep -c "waitForTimeout" vibex-fronted/tests/e2e/conflict-resolution.spec.ts` 返回 0 |
| S3.2 | conflict-dialog.spec.ts 中 waitForTimeout 残留为 0 | `grep -c "waitForTimeout" vibex-fronted/tests/e2e/conflict-dialog.spec.ts` 返回 0 |
| S3.3 | auto-save.spec.ts 中 waitForTimeout 残留为 0 | `grep -c "waitForTimeout" vibex-fronted/tests/e2e/auto-save.spec.ts` 返回 0 |
| S3.4 | 所有 spec 文件中 waitForTimeout 残留为 0 | `grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.spec.ts" -v "flaky\|comment\|FIXME\|//\|/\*"` 返回 0 行 |
| S3.4 | ESLint 规则能检测新增的 waitForTimeout | 新增 `waitForTimeout(100)` 后运行 `pnpm eslint` 应报错 |
| 全局 | stability.spec.ts F1.1 PASS | `npx playwright test stability.spec.ts --project=chromium` F1.1 PASS |

## 5. 预期文件变更

```
# 修改
vibex-fronted/tests/e2e/conflict-resolution.spec.ts
vibex-fronted/tests/e2e/conflict-dialog.spec.ts
vibex-fronted/tests/e2e/auto-save.spec.ts
vibex-fronted/tests/e2e/homepage-tester-report.spec.ts
vibex-fronted/tests/e2e/login-state-fix.spec.ts
vibex-fronted/.eslintrc.js                           # 添加规则
```

## 6. 风险

- 替换后测试行为可能不同（等待条件过于宽松或过于严格）
- 缓解: 每次替换后运行对应 spec 验证行为不变
- stability.spec.ts 修复后（Epic 2）会立即暴露残留数量，有心理准备

## 7. 依赖

- Epic 2（stability.spec.ts 修复）: F1.1 需要正确路径才能真正检测残留
