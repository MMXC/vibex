# Epic 1 Spec: 画布 Phase 状态感知层

## Component: PhaseIndicator

### 视觉规范
- 高度: 36px
- 背景: var(--color-bg-secondary)
- 三段圆点: ●(选中, green) ○(未选中, gray)
- 引导文案: 14px, var(--color-text-secondary)

### 行为
- 固定在 CanvasToolbar 底部（sticky）
- TabBar 切换时，dot 状态同步更新
- 引导文案根据当前 phase 显示对应内容

## Component: GuideCard

### 显示条件
- localStorage 中无 `vibex_guide_dismissed` 键
- 画布无任何节点时显示

### 视觉规范
- 居中浮层，max-width: 480px
- 标题: "欢迎使用 VibeX Canvas"
- 内容: 3 步操作指引
- 按钮: "开始建模" + "查看示例"
- 关闭按钮: 右上角 ×

### 行为
- 点击 × → localStorage.set('vibex_guide_dismissed', 'true')
- 点击"查看示例" → 加载 preset data → 卡片消失
- 引导卡片 z-index: 100

## Preset Data

```json
{
  "boundedContexts": [
    { "id": "preset-bc-1", "name": "电商上下文", "status": "confirmed" },
    { "id": "preset-bc-2", "name": "支付上下文", "status": "confirmed" },
    { "id": "preset-bc-3", "name": "用户上下文", "status": "pending" }
  ],
  "businessFlows": [...],
  "components": [...]
}
```
