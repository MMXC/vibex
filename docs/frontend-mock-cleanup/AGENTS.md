# AGENTS.md — frontend-mock-cleanup 开发约束

**项目**: frontend-mock-cleanup
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 E1 核心约束

```typescript
// ✅ 正确：替换为真实数据源
const boundedContextTree = useCanvasStore(s => s.boundedContextTree);
const drafts = boundedContextTree?.nodes ?? [];

// ✅ 正确：空状态而非 mock
if (!projectId) return { nodes: [], projectId: null, name: '项目分析' };

// ❌ 错误：保留任何 return MOCK_DATA
if (someCondition) return MOCK_DATA;  // ← 禁止

// ❌ 错误：保留 mock 函数调用
const drafts = mockGenerateContexts('');  // ← 禁止
```

### 1.2 数据契约约束

```typescript
// CanvasTree 组件必须从 canvasStore 获取数据，禁止硬编码
// ✅ 正确
const boundedContextTree = useCanvasStore(s => s.boundedContextTree);
const drafts = boundedContextTree?.nodes ?? [];

// ❌ 错误：从 hook 返回的固定数据
const drafts = MOCK_DATA.nodes;  // ← 禁止
```

### 1.3 空状态处理约束

```typescript
// ✅ 正确：所有组件必须处理空数据场景
{drafts.length === 0 ? (
  <EmptyState message="暂无数据，请先生成上下文" />
) : (
  drafts.map(d => <NodeItem key={d.nodeId} node={d} />)
)}

// ❌ 错误：假设数据一定存在
{drafts.map(d => <NodeItem node={d} />)}  // ← 无空状态保护
```

---

## 2. Git 提交规范

### 2.1 Commit Message 格式

```
<type>(<scope>): <subject>

<type>: refactor | fix | test
<scope>: mock-cleanup | canvas-tree | useProjectTree
```

### 2.2 示例

```bash
refactor(useProjectTree): 移除3处 MOCK_DATA return，改为空状态
refactor(canvas-tree): BoundedContextTree 替换为 canvasStore 数据源
refactor(canvas-tree): ComponentTree 移除 mockGenerateComponents
fix(mock-cleanup): cleanup-mocks.js 跳过 test-utils 目录
test(canvas-tree): 添加 Canvas 三树渲染 E2E 测试
```

---

## 3. 代码审查清单

### E1-F1 useProjectTree.ts
- [ ] `return MOCK_DATA` 语句已移除（grep 验证）
- [ ] `useMockOnError` 变量无其他引用时可删除
- [ ] 空状态返回 `{ nodes: [], ... }` 而非 `null` 或 `undefined`
- [ ] 调用方（CanvasPage 等）处理空状态不崩溃

### E1-F2 BoundedContextTree.tsx
- [ ] `mockGenerateContexts` 函数调用已替换
- [ ] `mockGenerateContexts` 函数本身已删除（无其他引用时）
- [ ] `MOCK_CONTEXT_TEMPLATES` 常量已删除（无其他引用时）
- [ ] 使用 `useCanvasStore` 获取真实数据

### E1-F3 ComponentTree.tsx
- [ ] `mockGenerateComponents` 函数调用已替换
- [ ] `mockGenerateComponents` 函数本身已删除
- [ ] `MOCK_COMPONENT_TEMPLATES` 常量已删除
- [ ] 使用 `useCanvasStore` 获取真实数据

### E2-F1 cleanup-mocks.js
- [ ] `SKIP_PATTERNS` 包含 `/test-utils/`
- [ ] `test-utils` 文件不再出现在脚本输出中

---

## 4. 测试规范

### 4.1 静态检查测试（必须）

```typescript
// tests/mock-cleanup/static-check.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('E1: Mock 清理静态检查', () => {
  const srcDir = path.join(__dirname, '../../src');

  it('useProjectTree.ts 无 return MOCK_DATA', () => {
    const source = fs.readFileSync(path.join(srcDir, 'hooks/useProjectTree.ts'), 'utf-8');
    expect(source).not.toMatch(/return MOCK_DATA;/);
  });

  it('BoundedContextTree.tsx 无 mockGenerateContexts', () => {
    const source = fs.readFileSync(
      path.join(srcDir, 'components/canvas/BoundedContextTree.tsx'), 'utf-8'
    );
    expect(source).not.toMatch(/mockGenerateContexts/);
  });

  it('ComponentTree.tsx 无 mockGenerateComponents', () => {
    const source = fs.readFileSync(
      path.join(srcDir, 'components/canvas/ComponentTree.tsx'), 'utf-8'
    );
    expect(source).not.toMatch(/mockGenerateComponents/);
  });
});
```

### 4.2 Playwright E2E（必须）

```typescript
// e2e/canvas/mock-cleanup-verify.spec.ts
import { test, expect } from '@playwright/test';

test('Canvas 三树正常渲染（无 mock）', async ({ page }) => {
  await page.goto('/canvas');
  
  // 等待三树加载（真实数据或空状态，不崩溃）
  await expect(page.locator('[data-testid="context-tree"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="flow-tree"]')).toBeVisible();
  await expect(page.locator('[data-testid="component-tree"]')).toBeVisible();
  
  // 无 console error
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.reload();
  await page.waitForTimeout(2000);
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});
```

---

## 5. 回滚条件

若以下任一条件满足，立即回滚：

| 触发条件 | 回滚命令 |
|---------|---------|
| Canvas 页面崩溃（白屏 > 5s） | `git checkout HEAD -- src/hooks/useProjectTree.ts src/components/canvas/` |
| 三树组件 `undefined` 错误 | 同上 |
| Playwright E2E 失败 | 同上 + 检查 store 初始化 |

---

*本文档由 Architect Agent 生成于 2026-04-04 18:52 GMT+8*
