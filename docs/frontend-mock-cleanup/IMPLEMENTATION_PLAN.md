# Implementation Plan — frontend-mock-cleanup

**项目**: frontend-mock-cleanup
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex
**总工时**: 3.5-4.5h

---

## Sprint 概览

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1: 生产代码 Mock 清理 | 3-4h | 3 个文件 mock 全部移除 |
| Sprint 2 | E2: 检测脚本误报修复 | 0.5h | test-utils 跳过 |

---

## Sprint 1: E1 — 生产代码 Mock 清理

### 负责人
Dev Agent

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E1-T1 | useProjectTree.ts — 移除 3 处 `return MOCK_DATA` | 1.5h | 无 |
| E1-T2 | BoundedContextTree.tsx — 替换 mockGenerateContexts | 1h | 无 |
| E1-T3 | ComponentTree.tsx — 替换 mockGenerateComponents | 1h | 无 |
| E1-T4 | 审查 useProjectTree 所有调用方，处理空状态 | 0.5h | E1-T1 |
| E1-T5 | Playwright E2E 验证 Canvas 三树正常渲染 | 0.5h | E1-T1,T2,T3 |

### E1-T1 详细步骤

```typescript
// E1-T1: useProjectTree.ts (L280-282)

// 删除 L280
if (query.isError && useMockOnError) return MOCK_DATA;
// 删除此行，保留 useMockOnError（可能后续清理）

// 修改 L281: skip 时返回空状态而非 mock
// 修改前: if (skip) return MOCK_DATA;
// 修改后:
if (skip) {
  return { nodes: [], projectId: projectId ?? null, name: '项目分析', isLoading: true };
}

// 修改 L282: !projectId 时返回描述性空数据
// 修改前: if (!projectId) return MOCK_DATA;
// 修改后:
if (!projectId) {
  return { nodes: [], projectId: null, name: '项目分析', isLoading: false };
}

// L280 改为:
if (query.isError) {
  return { nodes: [], projectId: projectId ?? null, name: '项目分析', isError: true };
}
```

### E1-T2 详细步骤

```typescript
// E1-T2: BoundedContextTree.tsx (L399)

// 修改前:
const drafts = mockGenerateContexts('');

// 修改后:
const boundedContextTree = useCanvasStore(s => s.boundedContextTree);
const drafts = boundedContextTree?.nodes ?? [];

// 同时可以删除 mockGenerateContexts 函数（L97-106）和 MOCK_CONTEXT_TEMPLATES（L88-97）
// 确认无其他引用后再删除
```

### E1-T3 详细步骤

```typescript
// E1-T3: ComponentTree.tsx (L683)

// 修改前:
const drafts = mockGenerateComponents(flowNodes.length);

// 修改后:
const componentTree = useCanvasStore(s => s.componentTree);
const drafts = componentTree?.nodes ?? [];

// 删除 mockGenerateComponents 函数和 MOCK_COMPONENT_TEMPLATES（同 E1-T2）
```

### 交付物
- `vibex-fronted/src/hooks/useProjectTree.ts`（已修改）
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`（已修改）
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`（已修改）
- `vibex-fronted/src/e2e/canvas/mock-cleanup-verify.spec.ts`（新增 E2E）

### 验收检查清单
- [ ] `grep -r "return MOCK_DATA" src/hooks/useProjectTree.ts` 无输出
- [ ] `grep "mockGenerateContexts" src/components/canvas/BoundedContextTree.tsx` 无输出
- [ ] `grep "mockGenerateComponents" src/components/canvas/ComponentTree.tsx` 无输出
- [ ] Canvas 页面三树正常渲染（有数据或空状态，无崩溃）
- [ ] Playwright E2E 通过

---

## Sprint 2: E2 — 检测脚本误报修复

### 负责人
Dev Agent

### E2-T1 详细步骤

```javascript
// E2-T1: scripts/cleanup-mocks.js

// 在 scanDir 或 file filter 中添加 test-utils 跳过
const SKIP_PATTERNS = [
  '/node_modules/',
  '/test-utils/',   // ← 新增
  '/__tests__/',
  '/__mocks__/',
];

// 验证: node scripts/cleanup-mocks.js 输出无 test-utils 误报
```

### 交付物
- `vibex-fronted/scripts/cleanup-mocks.js`（已修改）

### 验收检查清单
- [ ] `node scripts/cleanup-mocks.js` 输出中无 `test-utils` 误报
- [ ] `node scripts/cleanup-mocks.js` 退出码为 0
- [ ] 其他真实 mock 问题仍被检测（可人工确认）

---

## 回滚计划

```bash
# 若 Sprint 1 出现页面崩溃，回滚命令：
git checkout HEAD -- \
  vibex-fronted/src/hooks/useProjectTree.ts \
  vibex-fronted/src/components/canvas/BoundedContextTree.tsx \
  vibex-fronted/src/components/canvas/ComponentTree.tsx

# 回滚后 Canvas 恢复 mock 数据模式
```

---

*本文档由 Architect Agent 生成于 2026-04-04 18:50 GMT+8*
