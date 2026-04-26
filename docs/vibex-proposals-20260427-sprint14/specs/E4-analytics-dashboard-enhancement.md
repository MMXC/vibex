# S14-E4 Spec: Analytics 看板增强

## Epic 概述

为 PM 和用户提供 Canvas 使用漏斗分析和内嵌统计入口，让用户知道在哪个步骤流失，让设计师知道哪个 chapter 被用得最多。

## 推荐方案

**方案 A：FunnelWidget + Canvas 内嵌入口**
- 新增 `/api/v1/analytics/funnel` endpoint，7 天滚动窗口转化率
- FunnelWidget：纯 SVG 漏斗图，无需外部图表库
- DDSCanvasPage 工具栏增加"分析"按钮，展开内联 Widget

## 用户故事

### US-E4.1: PM 查看漏斗转化率
**作为**PM，**我希望**看到从打开 Canvas 到最终导出代码的用户转化漏斗，**这样**我知道哪个环节需要优化。

**验收标准**:
- GET `/api/v1/analytics/funnel?range=7d` 返回 `{ success, data: { steps: [{name, count, rate}] } }`
- steps 包含至少：open_canvas, add_cards, generate_code, export_code
- rate 为前一步的相对百分比（0.0 - 1.0）

### US-E4.2: FunnelWidget 渲染正确
**作为**用户，**我希望**漏斗图能正确渲染，**这样**我能直观看到转化数据。

**验收标准**:
- Given API 返回 `{ steps: [...] }`, when FunnelWidget renders, then expect(svg).toBeVisible()
- 每个 step 有对应标签和数字
- 漏斗从上到下宽度递减（CSS width 或 SVG）

### US-E4.3: 日期范围切换
**作为**用户，**我希望**切换 7d/30d 日期范围时看到对应数据，**这样**可以对比不同周期的转化率。

**验收标准**:
- Given date range picker, when 选择 "30d", then expect(fetch).toHaveBeenCalledWith(expect.stringContaining('range=30d'))
- Given "7d", when 选中, then expect(fetch).toHaveBeenCalledWith(expect.stringContaining('range=7d'))

### US-E4.4: Canvas 内嵌分析入口
**作为**用户，**我希望**在 Canvas 页面内直接看到使用统计，**这样**不需要跳转到 Dashboard 也能了解数据。

**验收标准**:
- DDSCanvasPage 工具栏有"分析"按钮，data-testid="canvas-analytics-btn"
- 点击后 FunnelWidget 内联展开
- Dashboard 和 Canvas 内嵌两种模式渲染结果一致

### US-E4.5: 空数据优雅降级
**作为**系统，**我希望**在数据不足时显示友好提示而非空白或错误，**这样**早期用户不会困惑。

**验收标准**:
- Given 数据不足（如每步 <3 条），when FunnelWidget renders, then expect(emptyState).toHaveTextContent(/数据不足以计算漏斗/i)

## 技术规格

### API 端点
```
GET /api/v1/analytics/funnel?range=7d|30d
Response: {
  success: boolean,
  data: {
    steps: Array<{ name: string, count: number, rate: number }>
  }
}
```

### 依赖
- S10 E1 Analytics API 后端基础设施

## Definition of Done

- [ ] `/api/v1/analytics/funnel` endpoint 返回正确 schema（含 success/data/steps）
- [ ] FunnelWidget 在 Dashboard 模式渲染正常
- [ ] FunnelWidget 在 Canvas 内嵌模式渲染与 Dashboard 一致
- [ ] date range picker 切换 7d/30d 时 API 请求参数正确
- [ ] 空数据状态有友好文案（data-testid="funnel-empty-state"）
- [ ] DDSCanvasPage 有 "分析" 按钮，data-testid="canvas-analytics-btn"
- [ ] E2E 测试覆盖完整 funnel 渲染流程
