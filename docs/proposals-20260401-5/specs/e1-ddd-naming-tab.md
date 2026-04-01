# Spec: E1 - DDD 命名规范 + Tab 快捷键

## F1.1-F1.3: DDD 命名规范文档

### 规格
- 文件: `docs/ddd-naming-convention.md`
- 包含: 允许模式（≥ 5）+ 禁止模式（≥ 5）

### 允许模式
| 模式 | 示例 | 说明 |
|------|------|------|
| 业务动词 | 患者档案、订单处理、库存管理 | 领域核心概念 |
| 流程节点 | 审批流程、支付流程、退款流程 | 业务流程 |
| 实体名称 | 用户、角色、权限 | 通用实体 |

### 禁止模式
| 模式 | 示例 | 说明 |
|------|------|------|
| 泛化后缀 | xxx管理、xxx系统 | 无领域含义 |
| 编号命名 | Entity1、Object2 | 无业务含义 |
| 英文直译 | DataList、InfoManager | 非 DDD 术语 |

### 验收
```typescript
test('DDD naming convention doc exists', () => {
  const path = 'docs/ddd-naming-convention.md';
  expect(existsSync(path)).toBe(true);
});

test('doc contains >= 5 valid patterns', () => {
  const content = readFileSync(path, 'utf-8');
  const validMatches = content.match(/^## 允许模式[\s\S]*?(?=##|$)/gm);
  expect(validMatches?.length ?? 0).toBeGreaterThanOrEqual(5);
});

test('doc contains >= 5 forbidden patterns', () => {
  const content = readFileSync(path, 'utf-8');
  const forbiddenMatches = content.match(/^## 禁止模式[\s\S]*?(?=##|$)/gm);
  expect(forbiddenMatches?.length ?? 0).toBeGreaterThanOrEqual(5);
});
```

---

## F1.4-F1.7: Tab 快捷键

### 规格
- 快捷键: Alt+1 (Context), Alt+2 (Flow), Alt+3 (Component)
- 绑定: CanvasPage useEffect keydown 监听
- 显示: ShortcutHintPanel 添加说明

### 验收
```typescript
test('Alt+1 switches to Context', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('Alt+2'); // 先切换到 Flow
  await page.waitForTimeout(100);
  
  await page.keyboard.press('Alt+1');
  await page.waitForTimeout(100);
  
  const activeTree = await page.evaluate(() => store.getState().activeTree);
  expect(activeTree).toBe('context');
});

test('Alt+2 switches to Flow', async ({ page }) => {
  await page.goto('/canvas');
  await page.keyboard.press('Alt+1');
  await page.waitForTimeout(100);
  
  await page.keyboard.press('Alt+2');
  const activeTree = await page.evaluate(() => store.getState().activeTree);
  expect(activeTree).toBe('flow');
});

test('ShortcutHintPanel shows Alt+1/2/3', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="shortcut-hint-btn"]');
  const hintText = await page.textContent('[data-testid="shortcut-panel"]');
  expect(hintText).toContain('Alt+1');
  expect(hintText).toContain('Alt+2');
  expect(hintText).toContain('Alt+3');
});
```

### 【需页面集成】✅
