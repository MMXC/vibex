# E1 Review Report — vibex-proposals-20260425-143000

**Reviewer**: reviewer | **Date**: 2026-04-25
**Branch**: s9-e1-analytics-fix | **Commits**: 83b2caac9 → e22426931

---

## 🔴 INV 自检

- [x] INV-0 读过文件了吗？是的
- [x] INV-1 改了源头，消费方 grep 过了吗？API改了，widget没适配
- [x] INV-2 格式对了，语义呢？API返回 raw events，widget需要 aggregated metrics
- [x] INV-4 同一件事写在了几个地方？API和widget独立，格式不匹配
- [x] INV-5 复用这段代码？widget有完整测试覆盖（9 passing）
- [x] INV-6 验证从用户价值链倒推了吗？widget期望metrics，但API给events
- [x] INV-7 跨模块边界有没有明确的 seam_owner？API contract和widget contract不匹配

---

## 🔴 Critical Blockers

### B1: API Contract Mismatch — Widget receives wrong data format

**位置**: `vibex-backend/src/routes/v1/analytics.ts` + `vibex-fronted/src/components/dashboard/AnalyticsWidget.tsx`

**问题**: 后端 API 返回结构与前端期望完全不匹配。

| | API 实际返回 | Widget 期望 |
|---|---|---|
| 成功时 | `{ events: [...], count: N }` (原始事件数组) | `{ metrics: { page_view: [...], canvas_open: [...], component_create: [...], delivery_export: [...] }, period: {...} }` |
| 降级时 | `{ events: [], count: 0, _fallback: true }` | `{ metrics: { ... }, period: {...} }` |

Widget 代码（AnalyticsWidget.tsx:342）:
```ts
const json: AnalyticsData = await res.json();
const hasData = json.metrics && ...  // json.metrics === undefined!
```

当 API 返回 200 时，`json.metrics` 为 `undefined`，widget 判定 `hasData = false`，状态设为 `empty`。

当 API 返回 500 时（生产环境），widget 进入 error 状态，显示"加载失败"。

**根本原因**: E1-S1 实现了 graceful degradation，但从未实现事件聚合逻辑（按 event type 和 date 分组）。Widget 永远无法正确展示数据。

---

### B2: 生产环境 API 仍返回 500

**验证**: `curl https://api.vibex.top/api/v1/analytics` → `{"error":"Internal server error","status":500}`

E1-S1 spec 要求修复 500 错误，但生产环境仍未通过验收。

---

## 🟡 Missing Requirements

### S1: 缺少 E2E 测试

**约束来源**: AGENTS.md — 每个 Story 至少一个 Playwright 文件

E1-S2 无任何 Playwright E2E 测试文件。

---

## ✅ 通过项

| 检查项 | 状态 |
|---|---|
| Commit message 含 Epic 标识 | ✅ `83b2caac9`, `21005374e` 含 `e1-` 前缀 |
| CHANGELOG 已更新 | ✅ `vibex-proposals-20260425 E1: Analytics API 修复 + Dashboard Widget` |
| Vitest 测试通过 | ✅ `9 tests passed` |
| ESLint 通过 | ✅ `0 errors` |
| Widget 四态 UI | ✅ idle/loading/success/error/empty 均有 |
| 纯 SVG（无图表库） | ✅ 无 recharts/chart.js 依赖 |
| data-testid 规范 | ✅ `analytics-skeleton`, `analytics-error`, `analytics-empty` |
| CSS Modules | ✅ `AnalyticsWidget.module.css` |

---

## ❌ 结论: REJECTED

**驳回原因**: `B1` — API 返回 `{ events: [...] }` 但 Widget 期望 `{ metrics: { page_view: [...], ... } }`。**API contract 和前端 widget contract 不匹配**。Widget 接收任何 API 响应都无法正确展示数据。即使 DB 问题修复，API 也无法驱动 Widget 正常工作。

**误报防范确认**: 功能已在当前 diff 中实现（Widget 组件存在，graceful degradation 存在），但实现有缺陷（API/Widget 格式不匹配）。驳回理由是**当前 diff 本身的功能代码缺陷**，非 changelog 缺失或功能未实现。
