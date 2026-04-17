# Proposals 2026-04-06 综合规格

## 提案来源汇总

| Agent | 提案文件 | P0 | P1 |
|-------|----------|-----|-----|
| analyst | analyst.md | 3 | 3 |
| architect | architect.md | 2 | 2 |
| pm | pm.md | 3 | 2 |
| tester | tester.md | 3 | 1 |
| reviewer | reviewer.md | 2 | 2 |

## P0 修复项详情

### 1. OPTIONS 预检路由修复
**来源**: A-P0-1, P001, T-P0-1, R-P0-1

**问题**: protected_.options 在 authMiddleware 之后注册，预检被 401 拦截。

**修复**:
```typescript
// gateway.ts
protected_.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  return c.text('', 204);
});
// 先于 authMiddleware 注册
protected_.use('*', authMiddleware);
```

**验收**:
```bash
curl -X OPTIONS 'https://api.vibex.top/v1/projects' -v
# 期望: HTTP 204 + Access-Control-Allow-Origin: *
```

---

### 2. Canvas Context 多选修复
**来源**: A-P0-2, P002, T-P0-2, R-P0-2

**问题**: BoundedContextTree.tsx checkbox 调用 toggleContextNode 而非 onToggleSelect。

**修复**:
```tsx
// BoundedContextTree.tsx
<Checkbox
  checked={isSelected}
  onChange={() => {
    onToggleSelect?.(node.nodeId); // ✅ 修复
  }}
/>
```

**验收**:
```typescript
expect(onToggleSelect).toHaveBeenCalledWith(node.nodeId);
expect(toggleContextNode).not.toHaveBeenCalled();
```

---

### 3. generate-components flowId
**来源**: A-P0-3, P003, T-P0-3

**问题**: AI schema 缺少 flowId，输出 flowId=unknown。

**修复**:
```typescript
// schema 添加 flowId
const componentResult = await aiService.generateJSON<Array<{
  name: string
  type: string
  flowId: string  // ✅ 新增
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>();

// prompt 添加 flowId 要求
// 每个组件需包含：
// - flowId: 所属流程ID（从上述流程中选择）
```

**验收**:
```typescript
expect(component.flowId).toMatch(/^flow-/);
expect(flowId).not.toBe('unknown');
```

---

## P1 改进项详情

### 4. SSE 超时 + 连接清理
**来源**: A-P1-1, A-P0-2, P005

**修复**: AbortController.timeout(10000) + cancel() 清理 timers。

### 5. 分布式限流
**来源**: A-P1-2, P005

**修复**: 使用 caches.default 替代内存 Map。

### 6. test-notify 去重
**来源**: A-P1-3, P004, T-P1-1

**修复**: dedup.js 实现 5 分钟窗口去重。
