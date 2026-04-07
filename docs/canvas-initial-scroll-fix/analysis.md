# Analysis: Canvas Initial ScrollTop Bug

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-initial-scroll-fix

---

## 1. 问题定义

**Bug 描述**: 初次进入 canvas 页面时，`scrollTop = 946` 而非预期值 `0`。

**影响**: 工具栏不可见（tools invisible when switching from requirements to canvas）

---

## 2. 现状分析

### 2.1 现有修复代码

CanvasPage.tsx (lines 125-135) 已存在 F1.1 重置逻辑：

```typescript
// === F1.1: Reset scrollTop on canvas mount ===
useEffect(() => {
  // Use scrollTo API as required by AGENTS.md C2
  const resetScroll = () => {
    // Try to find canvas container by class and use scrollTo
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // Also reset window scroll for safety
    window.scrollTo(0, 0);
  };
  
  // Reset on mount - no setTimeout as per AGENTS.md constraints
  resetScroll();
}, []);
```

### 2.2 测试覆盖

E2E 测试文件 `canvas-scroll.spec.ts` 已存在：

```typescript
// Tests the fix for: tools invisible when switching from requirements to canvas (scrollTop=946)
```

测试用例：
- `scrollTop is 0 after navigating to canvas`
- `all toolbar elements visible after switching to canvas`
- `scrollTop stays 0 after repeated navigation`
- `scrollTop is 0 after navigation from homepage`

---

## 3. 根因分析

### 可能原因

| # | 原因 | 证据 | 概率 |
|---|------|------|------|
| 1 | 组件未渲染时执行 reset | `document.querySelector` 可能返回 null | 中 |
| 2 | 组件渲染后被其他逻辑覆盖 | 无其他 scroll 设置代码 | 低 |
| 3 | Zustand persist 状态遗留 | canvasStore 无 scrollTop 状态 | 低 |

### 最可能原因

**原因 1：组件未渲染时执行**

代码 `resetScroll()` 在 `useEffect` 中立即执行，但此时 DOM 可能尚未完全渲染。

```typescript
useEffect(() => {
  resetScroll(); // 立即执行，可能 DOM 未就绪
}, []);
```

虽然依赖数组为空（仅执行一次），但 React 的 useEffect 在组件挂载后**异步**执行，不保证 DOM 已渲染完成。

---

## 4. 修复方案

### 方案 A：延迟执行（推荐）

**修改**：添加 `requestAnimationFrame` 或 `setTimeout` 确保 DOM 已渲染。

```typescript
useEffect(() => {
  const resetScroll = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  };
  
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });
}, []);
```

**优点**:
- 确保 DOM 渲染完成
- 使用 requestAnimationFrame 而非 setTimeout，性能更好

**工时**: 0.5h

---

### 方案 B：强制同步重置

**修改**：在组件 return 之前执行重置（同步）。

```typescript
// 在 return 之前
const container = document.querySelector('[class*="canvasContainer"]');
if (container) container.scrollTop = 0;
```

**缺点**: 违反 React 渲染周期规范，可能导致警告

**工时**: 0.5h

---

### 方案 C：CSS 默认值

**修改**：在 CSS 中设置默认值。

```css
.canvasContainer {
  /* ... */
  scroll-behavior: smooth; /* 改为 smooth 或 auto */
}
```

但这不能解决 scrollTop 非 0 的问题。

---

## 5. 推荐方案

**方案 A**（requestAnimationFrame 双重保证）作为修复。

**理由**:
1. 现有代码已有 reset 逻辑，修复仅需增加时机保障
2. requestAnimationFrame 是浏览器推荐的渲染同步方式
3. E2E 测试已存在，修复后可直接验证

---

## 6. 验收标准

| 场景 | 预期行为 |
|------|----------|
| 直接访问 /canvas | scrollTop = 0 |
| 从首页点击进入 canvas | scrollTop = 0 |
| 多次切换 canvas | scrollTop 始终 = 0 |

**测试覆盖**：现有 `canvas-scroll.spec.ts` E2E 测试全部通过

---

## 7. 实施路径

1. **修改**: CanvasPage.tsx useEffect 添加 requestAnimationFrame
2. **测试**: 运行 `npx playwright test canvas-scroll.spec.ts`
3. **验证**: 手动访问 /canvas 确认 scrollTop = 0

**工时**: 0.5h

---

## 8. 下一步

1. **派发开发**: `dev-canvas-initial-scroll` → 实现方案 A
2. **测试验证**: tester 运行 E2E 测试确认修复