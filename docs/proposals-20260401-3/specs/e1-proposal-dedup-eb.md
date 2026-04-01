# Spec: E1 - proposal-dedup + ErrorBoundary

## 概述
解决通知去重机制生产验证缺失 + ErrorBoundary 组件不统一问题。

## F1.1: 通知去重机制

### 规格
- 去重键: `task_id` + `5min` 窗口
- 实现: 内存 Map（task_id → timestamp）
- CLI: `notify --check-existing <task_id>` 检查队列状态

### 验收
```typescript
test('same task_id within 5min does not duplicate', () => {
  const dedup = new NotificationDedup(5 * 60 * 1000);
  dedup.mark('task-123', Date.now());
  expect(dedup.shouldSend('task-123', Date.now() + 2 * 60 * 1000)).toBe(false);
  expect(dedup.shouldSend('task-123', Date.now() + 6 * 60 * 1000)).toBe(true); // outside window
});

test('different task_ids do not block each other', () => {
  const dedup = new NotificationDedup(5 * 60 * 1000);
  dedup.mark('task-A', Date.now());
  expect(dedup.shouldSend('task-B', Date.now())).toBe(true);
});
```

---

## F1.2: CLI --check-existing flag

### 规格
- 命令: `openclaw notify --check-existing <task_id>`
- 行为: 检查 task_manager 队列中该 task_id 状态，若状态未变则 skip

### 验收
```typescript
test('--check-existing returns 0 when no change needed', async () => {
  const result = await exec('openclaw notify --check-existing task-123');
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('SKIP');
});
```

---

## F1.3: AppErrorBoundary 统一组件

### 规格
- 文件: `components/common/AppErrorBoundary.tsx`
- 行为: 捕获 React 树中任何位置的错误，显示 fallback UI
- Fallback UI: 友好错误提示（非白屏）+ 重试按钮 + 错误日志 ID

### 验收
```typescript
test('AppErrorBoundary is default export', () => {
  const exports = require('components/common/AppErrorBoundary');
  expect(exports.default).toBeDefined();
});

test('error boundary catches render error', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => {
    // Trigger error
    throw new Error('Test error');
  });
  expect(page.locator('[data-testid="error-fallback"]')).toBeVisible();
  expect(page.locator('[data-testid="error-fallback"]')).not.toContain('Application Error');
});
```

### 【需页面集成】✅

---

## F1.4: 页面 ErrorBoundary 替换

### 规格
- 替换范围: Canvas 页面、Export 页面
- 验证: 项目中仅存在 1 个 ErrorBoundary（AppErrorBoundary）
- grep: `grep -r "ErrorBoundary" components/` 仅返回 AppErrorBoundary

### 验收
```typescript
test('only AppErrorBoundary exists in components', async () => {
  const results = await exec("grep -r 'ErrorBoundary' components/ --include='*.tsx'");
  const lines = results.trim().split('\n').filter(l => !l.includes('AppErrorBoundary'));
  expect(lines.length).toBe(0);
});
```
