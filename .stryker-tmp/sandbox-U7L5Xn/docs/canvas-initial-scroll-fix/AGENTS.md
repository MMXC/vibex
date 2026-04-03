# AGENTS.md — canvas-initial-scroll-fix 开发约束

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 一、Dev 约束

### E1: scrollTop 归零

| 约束 ID | 描述 | 强制等级 |
|---------|------|---------|
| C1 | 必须使用双重 `requestAnimationFrame`（rAF × 2） | MUST |
| C2 | useEffect 依赖数组必须为空 `[]` | MUST |
| C3 | 必须使用 `scrollTo({ top: 0, behavior: 'instant' })` | MUST |
| C4 | 必须包含 `window.scrollTo(0, 0)` 作为备用 | SHOULD |
| C5 | resetScroll 函数必须内部定义（闭包） | MUST |

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
  requestAnimationFrame(() => {
    requestAnimationFrame(resetScroll);
  });
}, []); // 空依赖
```

### 错误示例

```tsx
// ❌ 单次 rAF（可能 DOM 未完成）
useEffect(() => {
  requestAnimationFrame(() => {
    container.scrollTop = 0;
  });
}, []);

// ❌ 依赖数组非空（会导致重复执行）
useEffect(() => { ... }, [someDep]);

// ❌ 直接赋值（不使用 scrollTo）
useEffect(() => {
  container.scrollTop = 0;
}, []);
```

---

## 二、禁止模式

| # | 模式 | 后果 | 正确做法 |
|---|------|------|---------|
| P1 | 单次 rAF | 可能失败 | 双重 rAF |
| P2 | setTimeout 替代 rAF | 不保证渲染帧 | 使用 rAF |
| P3 | 依赖数组非空 | 重复触发 scroll | `[]` |
| P4 | 直接赋值 scrollTop | 跳过浏览器优化 | `scrollTo` |
| P5 | 无 window.scrollTo 备用 | 主文档不归零 | 双重归零 |

---

## 三、Dev 自检清单

完成 E1 后，执行以下检查：

- [ ] `grep -n "requestAnimationFrame" page.tsx` 返回 2 次
- [ ] `grep -n "behavior: 'instant'" page.tsx` 返回 1 次
- [ ] `grep -n "window.scrollTo" page.tsx` 返回 1 次
- [ ] `grep -n "useEffect.*\\[\\]" page.tsx` 返回 1 次
- [ ] `npx playwright test e2e/canvas-scroll.spec.ts` 全绿

---

## 四、Tester 约束

| 约束 ID | 描述 |
|---------|------|
| T1 | 必须测试 3 个场景：首页跳转、直接访问、刷新 |
| T2 | `waitForTimeout(200)` 等待 rAF 执行完毕 |
| T3 | 使用 `page.evaluate()` 直接读取 scrollTop 值 |

---

## 五、Reviewer 约束

| 约束 ID | 描述 |
|---------|------|
| R1 | 确认依赖数组为空 `[]` |
| R2 | 确认 resetScroll 在 useEffect 内部定义 |
| R3 | 确认双重 rAF 结构存在 |

---

*约束版本: v1.0 | 生成时间: 2026-04-01*
