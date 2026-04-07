# AGENTS.md — TypeScript `as any` Cleanup

## 开发约束

### 类型规范
```typescript
// ✅ 正确：使用 unknown + 类型守卫
function processData(data: unknown): ContextNode[] {
  if (isCanvasSnapshot(data)) return data.contextNodes;
  return [];
}

// ❌ 错误：直接使用 as any
const data = something as any;
```

### Mock 文件豁免
```typescript
// src/__mocks__/*.ts — 允许 eslint-disable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mock = (x: any) => x;
```

### 禁止事项
- ❌ 新增 `as any` 断言
- ❌ 使用 `as unknown as T` 绕过类型检查
- ❌ 删除已有的类型定义

### 验证命令
```bash
# 检查 as any 使用数量
grep -r "as any" src/ --include="*.ts" --include="*.tsx" | wc -l

# 类型检查
pnpm tsc --noEmit

# ESLint 检查
pnpm lint
```

*Architect Agent | 2026-04-07*
