# Architecture: useWebVitals TypeScript Fix

**项目**: useWebVitals-ts-fix-20260407
**阶段**: design-architecture
**状态**: Final
**Architect**: Architect
**日期**: 2026-04-07

---

## 1. 问题摘要

### 根因
`src/hooks/useWebVitals.ts` 中，canvasLogger.debug 的 `args` 参数类型为 `unknown[]`，解构后的 `data` 被推断为 `{}`，导致 `data.name` 和 `data.value` 在 TypeScript 眼中不存在。

### 错误信息
```
src/hooks/useWebVitals.ts:57:26
Type error: Property 'name' does not exist on type '{}'.
```

### 问题代码定位
```tsx
// 第 55-57 行
canvasLogger.default.debug = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[Web Vitals]')) {
    const [, data] = args;                          // ← data 推断为 {}
    if (data && data.name && data.value !== undefined) {  // ← TS 报错
```

---

## 2. 技术方案

### 方案 A：类型断言（推荐）

```tsx
const [, data] = args as [string, WebVitalsMetric];
if (data && data.name && data.value !== undefined) {
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.02h（1处修改） |
| 风险 | 零 |
| 类型安全 | 显式断言，意图清晰 |

### 方案 B：Guard 断言

```tsx
const [, data] = args;
if (data && typeof data === 'object' && 'name' in data && 'value' in data) {
  const metric = data as WebVitalsMetric;
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.05h（更复杂） |
| 风险 | 零 |
| 类型安全 | 运行时检查 |

**推荐方案 A**，因为 `canvasLogger.default.debug` 的第二个参数必然是 `WebVitalsMetric`（由 `web-vitals` 库固定）。

---

## 3. 修复内容

**文件**: `vibex-fronted/src/hooks/useWebVitals.ts`

```diff
-    const [, data] = args;
+    const [, data] = args as [string, WebVitalsMetric];
```

**修复后完整代码块**:
```tsx
canvasLogger.default.debug = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[Web Vitals]')) {
    const [, data] = args as [string, WebVitalsMetric];
    if (data && data.name && data.value !== undefined) {
      if (thresholds) {
        const threshold = thresholds[data.name.toLowerCase() as keyof typeof thresholds];
        if (threshold && data.value > threshold) {
          canvasLogger.default.warn(`[Web Vitals] ${data.name} exceeded threshold: ${data.value} > ${threshold}`);
        }
      }
      if (onReport) {
        onReport(data);
      }
    }
  }
  originalConsoleLog.apply(console, args);
};
```

**WebVitalsMetric 类型定义**（已存在于 `src/lib/web-vitals.ts`）:
```ts
export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries?: PerformanceEntry[];
}
```

---

## 4. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 类型断言不匹配 | 极低 | 调用方固定为 web-vitals 库，类型不变 |
| 运行时崩溃 | 极低 | 逻辑不变，仅类型标注变化 |
| 性能影响 | 零 | 无新增计算 |

**性能影响**: 零。

---

## 5. 验收标准

| ID | 标准 | 验证方式 |
|----|------|----------|
| AC1 | TypeScript 编译无 useWebVitals 相关错误 | `npx tsc --noEmit` 无 useWebVitals.ts 错误 |
| AC2 | `npm run build` 成功 | 构建退出码 0 |
| AC3 | useWebVitals 功能正常 | Web Vitals 采集、回调、阈值检查逻辑不变 |

---

## 6. 变更范围

| 文件 | 修改类型 | 修改量 |
|------|----------|--------|
| `src/hooks/useWebVitals.ts` | 类型断言 | +1 行 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: useWebVitals-ts-fix-20260407
- **执行日期**: 2026-04-07
