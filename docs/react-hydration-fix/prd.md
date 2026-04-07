# PRD — react-hydration-fix

**Agent**: PM
**日期**: 2026-04-04 22:20
**仓库**: /root/.openclaw/vibex
**基于**: docs/react-hydration-fix/analysis.md

---

## 执行摘要

### 背景
React Error #310 (hydration mismatch) 发生在 SSR 页面服务端渲染内容与客户端首次渲染不一致时，导致事件处理器无法正确绑定，影响用户交互。分析发现 4 个潜在 hydration 问题，分布在 MermaidInitializer、QueryProvider、日期格式化、dangerouslySetInnerHTML。

### 目标
修复 P0 级 hydration 问题（MermaidInitializer 轮询 + QueryProvider 持久化），清除所有页面 hydration mismatch 错误。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| hydration mismatch console error 数 | >0（存在） | 0 |
| MermaidInitializer 轮询 | 100ms setInterval | 无轮询 |
| 主要页面覆盖率 | 未知 | 100%（4个页面） |

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | P0 Hydration 修复 | 1h | P0 |
| E2 | P1 Hydration 增强 | 2h | P1 |

---

## Epic 1: P0 Hydration 修复

### Stories

#### Story E1-S1: MermaidInitializer — 移除轮询逻辑
- **问题**: 100ms setInterval 轮询 `isReady()` 触发不必要的状态更新（`setTick`），在服务端无 browser API 的情况下可能不一致
- **工时**: 0.5h
- **验收标准**:
```typescript
// E1-S1.1: MermaidInitializer 无 setInterval
const source = readFileSync('MermaidInitializer.tsx', 'utf8');
expect(source).not.toMatch(/setInterval/);

// E1-S1.2: useEffect 中直接初始化
expect(source).toMatch(/useEffect\(\(\) => \{[^}]*initialize[^}]*\}\)/);

// E1-S1.3: 无 tick 状态（setTick 相关代码移除）
expect(source).not.toMatch(/setTick|tick/);
```
- **页面集成**: 无

#### Story E1-S2: QueryProvider — 延迟持久化
- **问题**: `persistQueryClient` 在 `useEffect` 中执行，hydration 完成前可能读取脏数据
- **工时**: 0.5h
- **验收标准**:
```typescript
// E1-S2.1: 持久化在 hydration 完成后执行
const source = readFileSync('QueryProvider.tsx', 'utf8');
// 应在 useEffect 中调用，且 hydration 已完成的标记存在
expect(source).toMatch(/useEffect.*persistQueryClient/s);

// E1-S2.2: QueryProvider 单元测试通过
// 验收: npm test -- QueryProvider.test.tsx 通过
// expect(testResults.passed).toBe(true);
```
- **页面集成**: 无

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | MermaidInitializer无轮询 | 移除setInterval + setTick | expect(no setInterval) | 无 |
| E1-F2 | QueryProvider延迟持久化 | hydration完成后执行persistQueryClient | expect(useEffect persist) | 无 |

### DoD
- [ ] `MermaidInitializer.tsx` 中无 `setInterval` 和 `setTick`
- [ ] `MermaidInitializer` 在 `useEffect` 中直接调用 `mermaidManager.initialize()`
- [ ] `QueryProvider.tsx` 中 `persistQueryClient` 在 `useEffect` 中执行
- [ ] `QueryProvider.test.tsx` 单元测试通过

---

## Epic 2: P1 Hydration 增强

### Stories

#### Story E2-S1: 日期格式化 — 使用固定格式替代 localeString
- **问题**: `toLocaleDateString()` 在服务端和客户端时区不同导致显示不一致
- **工时**: 1h
- **验收标准**:
```typescript
// E2-S1.1: 格式化工具函数存在
const source = readFileSync('formatDate.ts', 'utf8');
// 应存在不依赖时区的格式化函数
expect(source).toMatch(/toISOString|split\('T'\)/);

// E2-S1.2: 调用处替换为固定格式
const pageSource = readFileSync('projects/page.tsx', 'utf8');
expect(pageSource).not.toMatch(/toLocaleDateString/);

// E2-S1.3: 格式化结果一致
expect(formatDate('2026-04-04T12:00:00Z')).toBe('2026-04-04');
expect(formatDate('2026-04-04T12:00:00+08:00')).toBe('2026-04-04');
```
- **页面集成**: 【需页面集成】（projects/page.tsx 等）

#### Story E2-S2: dangerouslySetInnerHTML — 添加 suppressHydrationWarning
- **问题**: SVG 渲染在 SSR/CSR 可能产生微小差异（空格、换行）
- **工时**: 1h
- **验收标准**:
```typescript
// E2-S2.1: MermaidRenderer 添加 suppressHydrationWarning
const source = readFileSync('MermaidRenderer.tsx', 'utf8');
expect(source).toMatch(/suppressHydrationWarning/);

// E2-S2.2: MermaidPreview 添加 suppressHydrationWarning
const previewSource = readFileSync('MermaidPreview.tsx', 'utf8');
expect(previewSource).toMatch(/suppressHydrationWarning/);
```
- **页面集成**: 【需页面集成】（MermaidRenderer.tsx, MermaidPreview.tsx）

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | 日期固定格式 | toLocaleDateString → formatDate | expect(no toLocaleDateString) | 【需页面集成】 |
| E2-F2 | suppressHydrationWarning | dangerouslySetInnerHTML添加suppress | expect(suppressHydrationWarning) | 【需页面集成】 |

### DoD
- [ ] `lib/format.ts` 导出 `formatDate()` 函数，使用 `toISOString().split('T')[0]`
- [ ] `projects/page.tsx` 和其他页面使用 `formatDate` 替代 `toLocaleDateString`
- [ ] `MermaidRenderer.tsx` 的 `dangerouslySetInnerHTML` 添加 `suppressHydrationWarning`
- [ ] `MermaidPreview.tsx` 的 `dangerouslySetInnerHTML` 添加 `suppressHydrationWarning`

---

## 验收标准汇总

### P0 验收（Epic1）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(source).not.toMatch(/setInterval/)` | 静态检查 |
| E1-F1 | `expect(source).not.toMatch(/setTick/)` | 静态检查 |
| E1-F2 | `expect(source).toMatch(/useEffect.*persistQueryClient/s)` | 静态检查 |

### P1 验收（Epic2）

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E2-F1 | `expect(formatDate(...)).toBe('2026-04-04')` | 单元测试 |
| E2-F1 | `expect(page).not.toMatch(/toLocaleDateString/)` | 静态检查 |
| E2-F2 | `expect(source).toMatch(/suppressHydrationWarning/)` | 静态检查 |

### 集成验收
```typescript
// Playwright: 所有主要页面无 hydration error
const pages = ['/', '/projects', '/canvas', '/dashboard'];
for (const path of pages) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const hydrationErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && /hydrat/i.test(msg.text())) {
      hydrationErrors.push(msg.text());
    }
  });
  expect(hydrationErrors).toHaveLength(0);
}
```

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | Next.js 14 App Router |
| 性能 | 初始化逻辑不增加 hydration 时间 |
| 测试 | 所有页面 hydration error = 0 |

---

**PRD 状态**: ✅ 完成
**下一步**: Dev 实现
