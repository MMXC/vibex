# Spec: E3 - Hooks 命名规范规格

## E3.1 命名规范

```typescript
// ✅ 正确格式: use + Domain + Action
useProjectCreate      // 项目 → 创建
useProjectList         // 项目 → 列表
useCanvasState        // Canvas → 状态
useFlowTreeUpdate     // Flow → 树 → 更新

// ❌ 错误格式
useGetProject()        // use + 动词（错误）
useData()             // 无领域（错误）
useStore()            // 太泛（错误）
```

## E3.2 ESLint Rule

```javascript
// .eslintrc.js 或 eslint.config.js
rules: {
  'hooks-naming/use-prefix': ['error', {
    prefix: 'use',
    pattern: '^use[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)*$',
    message: 'Hook 名称必须使用 use + Domain + Action 格式',
  }],
}
```

## E3.3 stores/index.ts 导出

```typescript
// stores/index.ts
export { useProjectStore } from './projectStore';
export { useCanvasStore } from './canvasStore';
export { useAuthStore } from './authStore';
// ... 所有 stores 统一导出
```

## E3.4 验证命令

```bash
# 检查 hooks 命名
grep -rn "function use" src/hooks/ --include="*.ts" --include="*.tsx" | \
  grep -v "^use[A-Z]" | wc -l
# 期望: 0（无违规命名）
```
