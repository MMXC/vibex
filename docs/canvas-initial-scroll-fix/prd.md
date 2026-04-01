# PRD: canvas-initial-scroll-fix — 初次进入 Canvas scrollTop 不归零

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

初次进入 Canvas 页面时，`scrollTop = 946` 而非预期值 `0`，导致工具栏不可见。现有代码已有 reset 逻辑，但 DOM 未渲染完成时执行导致失效。

### 目标

修复初次进入 Canvas 时 scrollTop 不归零的问题。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| scrollTop 初值 | = 0 | E2E 验证 |
| 工具栏可见 | 100% | 截图验证 |

---

## 2. Epic 拆分

### Epic 1: requestAnimationFrame 修复

**工时**: 0.5h | **优先级**: P0 | **依赖**: 无

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | requestAnimationFrame 双重保证 | DOM 渲染后执行 scrollTo | `expect(scrollTop).toBe(0)` | 【需页面集成】 |
| F1.2 | E2E 测试覆盖 | canvas-scroll.spec.ts 测试全通过 | `expect(testPassed).toBe(true)` | 【需页面集成】 |
| F1.3 | 多场景验证 | 从首页/需求页进入 canvas 后 scrollTop = 0 | `expect(allScenarios).toBe(0)` | 【需页面集成】 |

#### DoD

- [ ] CanvasPage.tsx useEffect 添加 requestAnimationFrame
- [ ] E2E 测试 `canvas-scroll.spec.ts` 全部通过
- [ ] 手动验证 scrollTop = 0

---

## 3. 技术方案

**方案 A**：
```typescript
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.querySelector('[class*="canvasContainer"]');
      if (container) {
        container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      window.scrollTo(0, 0);
    });
  });
}, []);
```

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 17:52 GMT+8*
