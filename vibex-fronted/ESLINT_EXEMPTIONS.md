# ESLint 豁免清单

> 管理 `@typescript-eslint/no-explicit-any` 豁免，确保每个豁免都有明确理由。

| 文件:行 | 原因 | 日期 | 豁免人 |
|---------|------|------|--------|
| src/lib/canvas-renderer/catalog.ts:101 | rawCatalog 来自运行时 JSON import，无法静态类型推断，必须用 as any 中转 | 2026-04-08 | Dev |
| src/lib/canvas-renderer/registry.tsx:208 | rawRegistry 来自运行时 JSON import，类型系统无法推断 Registry 类型 | 2026-04-08 | Dev |
| src/hooks/ddd/useDDDStateRestore.ts:41-43 | Zustand store hooks 在 Context 外使用时需要类型断言，避免 SSR 水合错误 | 2026-04-08 | Dev |

## 豁免规范

每个豁免必须包含以下 MEMO 注释：

```typescript
// MEMO: ESLint 豁免 - 2026-04-08
// Reason: [具体原因]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

## 审批流程

- 每个豁免需在 PR 描述中说明理由
- Reviewer 有权要求补充或重构
- 禁止无解释的 `eslint-disable` 注释
