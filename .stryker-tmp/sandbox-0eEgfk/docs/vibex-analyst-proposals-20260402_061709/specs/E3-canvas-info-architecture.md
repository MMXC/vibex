# Spec: E3 - Canvas 信息架构重构

## 1. 概述

**工时**: 6-8h | **优先级**: P1
**依赖**: 无外部依赖

## 2. 修改范围

### 2.1 scrollTop 初始化

**文件**: 各树组件 useEffect

```tsx
useEffect(() => {
  container.scrollTo(0, 0);
  return () => {
    container.scrollTop = 0;
  };
}, [activeTab]);
```

### 2.2 工具栏 sticky

**文件**: `canvas.module.css` / 工具栏组件

```css
.canvasToolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg);
}
```

### 2.3 z-index 协议

**文件**: `canvas.module.css`

```css
:root {
  --z-drawer: 50;
  --z-modal: 100;
  --z-toast: 200;
}
```

### 2.4 面板动画一致

```css
.panelContent {
  transition: height 300ms ease-in-out, opacity 300ms ease-in-out;
}
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E3-AC1 | 页面加载 | Canvas | scrollTop = 0 |
| E3-AC2 | 检查样式 | canvasToolbar | position = sticky |
| E3-AC3 | 检查 z-index | drawer/modal/toast | 50/100/200 |
| E3-AC4 | 检查动画 | 面板展开/折叠 | duration = 300ms |

## 4. DoD

- [ ] 页面加载 scrollTop = 0
- [ ] 工具栏 sticky
- [ ] z-index 协议落实
- [ ] 面板动画 300ms 一致
