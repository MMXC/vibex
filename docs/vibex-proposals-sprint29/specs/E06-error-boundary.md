# E06: Error Boundary — 详细规格

## 1. 背景

E06 实现 Canvas 页面 ErrorBoundary 包裹，确保组件树渲染失败时显示友好 fallback UI，不阻塞用户操作。

## 2. 设计原则

- ErrorBoundary 包裹 `DDSCanvasPage` / `CanvasPage` 等顶层组件
- Fallback 显示"渲染失败"提示 + "重试"按钮
- 不泄露内部错误信息到 UI
- 支持手动重置状态

## 3. Fallback UI 设计

```
┌─────────────────────────────────────────┐
│                                         │
│          ⚠️ 渲染失败                    │
│                                         │
│   Canvas 组件渲染遇到问题。             │
│   请尝试刷新或联系技术支持。            │
│                                         │
│          [重新加载]  [返回 Dashboard]  │
│                                         │
└─────────────────────────────────────────┘
```

样式：
- 深色背景（#0a0a0a）
- 居中显示，白色文字
- "重新加载"按钮点击触发 `window.location.reload()`
- "返回 Dashboard"按钮点击触发 `router.push('/dashboard')`

## 4. ErrorBoundary 实现

```typescript
class CanvasErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 可选：上报错误到监控服务
    console.error('[CanvasErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <CanvasErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

## 5. 边界条件

| 场景 | 处理方式 |
|------|----------|
| 网络中断导致组件加载失败 | ErrorBoundary 捕获，显示 fallback |
| 组件 render 抛出异常 | ErrorBoundary 捕获，显示 fallback |
| 异步数据加载失败 | 组件内 try/catch，fallback 状态 |
| 内存耗尽导致 crash | 浏览器崩溃，无法拦截（超出范围） |
| 第三方 SDK 异常 | 隔离到独立组件，不影响 Canvas 主渲染 |

## 6. 验收门控

- [ ] DDSCanvasPage 有 ErrorBoundary 包裹
- [ ] 模拟错误时显示"渲染失败"fallback
- [ ] "重新加载"按钮触发页面刷新
- [ ] "返回 Dashboard"按钮正常跳转
- [ ] 正常渲染流程不受影响
- [ ] `tsc --noEmit` exits 0