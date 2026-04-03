# Spec: Dev Proposals E1-E7 Summary

## 1. 概述

**工时**: 20.5h + 6-9 人天 | **优先级**: P0-P2
**来源**: 六方提案综合 — dev 视角

## 2. Epic 总览

| Epic | 名称 | 工时 | P |
|------|------|------|---|
| E1 | Sprint 0 紧急修复 | 1.5h | P0 |
| E2 | 三树 checkbox UX | 1.5h | P0 |
| E3 | canvasStore 拆分 | 8-12h | P0 |
| E4 | Migration 修复 | 0.5h | P1 |
| E5 | API 防御性解析 | 1h | P1 |
| E6 | E2E 测试建设 | 6-9 人天 | P1 |
| E7 | vitest 优化 | 2h | P2 |

## 3. E1 详细规格

### D-001: TS 错误清理
```bash
cd vibex-fronted && npm run build 2>&1 | grep "error TS"
# 分类处理：废弃API / 类型缺失 / 路径别名
```

### D-002: DOMPurify Override
```json
// package.json
"overrides": {
  "monaco-editor": { "dompurify": "3.3.3" }
}
```

## 4. E2 详细规格

### D-E1: BoundedContextTree 合并 checkbox
- 删除 `selectionCheckbox`（绝对定位）
- 保留 1 个 inline checkbox
- 文件: `BoundedContextTree.tsx`

### D-E2: FlowCard 级联确认
- `confirmFlowNode` 增加 steps 级联
- 文件: `canvasStore.ts` line 837

## 5. E3 详细规格

canvasStore → 拆分:
```
canvasStore (入口 < 300行)
├── contextStore      // ~180行
├── flowStore       // ~350行
├── componentStore  // ~180行
└── uiStore        // ~280行
```

## 6. E4 详细规格

Migration 2→3 修复:
```ts
status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
```

## 7. E5 详细规格

generateComponentFromFlow 防御性解析:
```ts
const type = validTypes.includes(comp.type) ? comp.type : 'page';
const method = validMethods.includes(comp.api?.method) ? comp.api.method : 'GET';
```

## 8. E6 详细规格

E2E 测试文件:
- `journey-create-context.spec.ts`
- `journey-generate-flow.spec.ts`
- `journey-multi-select.spec.ts`

## 9. E7 详细规格

vitest.config.ts:
```js
{
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: { '@': '/src' },
  },
}
```

## 10. DoD

- [ ] E1: TS error = 0, DOMPurify override 生效
- [ ] E2: 1 checkbox, steps 级联 confirmed
- [ ] E3: contextStore ≤200 行, 测试全通过
- [ ] E4: Migration status 正确
- [ ] E5: ZodError = 0
- [ ] E6: 3 个核心旅程 E2E
- [ ] E7: npm test < 60s
