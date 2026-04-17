# E3 Spec: 用户体验增强

## S3.1 Phase 状态指示器

### 组件: PhaseIndicator
```tsx
// 位置: CanvasToolbar 底部，sticky
// 样式: ●○○ 三段式，●=选中(green)，○=未选中(gray)
// 文案: "当前：上下文建模 — 请为系统识别限界上下文"
```

### 行为
- TabBar 切换时 dot 状态同步更新
- 引导文案根据当前 phase 变化

## S3.2 新手引导卡片

### 组件: GuideCard
- 显示条件: localStorage 无 `vibex_guide_dismissed`
- 内容: "欢迎使用 VibeX Canvas" + 3 步指引
- 按钮: "开始建模" + "查看示例"
- 关闭: localStorage.set('vibex_guide_dismissed', 'true')

## S3.3 端内 Feedback

### 组件: FeedbackFAB
- 位置: CanvasPage 右下角，fixed，z-index 最高
- 弹窗: FeedbackDialog（类型下拉 + 描述 + 可选截图）

### Slack Webhook
```json
{
  "text": "🆕 新 Feedback",
  "blocks": [{
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*类型*: Bug\n*页面*: /canvas\n*描述*: ..."
    }
  }]
}
```

## S3.4 示例项目数据

```json
{
  "boundedContexts": [
    { "id": "preset-1", "name": "电商上下文", "status": "confirmed" },
    { "id": "preset-2", "name": "支付上下文", "status": "confirmed" },
    { "id": "preset-3", "name": "用户上下文", "status": "pending" }
  ],
  "businessFlows": [...],
  "components": [...]
}
```
