# Implementation Plan: canvas-initial-scroll-fix

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

### E1: requestAnimationFrame 双重保证修复

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E1-T1 | 实现 rAF 双重归零 | 0.25h | `vibex-fronted/src/app/canvas/page.tsx` | useEffect 包含双重 rAF |
| E1-T2 | E2E 测试编写 | 0.15h | `e2e/canvas-scroll.spec.ts` | 3 个场景全部 pass |
| E1-T3 | 手动验证 | 0.1h | - | scrollTop = 0 可观察 |

---

## 三、关键路径

```
CanvasPage.tsx useEffect → rAF#1 → rAF#2 → resetScroll() → scrollTop === 0
```

线性路径，无分支。

---

## 四、详细实现步骤

### Step 1: 修改 CanvasPage.tsx

```tsx
// vibex-fronted/src/app/canvas/page.tsx

useEffect(() => {
  const resetScroll = () => {
    // 主容器归零
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // 文档视口归零（备用）
    window.scrollTo(0, 0);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });
}, []); // 空依赖：仅 mount 时执行
```

### Step 2: 编写 E2E 测试

```typescript
// e2e/canvas-scroll.spec.ts
test('scrollTop = 0 on canvas entry from homepage', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="switch-to-canvas"]');
  await page.waitForTimeout(200);
  const scrollTop = await page.evaluate(() => {
    const c = document.querySelector('[class*="canvasContainer"]');
    return c?.scrollTop ?? -1;
  });
  expect(scrollTop).toBe(0);
});
```

### Step 3: 验证命令

```bash
# 本地验证
npx playwright test e2e/canvas-scroll.spec.ts

# 手动验证
# 1. 打开浏览器 DevTools
# 2. 进入 /canvas
# 3. 控制台输入: document.querySelector('[class*="canvasContainer"]')?.scrollTop
# 4. 期望输出: 0
```

---

## 五、风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| rAF 仍不够（DOM 深层嵌套） | 低 | 中 | 如有必要升级为 setTimeout(100) 兜底 |
| SSR 环境下 window 不存在 | 低 | 中 | 已有 if (typeof window !== 'undefined') 检查 |

---

## 六、DoD

- [ ] CanvasPage.tsx 包含双重 rAF useEffect
- [ ] `expect(scrollTop).toBe(0)` E2E 测试 pass
- [ ] 手动验证 scrollTop = 0

---

*计划版本: v1.0 | 生成时间: 2026-04-01*
