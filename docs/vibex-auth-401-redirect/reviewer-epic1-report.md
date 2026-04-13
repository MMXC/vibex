# Review Report: Epic1-canvasApi.ts 401 事件分发修复

**Agent**: REVIEWER | 日期: 2026-04-13 22:56
**Commits**: `f3a68586` + `d7c44637` | **项目**: vibex-auth-401-redirect
**阶段**: reviewer-epic1-canvasapi.ts-401-事件分发修复

---

## INV 镜子检视

- [ ] **INV-0** ✅ 实际读取了 canvasApi.ts + validateReturnTo.ts
- [ ] **INV-1** ✅ 改 canvasApi.ts 源头，所有 API 调用点均传递 returnTo
- [ ] **INV-2** ✅ TypeScript 类型正确，handleResponseError 新增 returnTo 参数
- [ ] **INV-4** ✅ validateReturnTo 单一源
- [ ] **INV-5** ✅ validateReturnTo 被 canvasApi.ts 调用，路径明确
- [ ] **INV-6** ✅ tester 用 gstack browse 验证 + validateReturnTo.test.ts 覆盖
- [ ] **INV-7** ✅ canvasApi → validateReturnTo，seam_owner 明确

---

## Scope Check: CLEAN

**Intent**: S1.1 canvasApi 401 事件分发 + S1.2 validateReturnTo 白名单

**Delivered**:
- `f3a68586`: handleResponseError 401 → dispatchEvent + window.location.href redirect
- `d7c44637`: validateReturnTo 修复 protocol-relative 绕过（`//` bypass）

**Result**: CLEAN

---

## 代码审查

### ✅ S1.1: handleResponseError 401 处理

```typescript
// canvasApi.ts
function handleResponseError(res: Response, defaultMsg: string, returnTo?: string) {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:401', {
      detail: { returnTo: returnTo ?? window.location.pathname },
    }));
    const target = validateReturnTo(returnTo ?? window.location.pathname);
    window.location.href = `/auth?returnTo=${encodeURIComponent(target)}`;
  }
}
```

所有 API 调用点传递 `window.location.pathname` 作为 returnTo ✅

### ✅ S1.2: validateReturnTo 白名单

```typescript
const ALLOWED_PREFIXES = ['/canvas', '/design', '/projects', '/dashboard', '/auth', '/'];
```

拒绝规则：
- 不以 `/` 开头 → `/`
- 匹配 `https?://` 绝对 URL → `/`
- 以 `//` 开头（protocol-relative）→ `/`
- 不匹配白名单前缀 → `/`

`d7c44637` 修复：`//evil.com` 曾被 `/` 匹配 bypass，已修复 ✅

### 🔴 Security: validateReturnTo 零绕过

Open redirect 防护完整，无已知绕过路径 ✅

---

## 安全审查

| 检查项 | 结果 |
|--------|------|
| Open redirect | ✅ validateReturnTo 白名单 + 协议检查 |
| CustomEvent injection | ✅ 无用户输入，detail 对象结构固定 |
| XSS | ✅ encodeURIComponent(returnTo)，无 innerHTML |
| dispatchEvent | ✅ 无导航风险 |

---

## 结论

**VERDICT**: ✅ **PASSED**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 0 |

Epic1 安全修复完整，validateReturnTo 覆盖全面。
