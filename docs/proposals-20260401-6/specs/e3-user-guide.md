# Spec: E3 - 用户手册文档

## F3.1: user-guide.md 存在

### 规格
- 文件: `docs/user-guide.md`
- 章节: ≥ 10 章

### 验收
```typescript
test('user-guide.md exists', () => {
  expect(existsSync('docs/user-guide.md')).toBe(true);
  const content = readFileSync('docs/user-guide.md', 'utf-8');
  const chapters = content.match(/^## /gm) || [];
  expect(chapters.length).toBeGreaterThanOrEqual(10);
});
```

---

## F3.2: 核心操作说明

### 规格
章节:
1. 画布基础操作
2. 添加节点
3. 连接边
4. 导出代码
5. 快捷键
6. 导出为 PNG/SVG
7. 批量导出
8. 快捷生成（Ctrl+G）
9. Tab 切换（Alt+1/2/3）
10. 撤销/重做

### 验收
```typescript
test('包含 5+ 核心操作', () => {
  const content = readFileSync('docs/user-guide.md', 'utf-8');
  const operations = ['画布', '节点', '导出', '快捷键', 'Ctrl+G', 'Alt+'];
  const found = operations.filter(op => content.includes(op));
  expect(found.length).toBeGreaterThanOrEqual(5);
});
```

---

## F3.3: /help 入口

### 规格
- 路由: `/help`
- 显示: user-guide.md 内容

### 验收
```typescript
test('/help 页面可访问', async ({ page }) => {
  await page.goto('/help');
  expect(page.locator('[data-testid="user-guide"]')).toBeVisible();
});
```

### 【需页面集成】✅
