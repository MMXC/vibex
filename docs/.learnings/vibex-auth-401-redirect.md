# VibeX 401 重定向修复 — 经验沉淀

> **项目**: vibex-auth-401-redirect
> **完成日期**: 2026-04-13
> **问题类型**: integration_issue
> **状态**: ✅ 完成
> **Epic 数**: 3（Epic1 canvasApi / Epic2 AuthProvider / Epic3 LeftDrawer）

---

## 问题回顾

### 原始问题

401 认证错误在 Canvas 画布各处（快照、历史、恢复等）静默发生，用户无法感知登录状态失效，体验断裂。

### 根因分析

**架构性断裂**：`canvasApi` 抛出 401 错误后，各调用点各自处理，没有统一的重定向机制。

---

## 解决方案：三层防御架构

### Epic1 — canvasApi.ts 401 事件分发修复

**改动**：`canvasApi.ts` 的 `handleResponseError` 在 401 时派发自定义事件，而非直接 throw：

```ts
// canvasApi.ts — 401 处理
if (res.status === 401) {
  // 派发事件，让各层决定如何处理
  window.dispatchEvent(new CustomEvent('canvas:auth-required', {
    detail: { returnUrl: window.location.pathname }
  }));
  throw new Error('请先登录');
}
```

**好处**：snapshot、restore 等其他调用点自动受益，无需逐个修改。

---

### Epic2 — AuthProvider 挂载与全局监听

**改动**：AuthProvider 在 mount 时注册全局监听：

```ts
// AuthProvider.tsx
useEffect(() => {
  const handler = (e: Event) => {
    const returnTo = (e as CustomEvent).detail?.returnUrl || '/dashboard';
    redirectToLogin(returnTo);
  };
  window.addEventListener('canvas:auth-required', handler);
  return () => window.removeEventListener('canvas:auth-required', handler);
}, []);
```

---

### Epic3 — LeftDrawer 兜底 + 测试

**改动**：LeftDrawer 作为最后兜底，确保 401 时导航不丢失。

---

## 核心教训

### 教训 1：事件分发优于逐点修改

**旧模式**（❌）：
```ts
// 每个 API 调用点各自处理 401
try {
  await listSnapshots();
} catch (e) {
  if (is401(e)) redirect('/login');
}
```

**新模式**（✅）：
```ts
// canvasApi.ts 统一派发事件
window.dispatchEvent(new CustomEvent('canvas:auth-required', { detail: { returnUrl } }));

// AuthProvider 统一监听
window.addEventListener('canvas:auth-required', handler);
```

**好处**：新增 API 调用点无需重复处理 401，代码量 O(1) 而非 O(n)。

---

### 教训 2：returnUrl 必须传递，避免登录后丢失上下文

```ts
// ✅ 传递 returnUrl
window.dispatchEvent(new CustomEvent('canvas:auth-required', {
  detail: { returnUrl: window.location.pathname }
}));

// auth/page.tsx 读取 returnTo
const returnTo = searchParams.get('returnTo') || '/dashboard';
```

---

### 教训 3：三层防御确保鲁棒性

| 层 | 机制 | 作用 |
|----|------|------|
| Layer 1 | canvasApi 事件分发 | 统一拦截所有 API 401 |
| Layer 2 | AuthProvider 全局监听 | 路由级重定向 |
| Layer 3 | LeftDrawer 兜底 | 确保导航不丢失 |

---

## 预防措施

1. **所有 API 调用层统一使用事件分发处理 401**，禁止各调用点独立处理
2. **登录跳转必须携带 `returnTo` 参数**，确保用户登录后回到原页面
3. **AuthProvider 应在 layout 根组件挂载**，确保全局监听生效
4. **测试必须覆盖 401 E2E 场景**，包括 returnTo 链路验证

---

## 相关文档

- `docs/vibex-auth-401-redirect/architecture.md` — 技术设计
- `docs/vibex-auth-401-redirect/prd.md` — 产品需求文档
- `docs/vibex-auth-401-redirect/analysis.md` — 根因分析
- `docs/.learnings/vibex-auth-401-handling.md` — 401 auth 重定向循环（相关领域，已有关联经验）
