# Analysis: Canvas ScrollTop Reset Bug v2

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-scroll-reset-fix-v2

---

## 1. 问题定义

**Bug**: canvas 页初次进入时 scrollTop = 946 而非 0
**影响**: 进入画布时内容不在顶部，工具栏不可见

---

## 2. Browse 验证结果

### 2.1 验证过程

| 测试场景 | scrollTop | 结论 |
|---------|-----------|------|
| 直接访问 /canvas | 0 | ✅ 正常 |
| 加 cachebust 参数 | 0 | ✅ 正常 |
| 首页 → canvas 跳转 | 0 | ✅ 正常 |

### 2.2 验证命令

```bash
# 直接访问
goto https://vibex-app.pages.dev/canvas
js document.querySelector('[class*="canvasContainer"]')?.scrollTop || window.scrollY
# 结果: 0

# 首页跳转后访问
goto https://vibex-app.pages.dev/
goto https://vibex-app.pages.dev/canvas
js document.querySelector('[class*="canvasContainer"]')?.scrollTop || window.scrollY
# 结果: 0
```

### 2.3 结论

**scrollTop = 0 在所有测试场景下均正常**。当前部署版本可能已修复，或 bug 仅在特定场景下触发。

---

## 3. 现有代码分析

### 3.1 CanvasPage.tsx F1.1 修复代码

```typescript
// === F1.1: Reset scrollTop on canvas mount ===
useEffect(() => {
  const resetScroll = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  };
  
  // Reset on mount - no setTimeout as per AGENTS.md constraints
  resetScroll();
}, []);
```

### 3.2 问题分析

| # | 问题 | 说明 |
|---|------|------|
| 1 | useEffect 异步执行 | resetScroll() 在 DOM 渲染后异步执行，但仍可能存在时序问题 |
| 2 | querySelector 可能返回 null | 容器未渲染时直接跳过，无重试 |
| 3 | 无防抖/节流 | 多次调用可能性能问题 |

---

## 4. 修复方案

### 4.1 方案 A：requestAnimationFrame 双重保证（推荐）

**原理**: 使用 requestAnimationFrame 确保 DOM 完全渲染后再执行重置。

```typescript
useEffect(() => {
  const resetScroll = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  };

  // Use rAF to ensure DOM is fully rendered
  const frameId = requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });

  return () => cancelAnimationFrame(frameId);
}, []);
```

**优点**:
- 确保 DOM 完全渲染
- rAF 同步到浏览器下一帧
- 可取消，避免内存泄漏

**工时**: 0.5h

---

### 4.2 方案 B：防抖重试机制

**原理**: 如果首次找不到容器，间隔重试多次。

```typescript
useEffect(() => {
  const resetScroll = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  };

  let retries = 0;
  const tryReset = () => {
    const container = document.querySelector('[class*="canvasContainer"]');
    if (container || retries < 3) {
      resetScroll();
      if (!container) {
        retries++;
        setTimeout(tryReset, 50);
      }
    }
  };

  requestAnimationFrame(tryReset);
}, []);
```

**缺点**: 代码复杂，可能过度修复

**工时**: 1h

---

### 4.3 推荐方案

**方案 A**（requestAnimationFrame 双重保证）。

**理由**:
1. Browse 验证显示当前正常，方案 A 作为预防性修复
2. 代码改动最小（仅 3 行）
3. 符合 React 最佳实践

---

## 5. 验收标准

| 场景 | 预期 | 测试方式 |
|------|------|----------|
| 直接访问 /canvas | scrollTop = 0 | Browse JS |
| 首页 → canvas | scrollTop = 0 | Browse navigation |
| 多次切换 | scrollTop = 0 | E2E test |

---

## 6. 实施路径

1. **修改**: CanvasPage.tsx useEffect 添加 rAF
2. **部署**: push to main → Vercel 自动部署
3. **验证**: Browse 再次测试确认

**工时**: 0.5h