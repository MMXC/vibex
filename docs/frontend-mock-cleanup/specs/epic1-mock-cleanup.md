# Spec: Epic1 — 生产代码 Mock 清理

## 影响文件
- `vibex-fronted/src/hooks/useProjectTree.ts`
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`

---

## Spec E1-F1: useProjectTree.ts — 移除 3 处 MOCK_DATA return

### 当前代码（L278-282）
```typescript
if (query.isError && useMockOnError) return MOCK_DATA;
if (skip) return MOCK_DATA;
if (!projectId) return MOCK_DATA;
```

### 修复方案

#### F1.1: Error case
```typescript
// 移除: if (query.isError && useMockOnError) return MOCK_DATA;
// 改为: 保留 query.isError 的错误处理，但不返回 mock
if (query.isError) {
  console.error('[useProjectTree] Project fetch error:', query.error);
  return [];  // 或 throw/error boundary 处理
}
```

#### F1.2: Skip case
```typescript
// 移除: if (skip) return MOCK_DATA;
// 改为: 不返回数据，调用方处理加载状态
if (skip) {
  return [];  // 或 throw，依赖 Suspense/loading state
}
```

#### F1.3: No project case
```typescript
// 移除: if (!projectId) return MOCK_DATA;
// 改为: 返回空数组，表示无项目
if (!projectId) {
  return [];
}
```

### 验收测试
```typescript
// useProjectTree.spec.ts
it('no longer returns MOCK_DATA in any branch', () => {
  const source = readFileSync('src/hooks/useProjectTree.ts', 'utf8');
  expect(source).not.toMatch(/return MOCK_DATA/);
  expect(source).not.toMatch(/MOCK_DATA;/);  // 不只是注释
});

it('returns empty array when no projectId', () => {
  const { result } = renderHook(() => useProjectTree(undefined));
  expect(result.current).toEqual([]);
});
```

---

## Spec E1-F2: BoundedContextTree.tsx — 移除 mockGenerateContexts

### 当前代码（L399）
```typescript
const drafts = mockGenerateContexts('');
```

### 修复方案
```typescript
// 从 canvasStore 获取真实数据
const drafts = useCanvasStore(s => s.boundedContextTree?.nodes ?? []);
```

### 验收测试
```typescript
// BoundedContextTree.spec.tsx
it('uses real data from canvasStore, not mock', () => {
  const source = readFileSync('src/components/canvas/BoundedContextTree.tsx', 'utf8');
  expect(source).not.toMatch(/mockGenerateContexts/);
  expect(source).toMatch(/boundedContextTree/);
});
```

---

## Spec E1-F3: ComponentTree.tsx — 移除 mockGenerateComponents

### 当前代码（L683）
```typescript
const drafts = mockGenerateComponents(flowNodes.length);
```

### 修复方案
```typescript
// 从 canvasStore 获取真实数据
const drafts = useCanvasStore(s => s.componentTree?.nodes ?? []);
```

### 验收测试
```typescript
// ComponentTree.spec.tsx
it('uses real data from canvasStore, not mock', () => {
  const source = readFileSync('src/components/canvas/ComponentTree.tsx', 'utf8');
  expect(source).not.toMatch(/mockGenerateComponents/);
  expect(source).toMatch(/componentTree/);
});
```

---

## Spec E2-F1: cleanup-mocks.js — 跳过 test-utils 目录

### 当前 SKIP_PATTERNS
```javascript
const SKIP_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__mocks__/,
  /\/mocks\//,
  /\/mock\//,
];
```

### 修复
```javascript
const SKIP_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__mocks__/,
  /\/mocks\//,
  /\/mock\//,
  /\/test-utils\//,     // 新增
  /test-utils\//,       // 新增（相对路径）
];
```

### 验收测试
```bash
# 运行 cleanup-mocks.js，验证 test-utils 不在输出中
node scripts/cleanup-mocks.js
# 期望: 无 test-utils/factories 报错
# 期望: 退出码 0（E1 修复后）
```

---

## 工时汇总

| 功能 | 工时 | 风险 |
|------|------|------|
| E1-F1 useProjectTree | 1.5h | 低 |
| E1-F2 BoundedContextTree | 1h | 低 |
| E1-F3 ComponentTree | 1h | 低 |
| E2-F1 cleanup-mocks.js | 0.5h | 极低 |
| **总计** | **4h** | — |
