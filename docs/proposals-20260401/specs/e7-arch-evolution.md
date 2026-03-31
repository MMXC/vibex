# Spec: E7 - 架构演进

## 概述
React Flow 性能优化、文档版本化、API 拆分与响应校验。

## F7.1: React Flow 性能优化

### 规格
- 场景: 100 节点 Flow，PAN 操作
- 目标: FPS ≥ 30
- 优化: React.memo、viewport virtualization、边简化

### 验收
```typescript
test('100 nodes flow maintains >= 30 FPS', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => addNodes(100));
  const fps = await page.evaluate(() => measureFPS());
  expect(fps).toBeGreaterThanOrEqual(30);
});
```

---

## F7.2: 架构文档版本化

### 规格
- 文件: `docs/architecture/domain.md`
- 格式: 每个章节添加 `@updated: YYYY-MM-DD`
- 验证: 全部章节有日期

### 验收
```typescript
const chapters = parseDomainDoc();
const allDated = chapters.every(c => c.updatedAt !== null);
expect(allDated).toBe(true);
```

---

## F7.3: API Route 服务层拆分

### 规格
- 约束: API route 不直接操作 DB
- 层: `pages/api/` → `services/` → `models/`
- 测试: service 层可独立单元测试

### 验收
```typescript
// API route 不应直接调用 prisma.$queryRaw
const apiFiles = glob.sync('pages/api/**/*.ts');
for (const f of apiFiles) {
  const content = readFileSync(f, 'utf-8');
  expect(content).not.toMatch(/prisma\.\$query/);
}
```

---

## F7.4: canvasApi 响应校验

### 规格
- 库: Zod
- 范围: 所有 canvasApi 响应（`/api/canvas/*`）
- 错误: 校验失败时抛出 `ZodError` 并记录

### 验收
```typescript
test('canvasApi responses pass schema validation', async () => {
  const responses = await fetchCanvasApiResponses();
  for (const res of responses) {
    const result = canvasApiSchema.safeParse(res);
    expect(result.success).toBe(true);
  }
});
```
