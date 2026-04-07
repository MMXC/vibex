# Auth E2E Flaky 根因修复

## 目标
修复 Auth E2E 测试不稳定的根因，实现 100% 稳定通过。

## 验收标准
- [x] npm test -- --grep "auth" 或 "login" 连续运行 5 次全部通过
- [x] 无 flaky timeout / race condition

## 根因分析

### 问题1: OAuth Tests - Async/Sync 混乱
**文件**: `src/services/oauth/__tests__/oauth.test.ts`

**根因**: `oauth.ts` 中的 `isConnected()` 和 `getStoredToken()` 已改为 async 函数（因 `secureSet`/`secureGet` 使用 Web Crypto API），但测试仍然同步调用并期望同步结果。

```ts
// 旧代码 (test) - 同步调用
const result = isConnected('github');
expect(result).toBe(false); // 失败! 收到 Promise {}

await storeTokens('github', { accessToken: 'test-token' }); 
// 失败! TextEncoder is not defined (jsdom 无 Web Crypto API)
```

### 问题2: OAuth Tests - Web Crypto API 不可用
**文件**: `src/services/oauth/__tests__/oauth.test.ts`

**根因**: `storeTokens()` 调用 `secureSet()` → `encryptValue()` → `TextEncoder`/`crypto.subtle`。Jest jsdom 环境不提供 Web Crypto API。

### 问题3: useAuth Tests - sessionStorage 未 mock
**文件**: `src/hooks/__tests__/useAuth.test.tsx`

**根因**: `useAuth` Hook 已改为优先使用 `sessionStorage`（安全存储），但测试只 mock 了 `localStorage`。导致:
1. `AuthProvider.initAuth` effect 调用 `sessionStorage.getItem('auth_token')` → 意外触发 API 调用
2. 测试期望 `localStorage.setItem('auth_token')` 但实际存 `sessionStorage.setItem`

## 修复方案

### Fix 1: OAuth Tests
- 所有测试函数改为 `async`，使用 `await` 调用 async 函数
- Mock `@/lib/secure-storage` 模块，避免 Web Crypto API 依赖
- 相应更新测试断言

### Fix 2: useAuth Tests
- 添加 `sessionStorage` mock 与 `localStorage` 并列
- `beforeEach` 同时清理两者
- 更新 `setItem`/`removeItem` 断言检查 `sessionStorage`

## 修复后测试结果
```
Test Suites: 11 passed, 11 of 153 total
Tests:       65 passed (auth|login), 1687 skipped
连续 5 次全部通过 ✓
```

## 修复文件
- `src/services/oauth/__tests__/oauth.test.ts` - 完全重写，适配 async + mock
- `src/hooks/__tests__/useAuth.test.tsx` - 添加 sessionStorage mock

## 技术细节

### OAuth Test Mock Strategy
```ts
jest.mock('@/lib/secure-storage', () => ({
  secureSet: jest.fn().mockResolvedValue(undefined),
  secureGet: jest.fn().mockResolvedValue(null),
}));
```
- 避免 TextEncoder/crypto.subtle 不可用问题
- 验证 secureSet 被正确调用

### useAuth Test Storage Mock
```ts
const sessionStorageMock = { getItem: jest.fn(), setItem: jest.fn(), ... };
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

beforeEach(() => {
  localStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.getItem.mockReturnValue(null); // 关键！
});
```
- 防止 initAuth 意外触发
- 验证 sessionStorage（安全存储）使用
