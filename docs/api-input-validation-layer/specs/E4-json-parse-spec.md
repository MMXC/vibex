# E4 Spec: JSON.parse 容错处理

## 扫描命令
```bash
grep -rn "JSON.parse" vibex-backend/src --include="*.ts" | grep -v "try\|catch"
```

## 修复模板
```typescript
// Before
const data = JSON.parse(rawData);

// After
let data: unknown;
try {
  data = JSON.parse(rawData);
} catch {
  return Response.json(
    { success: false, error: 'Invalid JSON format' },
    { status: 400 }
  );
}
```

## 验证
```typescript
test('malformed JSON returns 400 not 500', async () => {
  const res = await fetch('/api/v1/canvas/generate', {
    method: 'POST',
    body: 'not valid json {',
  });
  expect(res.status).toBe(400); // NOT 500
});
```
