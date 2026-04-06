# Analysis: useWebVitals.ts TypeScript 类型错误修复

**项目**: useWebVitals-ts-fix-20260407
**分析人**: Analyst
**日期**: 2026-04-07

---

## 1. 执行摘要

**问题**: `useWebVitals.ts` 有 6 处 TypeScript 编译错误，集中在 hook 内重写 `canvasLogger.default.debug` 时类型推断错误。

**根因**: `originalConsoleLog` 被声明为 `unknown[]` 参数的函数，导致 `data` 被推断为 `{}`；同时 `apply` 调用参数类型不兼容。

**方案**: 修复类型标注，工作量 ~0.1h。

---

## 2. 问题定位

### 2.1 Git History 分析

| Commit | 操作 |
|--------|------|
| `b85f3ac7` | 将 `console.*` 替换为 `canvasLogger`，引入 Web Vitals hook |
| `44758b70` | 添加 console 日志清理，引入 web-vitals 基础设施 |
| `3d455ddf` | 添加 DOM Performance API 类型定义，消除 `as any` |

**关键**: `b85f3ac7` 引入的 `canvasLogger.default.debug` 重写逻辑与 TypeScript 类型系统存在不兼容。

### 2.2 TypeScript 错误详情

```
src/hooks/useWebVitals.ts(57,26): error TS2339: Property 'name' does not exist on type '{}'.
src/hooks/useWebVitals.ts(57,39): error TS2339: Property 'value' does not exist on type '{}'.
src/hooks/useWebVitals.ts(60,47): error TS2339: Property 'name' does not exist on type '{}'.
src/hooks/useWebVitals.ts(61,35): error TS2339: Property 'value' does not exist on type '{}'.
src/hooks/useWebVitals.ts(62,62): error TS2339: Property 'name' does not exist on type '{}'.
src/hooks/useWebVitals.ts(62,95): error TS2339: Property 'value' does not exist on type '{}'.
src/hooks/useWebVitals.ts(68,22): error TS2345: Argument of type '{}' is not assignable to parameter of type 'WebVitalsMetric'.
```

### 2.3 根因分析

**问题代码** (useWebVitals.ts 第 39-68 行):

```typescript
// 原始类型推断导致 data 为 {}
const originalConsoleLog = canvasLogger.default.debug;
//                                                              ↑ inferred as (...args: unknown[]) => void
// ...赋值后...
canvasLogger.default.debug = (...args) => {
  // ...
  const [, data] = args;  // ← data inferred as {} (narrowed unknown[] → {})
  if (data && data.name && data.value !== undefined) {
  //         ~~~~~~~~~   ~~~~~~~~~  TS2339: Property does not exist on type '{}'
    // ...
    onReport(data);  // ← TS2345: '{}' not assignable to 'WebVitalsMetric'
  }
  originalConsoleLog.apply(console, args);
  //             ~~~~~  'apply' expects (this: Function, args: Arguments), incompatible
};
```

**核心问题**:
1. `canvasLogger.default.debug` 被赋值为新函数后，TypeScript 丢失了原有的类型信息，`args` 被推断为 `unknown[]`
2. `const [, data] = args` 后 `data` 类型为 `unknown`，但被进一步收窄为 `{}`
3. `apply` 的 `this` 参数类型不匹配

---

## 3. 方案对比

### 方案 A：提取函数引用 + 类型断言（推荐）

```typescript
// 保存原始函数引用（赋值前）
const originalDebug = canvasLogger.default.debug.bind(canvasLogger.default);

// 重写 debug
canvasLogger.default.debug = (...args: unknown[]) => {
  // ...
  const data = args[1] as { name?: string; value?: number };
  if (data && data.name && data.value !== undefined) {
    // ...
    if (onReport) {
      onReport(data as WebVitalsMetric);
    }
  }
  originalDebug(...args);
};

// 恢复时
canvasLogger.default.debug = originalDebug;
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.1h |
| 风险 | 低 |
| 类型安全 | 高 |

### 方案 B：直接监听 PerformanceObserver 事件（绕过 monkey-patch）

不重写 `canvasLogger.default.debug`，而是直接在 `initWebVitals` 内部调用 `onReport`。

```typescript
// initWebVitals 增加 options.onReport 参数
export function initWebVitals(options?: { onReport?: (metric: WebVitalsMetric) => void }) {
  // 在 reportWebVitals 内部调用 options.onReport
}
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~0.3h |
| 风险 | 中（改变 initWebVitals 签名） |
| 类型安全 | 高 |

---

## 4. 推荐方案

**方案 A**：最小化修改，修复类型标注 + `bind` 引用。

**理由**：
1. 改动最小，仅涉及 3-4 行
2. 保持现有架构不变
3. 消除 TypeScript 错误同时提升类型安全性
4. `bind` 保留正确的 `this` 上下文

**具体改动**:
```typescript
// 第 37 行之前添加
const originalDebug = canvasLogger.default.debug;

// 第 40 行修改函数签名
canvasLogger.default.debug = (...args: unknown[]) => {

// 第 62 行修复类型断言
const data = args[1] as { name?: string; value?: number };

// 第 68 行修复类型断言
onReport(data as WebVitalsMetric);

// 第 75 行修复
canvasLogger.default.debug = originalDebug;

// 移除 originalConsoleLog 变量
```

---

## 5. 历史经验

来自 `MEMORY.md` 模式 "功能已实现但未集成"：
> **特征**: 类型推断错误通常源于 monkey-patch 场景下 TypeScript 无法追踪运行时类型变化
> **案例**: 本次 `canvasLogger.default.debug` 被重写后，原有类型信息丢失

---

## 6. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| 1 | `npx tsc --noEmit` 无 Web Vitals 相关错误 | `grep -v "node_modules" tsc output` |
| 2 | `npm run build` 构建成功 | 退出码 0 |
| 3 | `useWebVitals.ts` 保留 monkey-patch 逻辑 | 确认 `originalDebug` 变量存在 |
| 4 | `WebVitalsMetric` 类型断言正确 | 类型检查通过 |
| 5 | cleanup 函数正确恢复 debug | 确认 `originalDebug` 还原逻辑 |

---

## 7. 实施建议

**预计工时**: 0.1h
**影响文件**: 1 个 (`src/hooks/useWebVitals.ts`)
**风险**: 无 — 纯类型修复，不改变运行时行为
