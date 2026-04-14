# Spec: E4 - Canvas Phase 导航 + TabBar 规格

## Tab 行为对称

```typescript
const TAB_PHASES = {
  context: { phase: 'context', tree: 'bounded-context' },
  domain: { phase: 'domain', tree: 'domain-model' },
  flow: { phase: 'flow', tree: 'flow' },
  component: { phase: 'component', tree: 'component' },
  prototype: { phase: 'prototype', tree: 'component' }, // 对称
};

// 所有 tab 均有 phase + tree 更新
```

## Active 高亮

- CSS: `background: var(--color-primary-muted)`, `borderBottom: 2px solid var(--color-primary)`
- 刷新保持：sessionStorage 存储当前 phase
- 过渡动画：`transition: 200ms ease-out`

## E2E 验证

- 5 个 tab 均可点击
- 点击后 URL 参数更新
- mobile prototype tab 行为与桌面一致
