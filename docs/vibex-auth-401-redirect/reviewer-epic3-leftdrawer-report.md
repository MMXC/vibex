# Review Report: Epic3-LeftDrawer 兜底 + 测试

**Agent**: REVIEWER | 日期: 2026-04-13 23:20
**Commits**: `6b1683be` + `23476571` | **项目**: vibex-auth-401-redirect
**阶段**: reviewer-epic3-leftdrawer-兜底-+-测试

---

## INV 镜子检视

- [ ] **INV-0** ✅ 实际读取了 LeftDrawer.tsx + auth-redirect.spec.ts
- [ ] **INV-1** ✅ 改 LeftDrawer.tsx，AuthProvider + canvasApi 已各有独立处理层
- [ ] **INV-2** ✅ TypeScript 类型正确
- [ ] **INV-4** ✅ 3 层兜底各有不同触发机制
- [ ] **INV-5** ✅ LeftDrawer.tsx 独立实现
- [ ] **INV-6** ✅ tester gstack browse 验证
- [ ] **INV-7** ✅ seam_owner 明确

---

## Scope Check: CLEAN

**Intent**: S3.1 LeftDrawer 兜底 + S3.2 returnTo 验证 + S3.3 E2E 测试

**Delivered**: `6b1683be` + `23476571`

**Result**: CLEAN

---

## 代码审查

### ✅ S3.1: LeftDrawer 3层兜底架构

| Layer | 位置 | 触发条件 |
|-------|------|---------|
| Layer 1 | canvasApi.handleResponseError | res.status === 401 |
| Layer 2 | LeftDrawer catch block | err.message.includes('401') |
| Layer 3 | LeftDrawer useEffect | window 'auth:401' event |

Layer 3 实现：
```typescript
const handler = (e: Event) => {
  if (window.location.pathname === '/auth') return;  // 防止重复跳转
  const returnTo = (e as CustomEvent<{ returnTo?: string }>).detail?.returnTo ?? window.location.pathname;
  window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
};
window.addEventListener('auth:401', handler);
return () => window.removeEventListener('auth:401', handler);
```

Layer 2 实现：
```typescript
catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
}
```

### 🟡 S3.1 Layer 2 false-positive 风险（信息级）

`err.message.includes('401')` 可能匹配非 401 错误（如后端返回 `{message: "Session 401 expired"}`）。**评估**：Layer 2 是 defense-in-depth 兜底，Layer 1 + Layer 3 已覆盖正确场景，误跳概率极低。

### ✅ S3.3: E2E 测试

auth-redirect.spec.ts 覆盖 AC-5/AC-7-1~4：logout不触发、returnTo白名单/阻断 ✅

---

## 安全审查

| 检查项 | 结果 |
|--------|------|
| Layer 3 returnTo | ✅ encodeURIComponent 无注入 |
| Layer 3 /auth 检查 | ✅ 防止重复跳转 |
| Layer 2 err.message | 🟡 理论 false-positive 风险（信息级）|

---

## 结论

**VERDICT**: ✅ **PASSED**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 0 |
| 🟡 Suggestions | 1 (Layer 2 false-positive，信息级) |

pnpm tsc --noEmit ✅
