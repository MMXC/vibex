# Spec: E1 - confirmContextNode 类型错误修复

## F1.1: 删除 confirmed 字段

### 修复
```typescript
// BoundedContextTree.tsx handleGenerate
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  // ✅ 已删除: confirmed: false
  status: 'pending' as const,
  children: [],
}));
```

### 验收
```typescript
test('TypeScript compiles without errors', () => {
  const result = execSync('npx tsc --noEmit', { cwd: '/root/.openclaw/vibex' });
  expect(result.status).toBe(0);
});

test('confirmed field removed from handleGenerate', () => {
  const content = readFileSync('src/components/canvas/BoundedContextTree.tsx', 'utf-8');
  const lines = content.split('\n');
  const handleGenerateStart = lines.findIndex(l => l.includes('handleGenerate'));
  const nextFunction = lines.slice(handleGenerateStart).findIndex(l => l.includes('const ') && !l.includes('='));
  const handleGenerateBlock = lines.slice(handleGenerateStart, handleGenerateStart + nextFunction).join('\n');
  expect(handleGenerateBlock).not.toMatch(/confirmed:\s*false/);
});
```

### 【需页面集成】✅ (F1.3 回归验证)
