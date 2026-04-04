# Implementation Plan — react-hydration-fix

**项目**: react-hydration-fix
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex
**总工时**: 3h

---

## Sprint 概览

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1: P0 Hydration 修复 | 1h | 消除 MermaidInitializer + QueryProvider 问题 |
| Sprint 2 | E2: P1 Hydration 增强 | 2h | 日期格式 + suppressHydrationWarning |

---

## Sprint 1: E1 — P0 Hydration 修复

### 负责人
Dev Agent

### E1-T1: MermaidInitializer 移除轮询（0.5h）

```typescript
// E1-T1: MermaidInitializer.tsx

// 1. 删除以下代码
const [tick, setTick] = useState(0);

// 2. 删除 setInterval 逻辑
const checkReady = setInterval(() => {
  if (isReady()) {
    setTick(t => t + 1);  // ← 删除
    clearInterval(checkReady);
  }
}, 100);

// 3. 替换为直接初始化
useEffect(() => {
  mermaidManager.initialize().catch(console.error);
  preInitialize().catch(console.error);
}, []);

// 4. return null（不需要状态）
return null;
```

### E1-T2: QueryProvider 延迟持久化（0.5h）

```typescript
// E1-T2: QueryProvider.tsx

// 1. 添加 hydrationRef
const hydrationRef = useRef(false);

// 2. useEffect 中标记 hydration 完成后再持久化
useEffect(() => {
  hydrationRef.current = true;
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
  }).catch(console.error);
}, [queryClient]);
```

### 交付物
- `vibex-fronted/src/components/mermaid/MermaidInitializer.tsx`（已修改）
- `vibex-fronted/src/lib/query/QueryProvider.tsx`（已修改）
- `vibex-fronted/src/components/mermaid/MermaidInitializer.spec.tsx`（新增）

### 验收检查清单
- [x] `MermaidInitializer.tsx` 无 `setInterval` (commit 041d9566)
- [x] `MermaidInitializer.tsx` 无 `setTick` (commit 041d9566)
- [x] `MermaidInitializer.tsx` 在 `useEffect` 中直接调用 `initialize()` (commit 041d9566)
- [x] `QueryProvider.tsx` 的 `persistQueryClient` 在 `useEffect` 中 (commit 041d9566)
- [ ] Playwright: 无 hydration mismatch console error (需 Cloudflare Pages 部署后验证)

---

## Sprint 2: E2 — P1 Hydration 增强

### E2-T1: 日期格式化工具（1h）

```typescript
// E2-T1: src/lib/format.ts（新建）

export function formatDate(isoString: string): string {
  return isoString.split('T')[0];
}

export function formatDateTime(isoString: string): string {
  const [date, time] = isoString.split('T');
  return `${date} ${time.split('.')[0]}`;
}

// 替换规则：项目中所有 .toLocaleDateString('zh-CN') 替换为 formatDate
// 搜索命令：
grep -rn "toLocaleDateString\|toLocaleString" vibex-fronted/src --include="*.tsx" --include="*.ts"
```

### E2-T2: suppressHydrationWarning（1h）

```typescript
// E2-T2: MermaidRenderer.tsx + MermaidPreview.tsx

// 1. MermaidRenderer.tsx
<div
  dangerouslySetInnerHTML={{ __html: svgContent }}
  suppressHydrationWarning  // ← 新增
/>

// 2. MermaidPreview.tsx
<div
  dangerouslySetInnerHTML={{ __html: svgContent }}
  suppressHydrationWarning  // ← 新增
/>
```

### 交付物
- `vibex-fronted/src/lib/format.ts`（新增）
- `vibex-fronted/src/components/mermaid/MermaidRenderer.tsx`（已修改）
- `vibex-fronted/src/components/mermaid/MermaidPreview.tsx`（已修改）
- `vibex-fronted/src/lib/__tests__/format.test.ts`（新增）

### 验收检查清单
- [ ] `formatDate` 对 UTC 和 CST 时区返回相同结果
- [ ] `toLocaleDateString` 在项目中已全部替换
- [ ] `MermaidRenderer.tsx` 包含 `suppressHydrationWarning`
- [ ] `MermaidPreview.tsx` 包含 `suppressHydrationWarning`

---

## 回滚计划

```bash
# 回滚所有变更
git checkout HEAD -- \
  vibex-fronted/src/components/mermaid/MermaidInitializer.tsx \
  vibex-fronted/src/lib/query/QueryProvider.tsx \
  vibex-fronted/src/lib/format.ts \
  vibex-fronted/src/components/mermaid/MermaidRenderer.tsx \
  vibex-fronted/src/components/mermaid/MermaidPreview.tsx
```

---

*本文档由 Architect Agent 生成于 2026-04-04 22:28 GMT+8*
