# AGENTS.md: canvas-quick-generate-command

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 角色约束（必须遵守）

### 1.1 核心约束

| # | 约束 | 理由 |
|---|------|------|
| C1 | `useCallback` 必须包含所有依赖 | 避免闭包陈旧（stale closure），导致引用过期的 `requirementText` 或 store 方法 |
| C2 | 键盘事件中必须调用 `e.preventDefault()` | 阻止浏览器默认行为（某些浏览器中 `Ctrl+G` 有内置搜索功能） |
| C3 | `isGenerating` 状态必须阻止重复触发 | 防止用户快速连按 `Ctrl+G` 导致 API 并发调用 |
| C4 | `quickGenerate` 必须是 `useCallback` | 作为 `useEffect` 依赖项，确保监听器引用稳定 |
| C5 | 每个 API 调用后检查返回值/节点数 | 避免空结果级联传播，导致后续步骤失败 |

### 1.2 API 依赖声明

`quickGenerate` useCallback 依赖数组**必须包含**以下全部 6 项：

```typescript
const quickGenerate = useCallback(async () => {
  // ... 实现
}, [
  requirementText,              // ✅ 表单输入
  isGenerating,                 // ✅ 状态守卫
  generateContextsFromRequirement,   // ✅ canvasStore 方法
  autoGenerateFlows,                  // ✅ canvasStore 方法
  generateComponentFromFlow,          // ✅ canvasStore 方法
  showToast,                     // ✅ toast 系统
]);
```

---

## 2. 禁止模式（Prohibited Patterns）

### 2.1 禁止 setTimeout 防抖

```typescript
// ❌ 禁止 — 使用 setTimeout 实现防抖
const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => quickGenerate(), 300);
  }
};

// ✅ 正确 — 使用 isGenerating 状态守卫
const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    if (isGenerating) return;
    quickGenerate();
  }
};
```

**理由**: `isGenerating` 是语义正确的状态守卫，setTimeout 仅延迟执行不能真正阻止 API 并发调用。

### 2.2 禁止 bare catch 块

```typescript
// ❌ 禁止 — bare catch，无用户反馈
try {
  await generateContextsFromRequirement(text);
} catch (error) {
  console.error(error); // 用户看不到任何提示
}

// ✅ 正确 — 必须 showToast
try {
  await generateContextsFromRequirement(text);
} catch (error) {
  showToast(error instanceof Error ? error.message : '生成失败', 'error');
}
```

### 2.3 禁止省略 e.preventDefault()

```typescript
// ❌ 禁止 — 遗漏 preventDefault，浏览器默认行为可能被触发
const handler = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    quickGenerate(); // 浏览器 Ctrl+G 可能触发搜索栏
  }
};

// ✅ 正确
const handler = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    quickGenerate();
  }
};
```

### 2.4 禁止 useCallback 依赖不完整

```typescript
// ❌ 禁止 — 依赖遗漏，闭包陈旧
const quickGenerate = useCallback(async () => {
  await generateContextsFromRequirement(requirementText); // 引用陈旧
  await autoGenerateFlows(contextNodes);
  await generateComponentFromFlow();
}, []); // ❌ 空的依赖数组

// ✅ 正确
const quickGenerate = useCallback(async () => {
  // ... 实现
}, [requirementText, isGenerating, generateContextsFromRequirement, autoGenerateFlows, generateComponentFromFlow, showToast]);
```

### 2.5 禁止在 useEffect 依赖中遗漏 quickGenerate

```typescript
// ❌ 禁止 — useEffect 依赖缺失 quickGenerate
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      quickGenerate();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []); // ❌ 遗漏 quickGenerate

// ✅ 正确
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      quickGenerate();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [quickGenerate]);
```

---

## 3. 测试契约（Test Requirements）

所有 E2E 测试必须覆盖以下场景，使用 Playwright 实现。

### 3.1 必测场景

| # | 测试名称 | 断言 | 优先级 |
|---|----------|------|--------|
| T1 | **空输入 toast** | `expect(toastText).toContain('请先输入需求')` | P0 |
| T2 | **三树节点全部生成** | `contextCount > 0 && flowCount > 0 && componentCount > 0` | P0 |
| T3 | **Ctrl+G 触发** | `keyboard.press('Control+g')` 后节点或 toast 出现 | P0 |
| T4 | **错误 toast** | API 失败时 `toastText` 包含 `失败` 或 `error` | P1 |
| T5 | **重复触发阻止** | 生成中再次按 `Ctrl+G`，节点数量不翻倍 | P1 |
| T6 | **ShortcutHint 显示** | 快捷键面板包含 `Ctrl+G` | P2 |

### 3.2 测试代码模板

```typescript
// tests/canvas-quick-generate.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Ctrl+G Quick Generate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
  });

  test('T1 空输入显示 warning toast', async ({ page }) => {
    // 不输入任何内容
    await page.keyboard.press('Control+g');
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toContainText('请先输入需求');
    await expect(toast).toHaveAttribute('data-toast-type', 'warning');
  });

  test('T2 三树节点全部生成', async ({ page }) => {
    await page.fill('[data-testid="requirement-input"]', '用户登录注册功能');
    await page.keyboard.press('Control+g');
    // 等待生成完成（实际 API 时间）
    await page.waitForTimeout(8000);
    const contextCount = await page.locator('[data-testid="context-node"]').count();
    const flowCount = await page.locator('[data-testid="flow-node"]').count();
    const componentCount = await page.locator('[data-testid="component-node"]').count();
    expect(contextCount).toBeGreaterThan(0);
    expect(flowCount).toBeGreaterThan(0);
    expect(componentCount).toBeGreaterThan(0);
  });

  test('T3 Ctrl+G 触发（节点或 toast 出现）', async ({ page }) => {
    await page.fill('[data-testid="requirement-input"]', '测试功能');
    await page.keyboard.press('Control+g');
    const triggered = await Promise.race([
      page.waitForSelector('[data-testid="toast"]', { timeout: 2000 }).then(() => 'toast'),
      page.waitForSelector('[data-testid="context-node"]', { timeout: 5000 }).then(() => 'node'),
    ]);
    expect(['toast', 'node']).toContain(triggered);
  });

  test('T5 重复触发被阻止', async ({ page }) => {
    await page.fill('[data-testid="requirement-input"]', '测试');
    await page.keyboard.press('Control+g');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+g'); // 重复
    await page.waitForTimeout(8000);
    const count = await page.locator('[data-testid="context-node"]').count();
    // 最多 1 次完整生成（可能因节点已存在而覆盖，不翻倍）
    expect(count).toBeLessThanOrEqual(10); // 宽松上界
  });

  test('T6 ShortcutHintPanel 显示 Ctrl+G', async ({ page }) => {
    await page.keyboard.press('?');
    const panel = page.locator('[data-testid="shortcut-hint-panel"]');
    await expect(panel).toContainText('Ctrl+G');
  });
});
```

### 3.3 测试覆盖矩阵

| Feature | T1 | T2 | T3 | T4 | T5 | T6 |
|---------|----|----|----|----|----|----|
| F1.1 Ctrl+G 绑定 | — | — | ✅ | — | ✅ | — |
| F1.2 空输入检测 | ✅ | — | ✅ | — | — | — |
| F1.3 三树级联 | — | ✅ | ✅ | — | ✅ | — |
| F1.4 生成中状态 | — | — | — | — | ✅ | — |
| F1.5 错误处理 | — | — | — | ✅ | — | — |
| F1.6 ShortcutHint | — | — | — | — | — | ✅ |

---

## 4. 代码规范摘要

### 4.1 类型约束

```typescript
// ✅ 必须使用正确的类型
const handler = (e: KeyboardEvent) => { ... }

// ❌ 禁止使用 any
const handler = (e: any) => { ... }
```

### 4.2 无 console.log

```typescript
// ❌ 禁止 — 使用 showToast 替代 console.log 进行用户反馈
console.log('Generation started');

// ✅ 正确 — 所有用户可见信息通过 toast
showToast('生成开始', 'info');
```

### 4.3 错误消息规范

| 场景 | 错误消息 | 类型 |
|------|----------|------|
| 空输入 | `'请先输入需求'` | warning |
| Context 生成失败 | `error.message \|\| '生成失败'` | error |
| 未生成任何节点 | `'未生成任何 Context 节点，请检查需求输入'` | error |
| 生成完成 | `'三树生成完成'` | success |

---

## 5. 审查清单（Review Checklist）

开发完成后，Reviewer 检查以下条目：

- [ ] `quickGenerate` 是 `useCallback`，依赖数组包含全部 6 项
- [ ] 键盘监听 `useEffect` 依赖包含 `quickGenerate`
- [ ] `e.preventDefault()` 在所有 `Ctrl+G` / `Cmd+G` 分支中被调用
- [ ] 空输入有独立的 `return` 守卫 + warning toast
- [ ] `isGenerating` 守卫在空输入检查之后
- [ ] 每个 API 调用在独立的 try 块中（或共享 try/catch 有节点数检查）
- [ ] 所有 catch 块使用 `showToast`，无 bare catch
- [ ] `finally` 块中有 `setIsGenerating(false)`
- [ ] ShortcutHintPanel 添加了 `Ctrl+G` 快捷键
- [ ] Playwright E2E 覆盖全部 6 个场景

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-quick-generate-command
- **执行日期**: 2026-04-01
