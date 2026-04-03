# Spec: E1 - 删除上下文树卡片连线

## F1.1-F1.3: 注释 RelationshipConnector

### 验收
```typescript
test('RelationshipConnector is commented out', () => {
  const content = readFileSync('components/BoundedContextTree.tsx', 'utf-8');
  const connectorLine = content.match(/<RelationshipConnector/);
  const isCommented = content.includes('{* <RelationshipConnector') || 
                      connectorLine === null;
  expect(isCommented).toBe(true);
});
```

### 【需页面集成】✅
