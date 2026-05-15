
## 经验沉淀 — 2026-05-16 E4 测试修复 (Coord Escalation)

### 问题
`DDSToolbar.test.tsx` 15 tests FAIL：`TypeError: Cannot read properties of undefined (reading 'cards')` at `chapters['business-rules'].cards`

### 根因
Store 初始状态使用 `'business-rules'` (hyphenated) 作为 chapter key（`DDSCanvasStore.ts` line 42）：
```ts
'business-rules': createInitialChapterData('business-rules')
```

测试 mock 使用了 camelCase `businessRules` 而非 hyphenated `'business-rules'`：
```ts
// ❌ 错误
businessRules: { type: 'business-rules', ... }
// ✅ 正确
'business-rules': { type: 'business-rules', ... }
```

E4 代码（commit c8e9e7985）新增 `useCallback` 访问 `chapters['business-rules'].cards`，触发未定义访问错误。

### 受影响文件（两个测试文件同一 Bug）
1. `vibex-fronted/src/components/dds/toolbar/__tests__/DDSToolbar.test.tsx` — 已修复
2. `vibex-fronted/src/components/dds/canvas/__tests__/ChapterPanel.test.tsx` — 已修复

### 修复方法
将测试 mock 中的 `businessRules` 改为 `'business-rules'`（与 `ChapterType` 类型定义一致）。

### Coord Escalation 理由
`dev-epic4-test-fix` 任务 in-progress 超过 8 小时，零 commits。根因明确（mock key 不匹配），修复简单，直接实施。

### 预防
Dev agent 写 E4 代码时若涉及访问新 chapter key，应同步更新相关测试文件的 store mock。
