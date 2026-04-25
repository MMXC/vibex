# S9 Epic 1 Spec: Analytics 能力修复与展示

## 概述

Analytics Dashboard 是衡量产品活跃度的关键入口。当前：
- Analytics SDK 已采集数据（`src/lib/analytics/client.ts`）
- Analytics API 生产环境返回 500
- Dashboard 页面无 analytics widget 组件

## 依赖

- 后端：`vibex-backend/src/routes/v1/analytics.ts` 修复 500
- 前端：`src/app/dashboard/page.tsx` 集成 widget

---

## F1.1 后端 API 修复

### 描述
修复 `GET /api/v1/analytics` 500 错误。

### 技术方案
1. 排查日志，定位 500 根因（可能是数据库连接或 RTDB 查询）
2. 修复后返回结构：
```json
{
  "success": true,
  "data": {
    "page_view": [{ "date": "2026-04-19", "count": 142 }, ...],
    "canvas_open": [{ "date": "2026-04-19", "count": 98 }, ...],
    "component_create": [{ "date": "2026-04-19", "count": 63 }, ...],
    "delivery_export": [{ "date": "2026-04-19", "count": 31 }, ...]
  },
  "meta": {
    "start_date": "2026-04-19",
    "end_date": "2026-04-25",
    "total_days": 7
  }
}
```

### DoD
- [ ] `curl https://api.vibex.top/api/v1/analytics` 返回 200
- [ ] 4 项指标齐全（page_view / canvas_open / component_create / delivery_export）
- [ ] 7 天趋势数据
- [ ] 错误注入测试通过（模拟 RTDB 超时仍返回 200，而非 500）

---

## F1.2 AnalyticsWidget 组件

### 描述
新建 `src/components/dashboard/AnalyticsWidget.tsx`，四态 SVG 折线图展示。

### 技术方案
- 组件内部状态：idle / loading / success / error
- 图表：纯 SVG（无 recharts / chart.js 等依赖）
- 延迟加载：`loading="lazy"` on widget section，不阻塞 Dashboard LCP
- 调用已有 `src/lib/analytics/client.ts` 采集逻辑

### 四态 UI

| 状态 | 条件 | UI |
|------|------|-----|
| 加载态 | `isLoading` | Skeleton shimmer（3 条横线）|
| 正常态 | `data` 存在 | SVG 折线图 + 4 个指标卡片 |
| 空态 | `data` 存在但全 0 | "暂无数据，开始使用 VibeX →" |
| 错误态 | `error` 抛出 | "加载失败" + 重试按钮 |

### DoD
- [ ] widget 在 `/dashboard` 可见
- [ ] 四态均有 UI
- [ ] 折线图 SVG，无外部依赖
- [ ] `npx vitest run analytics-widget.test.ts` 通过
- [ ] `npx playwright test analytics-widget.spec.ts` 通过
