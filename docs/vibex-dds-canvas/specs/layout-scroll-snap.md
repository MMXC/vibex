# Spec: 奏折横向布局 CSS 规格

## 布局结构

```
┌───────┬──────────────────────────┬───────┐
│ 收起  │        展开面板          │ 收起  │
│ 80px  │     (flex: 1, 100vw)    │ 80px  │
│       │                          │       │
│ 缩略图│    React Flow 画布        │ 缩略图│
│       │                          │       │
└───────┴──────────────────────────┴───────┘
```

## CSS 核心实现

```css
/* DDS 画布容器 */
.dds-horizontal {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none; /* 隐藏滚动条 */
}

.dds-horizontal::-webkit-scrollbar {
  display: none;
}

/* 收起面板 */
.dds-panel-collapsed {
  width: 80px;
  min-width: 80px;
  scroll-snap-align: start;
  cursor: pointer;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  transition: width 200ms ease-out;
}

.dds-panel-collapsed:hover {
  width: 100px;
}

/* 展开面板 */
.dds-panel-expanded {
  flex: 1;
  min-width: 100vw;
  scroll-snap-align: center;
  background: var(--color-bg-primary);
  position: relative;
}

/* 缩略图（收起时） */
.dds-panel-thumb {
  width: 100%;
  height: 60px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* 工具栏（画布上方固定） */
.dds-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 48px;
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-2);
}
```

## JavaScript 切换逻辑

```typescript
function scrollToPanel(panelIndex: number) {
  const container = document.querySelector('.dds-horizontal');
  const panels = container.querySelectorAll('.dds-panel');
  if (panels[panelIndex]) {
    panels[panelIndex].scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    });
  }
}
```
