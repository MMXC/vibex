# PRD: canvas-scroll-reset-fix-v2 — Canvas scrollTop 防御性修复

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Browse 验证显示当前部署版本 scrollTop = 0 正常，但现有 `useEffect` 中的 resetScroll() 存在时序风险：DOM 可能未渲染完成时即执行，导致在特定场景下 scrollTop = 946。

### 目标

添加 `requestAnimationFrame` 双重保证，确保 DOM 完全渲染后再执行 scrollTo(0,0)。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| scrollTop 初值 | = 0 | Browse JS 验证 |
| 防御性覆盖 | 100% | 无论何种进入方式均生效 |

---

## 2. Epic 拆分

### Epic 1: requestAnimationFrame 防御性修复

**工时**: 0.5h | **优先级**: P0 | **依赖**: 无

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | rAF 双重保证 | useEffect 中使用 `requestAnimationFrame(() => requestAnimationFrame(resetScroll))` | `expect(scrollTop).toBe(0)` | 【需页面集成】 |
| F1.2 | cleanup 取消 | `cancelAnimationFrame` 避免内存泄漏 | `expect(frameId).toBeDefined()` | ❌ |
| F1.3 | 多场景验证 | 直接访问/首页跳转/刷新后 scrollTop = 0 | `expect(allScenarios).toBe(0)` | 【需页面集成】 |

#### DoD

- [ ] CanvasPage.tsx useEffect 使用 rAF 双重保证
- [ ] cancelAnimationFrame cleanup 存在
- [ ] Browse 验证 scrollTop = 0

---

## 3. 技术方案

**方案 A（推荐）**：
```typescript
useEffect(() => {
  const resetScroll = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  };

  const frameId = requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });

  return () => cancelAnimationFrame(frameId);
}, []);
```

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| **可靠性** | scrollTop = 0 在所有进入场景下均生效 |
| **性能** | cancelAnimationFrame 防止内存泄漏 |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 18:09 GMT+8*
