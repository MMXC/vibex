# AGENTS.md — canvas-scroll-reset-fix-v2 开发约束

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 一、Dev 约束

### E1: requestAnimationFrame 防御性修复

| 约束 ID | 描述 | 强制等级 |
|---------|------|---------|
| C1 | 必须使用双重 `requestAnimationFrame`（rAF × 2） | MUST |
| C2 | 必须包含 `cancelAnimationFrame` cleanup | MUST |
| C3 | useEffect 依赖数组必须为空 `[]` | MUST |
| C4 | 必须使用 `scrollTo({ top: 0, behavior: 'instant' })` | MUST |
| C5 | frameId 必须被 capture 并传递给 cancelAnimationFrame | MUST |

### 正确示例

```tsx
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

### 错误示例

```tsx
// ❌ 无 cleanup（内存泄漏风险）
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });
}, []);

// ❌ frameId 未 capture（cancel 无效）
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });
  return () => cancelAnimationFrame(0); // 无效！
}, []);
```

---

## 二、禁止模式

| # | 模式 | 后果 | 正确做法 |
|---|------|------|---------|
| P1 | 无 cancelAnimationFrame | 内存泄漏 | 必须添加 cleanup |
| P2 | 单次 rAF | 时序风险 | 双重 rAF |
| P3 | frameId 丢失 | cancelAnimationFrame 无效 | 正确 capture frameId |
| P4 | 依赖数组非空 | 重复触发 | `[]` |
| P5 | 直接赋值 scrollTop | 跳过浏览器优化 | `scrollTo` |

---

## 三、Dev 自检清单

完成 E1 后，执行以下检查：

- [ ] `grep -n "requestAnimationFrame" page.tsx` 返回 2 次
- [ ] `grep -n "cancelAnimationFrame" page.tsx` 返回 1 次
- [ ] `grep -n "return.*cancelAnimationFrame" page.tsx` 返回 1 次
- [ ] `grep -n "behavior: 'instant'" page.tsx` 返回 1 次
- [ ] `npx playwright test e2e/canvas-scroll-reset.spec.ts` 全绿

---

## 四、Tester 约束

| 约束 ID | 描述 |
|---------|------|
| T1 | 必须测试 3 个场景：直接访问、首页跳转、刷新 |
| T2 | 必须验证 cancelAnimationFrame cleanup 存在 |
| T3 | `waitForTimeout(200)` 等待 rAF 执行完毕 |

---

## 五、Reviewer 约束

| 约束 ID | 描述 |
|---------|------|
| R1 | 确认 cleanup 函数返回 `cancelAnimationFrame(frameId)` |
| R2 | 确认 frameId 变量在 return 闭包中可见 |
| R3 | 确认依赖数组为空 `[]` |

---

*约束版本: v1.0 | 生成时间: 2026-04-01*
