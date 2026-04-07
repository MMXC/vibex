# Spec: E3 - 技术债清理

## F3.1: canvasApi 错误处理

### 验收
```typescript
test('canvasApi 校验失败时 throw Error', async () => {
  const invalidResponse = { nodes: null, edges: undefined };
  expect(() => validateCanvasApi(invalidResponse)).toThrow();
});
```

---

## F3.2: MSW HTTP 级别拦截

### 验收
```typescript
test('MSW 拦截 HTTP 请求', async () => {
  const handler = http.get('**/api/canvas/**', () => HttpResponse.json({}));
  server.use(handler);
  const response = await fetch('/api/canvas/nodes');
  expect(response.status).toBe(200);
});
```

---

## F3.3: Playwright install CI

### 验收
```yaml
# .github/workflows/e2e-ci.yml
- name: Install browsers
  run: npx playwright install --with-deps chromium
```
