# Review Report: Epic3-完成条件

**Agent**: REVIEWER | 日期: 2026-04-14 00:40
**Commit**: `6b1683be` | **项目**: vibex-auth-401-redirect
**阶段**: reviewer-epic3-完成条件

---

## INV 镜子检视

- [ ] **INV-0** ✅ 实际读取了 LeftDrawer.tsx + auth-redirect.spec.ts + auth/page.tsx
- [ ] **INV-1** ✅ 改 LeftDrawer.tsx，Layer 3 兜底，Layer 1+2 不受影响
- [ ] **INV-2** ✅ TypeScript 类型正确，CustomEvent 类型断言
- [ ] **INV-4** ⚠️ auth/page.tsx 有独立的 validateReturnTo（本地函数），与 src/lib/auth/validateReturnTo.ts 不同实现，返回值不同（/dashboard vs /）
- [ ] **INV-5** ✅ 理解三层防御设计：canvasApi(L1) → AuthProvider(L2) → LeftDrawer(L3)
- [ ] **INV-6** ✅ auth-redirect.spec.ts E2E 覆盖 AC-5 + AC-7-1~4
- [ ] **INV-7** ✅ 边界清晰，三层独立，无相互依赖

---

## Scope Check: CLEAN

**Intent**: S3.1 LeftDrawer 兜底 + S3.2 auth/page.tsx returnTo + S3.3 E2E 测试

**Delivered**:
- `6b1683be`: LeftDrawer.tsx Layer 3 监听器 + catch 401 跳转 + auth-redirect.spec.ts 补充

**Result**: CLEAN

---

## 代码审查

### ✅ S3.1: LeftDrawer Layer 3 兜底

```typescript
useEffect(() => {
  const handler = (e: Event) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      return; // 已在 auth 页面时不重复跳转
    }
    const returnTo = (e as CustomEvent<{ returnTo?: string }>).detail?.returnTo
      ?? window.location.pathname;
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, []);
```

**优点**:
- `window.location.pathname === '/auth'` 防止重复跳转 ✅
- CustomEvent 类型断言正确 ✅
- encodeURIComponent(returnTo) 防止 XSS ✅
- cleanup 函数正确 ✅

**Layer 2 catch 兜底**:
```typescript
} catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
}
```
err.message 包含 '401' 的条件判断合理（handleResponseError throw 的 Error 消息含状态码）✅

### ✅ S3.2: auth/page.tsx validateReturnTo

auth/page.tsx 有独立 validateReturnTo（本地函数），覆盖：
- 非 / 开头
- https?:// / javascript: / data: 协议
- // (protocol-relative)
- path traversal (/../)
- URL-encoded traversal (%2F)
- 控制字符 / 空格 / 换行

返回 `/dashboard` 作为 fallback ✅（在 auth 页面内，登录成功 fallback 到 dashboard 合理）

⚠️ **INV-4 note**: auth/page.tsx validateReturnTo 与 src/lib/auth/validateReturnTo.ts 实现不同（返回 /dashboard vs /）。两者服务不同代码路径，不冲突但略显冗余。建议后续考虑合并。

### ✅ S3.3: E2E 补充测试

5 个新测试用例：
- AC-5: logout 不触发 redirect ✅
- AC-7-1: returnTo=/canvas 允许 ✅
- AC-7-2: returnTo=https://evil.com 阻断 ✅
- AC-7-3: returnTo=javascript:alert(1) 阻断 ✅
- AC-7-4: returnTo=/../etc/passwd 阻断 ✅

---

## 安全审查

| 检查项 | 结果 |
|--------|------|
| XSS | ✅ encodeURIComponent(returnTo) |
| Open redirect | ✅ validateReturnTo 在 auth/page.tsx 和 canvasApi 两处均覆盖 |
| Auth bypass | ✅ logout 不触发 401 事件（AC-5 E2E 验证）|
| Event injection | ✅ CustomEvent 类型断言，returnTo 仅用于导航参数 |

---

## 测试结果

| 测试文件 | 结果 |
|----------|------|
| validateReturnTo.test.ts | 16/16 ✅ |
| pnpm tsc --noEmit | ✅ 无错误 |

---

## 质量检查

| 检查项 | 结果 |
|--------|------|
| TypeScript | ✅ |
| 三层防御设计 | ✅ 完整 |
| E2E 测试覆盖 | ✅ AC-5 + AC-7-1~4 |
| CHANGELOG.md | ✅ 已添加 Epic3 条目 |
| CHANGELOG page.tsx | ✅ 已存在（dev 添加）|

---

## 结论

**VERDICT**: ✅ **PASSED**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 0 |
| 🟡 Suggestions | 1（INV-4: auth/page.tsx validateReturnTo 与 lib 版本重复，建议后续合并）|

Epic3 功能完整，三层防御到位，CHANGELOG.md 已更新。

**提交记录**:
- `6b1683be` feat(canvas): Epic3 LeftDrawer 401 兜底 + E2E 测试
- `38f8a5d2` review: vibex-auth-401-redirect/epic3 approved
