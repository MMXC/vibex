# Implementation Plan: canvas-scroll-reset-fix-v2

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 一、实施概述

| 项目 | 值 |
|------|-----|
| 总工时 | 0.5h |
| Epic 数 | 1 |
| 可并行 | ✅ |
| 依赖 | 无 |

---

## 二、任务拆分

### E1: requestAnimationFrame 防御性修复

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E1-T1 | 实现 rAF 双重保证 + cleanup | 0.25h | `vibex-fronted/src/app/canvas/page.tsx` | frameId + cancelAnimationFrame 存在 |
| E1-T2 | E2E 测试编写 | 0.15h | `e2e/canvas-scroll-reset.spec.ts` | 4 个场景全部 pass |
| E1-T3 | 手动验证 | 0.1h | - | scrollTop = 0 可观察 |

---

## 三、详细实现步骤

### Step 1: 修改 CanvasPage.tsx

```tsx
// vibex-fronted/src/app/canvas/page.tsx

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

### Step 2: 编写 E2E 测试

```bash
# 运行测试
npx playwright test e2e/canvas-scroll-reset.spec.ts

# 手动验证
# 1. goto /canvas
# 2. DevTools console: document.querySelector('[class*="canvasContainer"]')?.scrollTop
# 3. 期望: 0
```

---

## 四、风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| SSR 环境下 window 不存在 | 低 | 中 | 已有 if (container) 检查，window.scrollTo 在 SSR 时静默失败（无副作用） |
| rAF 在组件卸载前未执行 | 低 | 低 | cancelAnimationFrame 确保清理 |

---

## 五、DoD

- [ ] CanvasPage.tsx 包含双重 rAF + cancelAnimationFrame cleanup
- [ ] 4 个 E2E 场景全部 pass
- [ ] 手动验证 scrollTop = 0

---

*计划版本: v1.0 | 生成时间: 2026-04-01*
