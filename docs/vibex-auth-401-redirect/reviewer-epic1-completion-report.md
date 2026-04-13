# Review Report: Epic1-完成条件

**Agent**: REVIEWER | 日期: 2026-04-14 00:27
**Commits**: `f3a68586` (feat), `d7c44637` (fix) | **项目**: vibex-auth-401-redirect
**阶段**: reviewer-epic1-完成条件

---

## INV 镜子检视

- [ ] **INV-0** ✅ 实际读取了 canvasApi.ts + validateReturnTo.ts + validateReturnTo.test.ts
- [ ] **INV-1** ✅ 改 canvasApi.ts 源头，所有 API 调用点均传递 returnTo
- [ ] **INV-2** ✅ TypeScript 类型正确，handleResponseError 新增 returnTo 参数
- [ ] **INV-4** ✅ validateReturnTo 单一源，canvasApi.ts 调用清晰
- [ ] **INV-5** ✅ 理解 validateReturnTo 的安全设计意图
- [ ] **INV-6** ✅ validateReturnTo.test.ts 16/16 覆盖，canvasApi-401 测试 browser-only skip
- [ ] **INV-7** ✅ canvasApi → validateReturnTo，seam_owner 明确

---

## Scope Check: CLEAN

**Intent**: S1.1 canvasApi 401 事件分发 + S1.2 validateReturnTo 白名单

**Delivered**:
- `f3a68586`: handleResponseError 401 → dispatchEvent + window.location.href redirect
- `d7c44637`: validateReturnTo 拒绝 protocol-relative 绕过（`//` bypass）

**Result**: CLEAN

---

## 代码审查

### ✅ S1.1: handleResponseError 401 处理

所有 API 调用点（9处）均传递 `window.location.pathname` 作为 returnTo ✅

```typescript
function handleResponseError(res: Response, defaultMsg: string, returnTo?: string): never {
  if (res.status === 401) {
    // ...
    window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo } }));
    const target = validateReturnTo(returnTo ?? window.location.pathname);
    window.location.href = `/auth?returnTo=${encodeURIComponent(target)}`;
  }
}
```

### ✅ S1.2: validateReturnTo 白名单

| 防护项 | 实现 |
|--------|------|
| 非 `/` 开头 | ✅ `!startsWith('/')` → `/` |
| 绝对 URL `https?://` | ✅ `match(/^https?:\/\//)` |
| Protocol-relative `//` | ✅ `startsWith('//')` → `/` (d7c44637) |
| 非白名单路径 | ✅ ALLOWED_PREFIXES check |
| 空值 null/undefined | ✅ `!returnTo` → `/` |

### 🔴 Security: validateReturnTo 无已知绕过

- HTTP:// bypass 测试：`HTTP://evil.com` → 不以 `/` 开头 → 返回 `/` ✅
- 协议检查 `https?://` 为小写正则，但 `!startsWith('/')` 在前拦截所有协议 URL，无论大小写 ✅
- canvasApi-401.test.ts browser-only → 合理 skip，validateReturnTo 单元测试 16/16 覆盖关键路径 ✅

---

## 测试结果

| 测试文件 | 结果 |
|----------|------|
| validateReturnTo.test.ts | 16/16 ✅ |
| canvasApi-401.test.ts | 2 skipped（browser-only，需 window.location） |

---

## 质量检查

| 检查项 | 结果 |
|--------|------|
| TypeScript tsc --noEmit | ✅ 无错误 |
| validateReturnTo 测试覆盖率 | ✅ 16/16 |
| Open redirect 防护 | ✅ 完整 |
| XSS | ✅ 无 |
| Changelog (CHANGELOG.md) | ✅ 已添加条目 |
| Changelog (page.tsx) | ✅ 已存在（dev 添加） |

---

## 结论

**VERDICT**: ✅ **PASSED**

| 类型 | 数量 |
|------|------|
| 🔴 Blockers | 0 |
| 🟡 Suggestions | 0 |
| 💭 Nits | 1（CanvasPage.tsx @ts-ignore，pre-existing，与 Epic1 无关） |

Epic1 功能完整，安全性达标，CHANGELOG.md 已更新。

**提交记录**:
- `f3a68586` feat(canvas): Epic1 canvasApi 401 事件分发修复
- `d7c44637` fix(auth): validateReturnTo reject protocol-relative
- `86d78061` review: vibex-auth-401-redirect/epic1 approved
