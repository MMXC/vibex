# SPEC：Canvas 按钮文案替换

**功能点**: F1.1, F1.2, F1.3, F1.4  
**类型**: Bug Fix / UI Copy Fix  
**预计工时**: 15 分钟

---

## 1. 修改范围

### 1.1 搜索关键词

| 类型 | 关键词 |
|------|--------|
| 原文案 | `AI生成上下文` |
| 加载态原文案 | `AI生成上下文中...`（若存在） |

### 1.2 替换目标

| 类型 | 新文案 |
|------|--------|
| 按钮文案 | `重新执行` |
| 加载态文案 | `重新执行中...`（若原文案存在） |

### 1.3 搜索路径

```
src/app/canvas/**/*.{tsx,ts}
src/components/canvas/**/*.{tsx,ts}
```

---

## 2. 预期修改示例

### Before

```tsx
<Button onClick={handleGenerate}>
  {isLoading ? 'AI生成上下文中...' : 'AI生成上下文'}
</Button>
```

### After

```tsx
<Button onClick={handleGenerate}>
  {isLoading ? '重新执行中...' : '重新执行'}
</Button>
```

---

## 3. 测试用例

### TC-01: 按钮文案验证

```typescript
it('Canvas 按钮显示"重新执行"', () => {
  render(<CanvasPage />);
  const btn = screen.getByRole('button', { name: /重新执行/i });
  expect(btn).toBeInTheDocument();
});
```

### TC-02: 加载态文案验证

```typescript
it('点击时按钮显示"重新执行中..."', async () => {
  render(<CanvasPage />);
  const btn = screen.getByRole('button', { name: /重新执行/i });
  fireEvent.click(btn);
  const loadingBtn = screen.getByRole('button', { name: /重新执行中/i });
  expect(loadingBtn).toBeInTheDocument();
});
```

### TC-03: 无残留验证

```typescript
it('全局无"AI生成上下文"残留', () => {
  const result = grepSync('src', /AI生成上下文/);
  expect(result.length).toBe(0);
});
```

---

## 4. gstack 验证步骤

1. 访问 `https://vibex-app.pages.dev/canvas`
2. 截图确认按钮文案为「重新执行」
3. 点击按钮，观察加载态文案
4. 截图确认加载态文案为「重新执行中...」

---

## 5. 合入标准

- [ ] `grep -r "AI生成上下文" src/` 返回 0 结果
- [ ] `grep -r "重新执行" src/` 找到预期替换结果
- [ ] E2E 测试全部通过
- [ ] Code Review 通过
