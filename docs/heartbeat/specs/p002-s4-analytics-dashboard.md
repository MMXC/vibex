# SPEC: P002-S4 Analytics Dashboard

**关联 Epic**: P002 Firebase 实时协作可行性验证
**Story**: P002-S4 Analytics Dashboard 页面集成
**日期**: 2026-04-25
**状态**: 草稿

---

## 1. 组件概述

Analytics Dashboard 是 `/dashboard` 页面中的 Analytics Widget，用于展示用户行为数据（页面访问/组件创建/导出）。用户通过此组件快速了解系统使用情况。

---

## 2. 四态定义（神技4：状态机）

### 2.1 AnalyticsWidget 主容器

#### 理想态
- 展示 3 张 stat-card（页面访问数/组件创建数/导出次数）
- 每张卡片显示数字 + 趋势箭头（相比上周）
- 数据刷新周期：30s
- 布局：横向 3 列，间距为 8 的倍数（16px/24px/32px）

#### 空状态
- **禁止留白**。必须展示引导插图 + 文案：
  - **插图**: 简约数据图表插图（灰色调）
  - **文案**: "暂无数据，开始使用 VibeX 后数据会自动生成"
  - **引导按钮**: "查看使用教程"
- 布局：居中展示，插图上方、文案下方

#### 加载态
- **必须使用骨架屏**，禁止使用 loading spinner（会抖动）
- 骨架屏：3 个占位卡片，模拟 stat-card 形状
- 骨架屏背景色：`--color-skeleton`，动画：渐变闪烁（1.5s ease-in-out infinite）
- 骨架屏停留时间：最长 3s，超时显示"数据加载中，请稍候"

#### 错误态
覆盖以下 4 种错误类型：
1. **网络异常**: 文案 "数据加载失败，请检查网络连接"，提供"重试"按钮
2. **权限不足**: 文案 "无权查看数据，请联系管理员"，显示锁图标
3. **数据超长**: 文案 "数据量较大，展示已优化"，数字以 K/M 缩写
4. **接口超时**: 文案 "请求超时，数据将在下次刷新时更新"，自动重试倒计时（15s）

---

## 3. StatCard 组件

### 3.1 间距规范（神技5：原子化）

| 场景 | 间距值 |
|------|--------|
| stat-card 内边距 | 16px |
| stat-card 间距 | 24px |
| 标题与数字间距 | 8px |
| 数字与趋势间距 | 8px |

### 3.2 颜色 Token（神技5）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-stat-card-bg` | `#FFFFFF` | 卡片背景 |
| `--color-stat-card-border` | `var(--color-border)` | 卡片边框 |
| `--color-stat-title` | `var(--color-text-secondary)` | 标题文字 |
| `--color-stat-value` | `var(--color-text-primary)` | 数字值 |
| `--color-stat-trend-up` | `var(--color-success)` | 上升趋势（绿色） |
| `--color-stat-trend-down` | `var(--color-danger)` | 下降趋势（红色） |
| `--color-skeleton` | `#E5E7EB` | 骨架屏背景 |

### 3.3 四态定义

#### 理想态
- 标题（如"页面访问"）
- 数字值（如"1,234"）
- 趋势指示器（箭头 + 百分比，如 "↑ 12%"）
- 数字使用等宽字体：`font-variant-numeric: tabular-nums`

#### 空状态
- 标题正常显示
- 数字显示 "—"
- 趋势不显示

#### 加载态
- 标题占位（灰色矩形，高度 16px，宽度 60px）
- 数字占位（灰色矩形，高度 32px，宽度 80px）
- 趋势占位（灰色矩形，高度 16px，宽度 40px）

#### 错误态
- 标题正常显示
- 数字显示 "—"
- 趋势不显示
- 卡片右上角显示警告图标

---

## 4. 用户情绪地图（神技3）

| 阶段 | 情绪 | 引导策略 |
|------|------|----------|
| 进入页面 | 期待/好奇 | 骨架屏占位，让用户知道正在加载 |
| 数据加载完成 | 满足 | stat-card 动画淡入（opacity 0→1, 300ms ease-out） |
| 数据为空 | 困惑/失落 | 引导插图 + 文案 + 教程按钮，不让用户感到"坏了" |
| 数据加载失败 | 焦虑/挫败 | 明确错误类型 + 重试按钮 + 倒计时，不要让用户觉得"无解" |
| 数据量很大 | 震撼/信任 | 数字以 K/M 缩写，但 hover 显示完整数字 |

---

## 5. 响应式规范（神技6：开发同理心）

| 断点 | 布局 |
|------|------|
| Mobile (< 640px) | 3 张卡片纵向堆叠，卡片宽度 100% |
| Tablet (640px - 1024px) | 3 张卡片横向排列，卡片宽度 33.33% |
| Desktop (> 1024px) | 3 张卡片横向排列，卡片宽度 33.33%，最大宽度 320px |

对齐方式：
- stat-card 内容水平居中（`text-align: center`）
- stat-card 组垂直居中于 widget 容器

---

## 6. 验收标准

```javascript
// AnalyticsWidget 可见性
expect(isVisible('.analytics-widget'), 'to be', true)

// 骨架屏加载态
expect(isVisible('.skeleton-card'), 'to be', true)

// 空状态文案
expect(page.locator('.empty-state-message').textContent(), 'to contain', '暂无数据')

// 错误态网络异常
page.route('**/api/analytics**', route => route.abort())
await page.reload()
expect(isVisible('.error-state'), 'to be', true)
expect(page.locator('.error-message').textContent(), 'to contain', '网络')

// 数字展示
const value = await page.locator('.stat-value').first().textContent()
expect(value, 'to match', /^\d|—/)

// 趋势指示器
expect(isVisible('.trend-indicator'), 'to be', true)

// 响应式 Mobile
await page.setViewportSize({width: 375, height: 667})
const cards = page.locator('.stat-card')
expect(await cards.first().evaluate(el => el.offsetWidth < 400), 'to be', true)
```
