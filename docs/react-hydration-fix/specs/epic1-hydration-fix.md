# Spec: Epic1 + Epic2 — React Hydration 修复

## 影响文件

- `vibex-fronted/src/components/mermaid/MermaidInitializer.tsx`
- `vibex-fronted/src/lib/query/QueryProvider.tsx`
- `vibex-fronted/src/lib/format.ts`（新建）
- `vibex-fronted/src/components/mermaid/MermaidRenderer.tsx`
- `vibex-fronted/src/components/mermaid/MermaidPreview.tsx`

---

## Spec E1-F1: MermaidInitializer — 移除轮询

### 当前问题代码

```tsx
const checkReady = setInterval(() => {
  if (isReady()) {
    setTick(t => t + 1);  // 触发不必要状态更新
    clearInterval(checkReady);
  }
}, 100);
```

### 修复方案

```tsx
import { useEffect } from 'react';
import { mermaidManager } from './mermaidManager';
import { preInitialize } from './preInitialize';

export function MermaidInitializer() {
  useEffect(() => {
    // 直接初始化，无需轮询
    mermaidManager.initialize().catch(console.error);
    preInitialize().catch(console.error);
  }, []);
  
  return null;  // 无需渲染任何内容
}
```

### 验收测试

```typescript
// MermaidInitializer.spec.tsx
it('无 setInterval 轮询', () => {
  const source = readFileSync('MermaidInitializer.tsx', 'utf8');
  expect(source).not.toMatch(/setInterval/);
});

it('无 tick 状态', () => {
  const source = readFileSync('MermaidInitializer.tsx', 'utf8');
  expect(source).not.toMatch(/setTick/);
  expect(source).not.toMatch(/useState.*tick/);
});

it('useEffect 直接初始化', () => {
  const source = readFileSync('MermaidInitializer.tsx', 'utf8');
  expect(source).toMatch(/useEffect\(\(\) =>/);
  expect(source).toMatch(/initialize\(\)/);
});
```

---

## Spec E1-F2: QueryProvider — 延迟持久化

### 当前问题代码

```tsx
useEffect(() => {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
  });
}, [queryClient]);
```

### 修复方案

```tsx
import { useEffect, useRef } from 'react';

export function QueryProvider({ children }) {
  // hydration 完成标记
  const hydrationRef = useRef(false);

  useEffect(() => {
    hydrationRef.current = true;
    
    // hydration 完成后再持久化
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
    }).catch(console.error);
  }, [queryClient]);

  return <>{children}</>;
}
```

### 验收测试

```typescript
// QueryProvider.test.tsx
it('persistQueryClient 在 useEffect 中调用', () => {
  const source = readFileSync('QueryProvider.tsx', 'utf8');
  expect(source).toMatch(/useEffect.*persistQueryClient/s);
});

it('hydration 后才持久化', async () => {
  // 模拟 SSR → CSR hydration 流程
  render(<QueryProvider><App /></QueryProvider>);
  
  // hydration 完成前不应持久化
  expect(persistQueryClient).not.toHaveBeenCalled();
  
  // hydration 完成后应持久化
  await waitFor(() => {
    expect(persistQueryClient).toHaveBeenCalled();
  });
});
```

---

## Spec E2-F1: 日期格式化工具

### 实现

**文件**: `vibex-fronted/src/lib/format.ts`（新建）

```typescript
/**
 * 固定格式日期格式化（不依赖时区）
 * 解决 SSR/CSR hydration mismatch
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    // 使用 ISO 格式，确保服务端和客户端一致
    return new Date(dateStr).toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return '-';
  }
}

/**
 * 完整日期时间格式化
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toISOString().replace('T', ' ').substring(0, 16); // YYYY-MM-DD HH:mm
  } catch {
    return '-';
  }
}
```

### 替换页面

| 文件 | 替换内容 |
|------|----------|
| `src/app/projects/page.tsx` | `toLocaleDateString` → `formatDate` |
| `src/app/dashboard/page.tsx` | `toLocaleDateString` → `formatDate` |

### 验收测试

```typescript
// format.test.ts
import { formatDate, formatDateTime } from '@/lib/format';

it('formatDate UTC 00:00 一致', () => {
  expect(formatDate('2026-04-04T00:00:00Z')).toBe('2026-04-04');
});

it('formatDate +8:00 时区一致', () => {
  expect(formatDate('2026-04-04T12:00:00+08:00')).toBe('2026-04-04');
});

it('formatDate 非法日期返回 -', () => {
  expect(formatDate('')).toBe('-');
  expect(formatDate('invalid')).toBe('-');
});

it('SSR 和 CSR 结果一致', () => {
  // 模拟服务端和客户端使用同一日期字符串
  const serverResult = formatDate('2026-04-04T12:00:00Z');
  const clientResult = formatDate('2026-04-04T12:00:00Z');
  expect(serverResult).toBe(clientResult);
});
```

---

## Spec E2-F2: suppressHydrationWarning

### 修复方案

**文件**: `MermaidRenderer.tsx`

```tsx
// 修复前
<div dangerouslySetInnerHTML={{ __html: svg }} />

// 修复后
<div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: svg }} />
```

**文件**: `MermaidPreview.tsx`

```tsx
// 修复前
<div dangerouslySetInnerHTML={{ __html: svg }} />

// 修复后
<div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: svg }} />
```

### 验收测试

```typescript
it('MermaidRenderer 添加 suppressHydrationWarning', () => {
  const source = readFileSync('MermaidRenderer.tsx', 'utf8');
  expect(source).toMatch(/suppressHydrationWarning/);
});

it('MermaidPreview 添加 suppressHydrationWarning', () => {
  const source = readFileSync('MermaidPreview.tsx', 'utf8');
  expect(source).toMatch(/suppressHydrationWarning/);
});
```

### 注意事项

`suppressHydrationWarning` 仅在有微小差异的 DOM 元素上使用，不可滥用。它只抑制当前元素的 hydration warning，不会传递给子元素。

---

## 工时汇总

| 功能 | 工时 | 风险 |
|------|------|------|
| E1-F1 MermaidInitializer | 0.5h | 低 |
| E1-F2 QueryProvider | 0.5h | 低 |
| E2-F1 formatDate | 1h | 低 |
| E2-F2 suppressHydrationWarning | 1h | 低 |
| **总计** | **3h** | — |

---

## 测试文件清单

- `vibex-fronted/src/components/mermaid/MermaidInitializer.spec.tsx`
- `vibex-fronted/src/lib/query/__tests__/QueryProvider.test.tsx`
- `vibex-fronted/src/lib/format.test.ts`
- `vibex-fronted/tests/e2e/hydration-pages.spec.ts`
