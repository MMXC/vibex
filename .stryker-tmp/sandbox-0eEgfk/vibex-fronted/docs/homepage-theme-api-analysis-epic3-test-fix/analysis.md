# Epic3 API Binding 测试失败根因分析

**项目**: homepage-theme-api-analysis-epic3-test-fix  
**分析时间**: 2026-03-22  
**测试环境**: `npm test -- src/components/__tests__/theme-binding.test.tsx src/services/homepageAPI.test.ts`

---

## 执行摘要

3 个组件集成测试失败，20 个测试通过。根因：**`global.fetch` 未被正确 mock**，导致 `ThemeWrapper` 组件调用真实 API 返回 500，触发 fallback 逻辑，`mode` 最终为 `'system'` 而非预期的 `'dark'`。

---

## 失败测试清单

| # | 测试用例 | 预期 | 实际 | 根因 |
|---|---------|------|------|------|
| 1 | `API userPreferences overrides API default when no localStorage` | `mode='dark'` | `mode='system'` | global.fetch 未 mock |
| 2 | `API default used when no localStorage and no userPreferences` | `mode='dark'` | `mode='system'` | global.fetch 未 mock |
| 3 | `saves resolved theme to localStorage` | `mode='dark'` | `mode='system'` | global.fetch 未 mock |

**通过的测试**（不受影响）：
- `localStorage > API userPreferences` ✅ — localStorage 提供数据，不依赖 API
- `API failure falls back to system theme` ✅ — API 500 正确触发 fallback
- `loads theme from localStorage on mount` ✅ — localStorage 提供数据
- 全部 `homepageAPI.test.ts` 单元测试 ✅

---

## 根因分析

### 问题链路

```
theme-binding.test.tsx beforeEach
  └─ jest.clearAllMocks()          ← 清除 mock 调用历史
  └─ setupFetchMock(...)            ← ❌ 仅在 API failure 测试中调用
  └─ render(<ThemeWrapper>)         ← 调用 fetchHomepageData()
      └─ global.fetch = mockFetch   ← ❌ 来自 homepageAPI.test.ts (ok: undefined)
          └─ fetch('/api/v1/homepage')
              └─ 真实网络请求 → 500
                  └─ fetchHomepageData() → null
                      └─ ThemeProvider: homepageData = undefined
                          └─ defaultMode = 'system'
                              └─ mode='system', resolved='light' ❌
```

### 直接原因：`global.fetch` 引用泄漏

**`homepageAPI.test.ts`** 在 `beforeAll` 中：
```typescript
global.fetch = mockFetch;  // 设置为 homepageAPI 专用的 mock
```

**且 `homepageAPI.test.ts` 从未在 `afterAll` 中恢复 `global.fetch`**。

当 `theme-binding.test.tsx` 运行时：
1. `beforeEach` 调用 `jest.clearAllMocks()` → 仅清除调用历史，**不恢复 global.fetch**
2. `global.fetch` 仍指向 `homepageAPI.test.ts` 的 `mockFetch`
3. `mockFetch` 使用 `mockResolvedValueOnce({...})` 设置 `json()`，**未设置 `ok` 属性**
4. `fetchHomepageData` 检查 `if (!res.ok)` → `ok: undefined` → falsy → 返回 `null`
5. `ThemeProvider` 收到 `homepageData = undefined` → 使用 `defaultMode = 'system'`

### 证据

```
[HomepageAPI] Non-OK response: 500 Error   ← 真实 API 被调用
mode: 'system'  (不是 'dark')             ← defaultMode 被触发
data-theme: "light"                        ← resolved 基于 system
```

---

## 修复方案

### 推荐方案：修改 homepageAPI.test.ts（正确修复）

**根因**：`homepageAPI.test.ts` 的 `beforeAll` 设置 `global.fetch = mockFetch`，但 `mockFetch` 未设置 `ok: true`。

**修改** `src/services/homepageAPI.test.ts` 在 `beforeAll` 中添加 `ok: true`：

```typescript
// 修改前
beforeAll(() => {
  global.fetch = mockFetch;
});

// 修改后
beforeAll(() => {
  // 设置默认 ok:true，确保测试间不互相污染
  global.fetch = mockFetch;
  // 确保 mock 有 ok 属性（防止污染后续测试文件）
  mockFetch.mockResolvedValue({
    ok: true,  // ✅ 关键：必须设置
    status: 200,
    json: () => Promise.resolve({ theme: 'light' }),
  });
});
```

或在 `beforeEach` 中为每个测试设置正确的 mock 返回值。

### 备选方案：全局 fetch mock（临时修复）

**修改** `jest.setup.ts`：

```typescript
// jest.setup.ts 末尾添加
const defaultFetchMock = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ theme: 'dark' }),
  })
);
Object.defineProperty(global, 'fetch', {
  value: defaultFetchMock,
  writable: true,
  configurable: true,
});
```

⚠️ **注意**：此方案可能影响其他依赖 `global.fetch` 的测试，建议先验证兼容性。

### 不推荐的方案

- ❌ `__mocks__/homepageAPI.ts` - Jest 未自动识别此路径
- ❌ `jest.mock` 在 jest.setup.ts - 会破坏 homepageAPI.test.ts

---

## 推荐方案

**修改 homepageAPI.test.ts**。

理由：
1. 正确修复根因：mock 缺少 `ok: true` 属性
2. 不影响其他测试
3. 符合 Jest 最佳实践：mock 应完整模拟 Response 对象

**实施步骤**：
1. 修改 `src/services/homepageAPI.test.ts`，在 `beforeAll` 中为 `mockFetch` 设置默认值
2. 运行测试验证：`npx jest src/components/__tests__/theme-binding.test.tsx src/services/homepageAPI.test.ts --no-coverage`
3. 预期：23/23 通过

---

## 风险评估

| 风险 | 等级 | 缓解 |
|------|------|------|
| 默认 mock 影响 homepageAPI.test.ts | 🟡 中 | homepageAPI.test.ts 在 `beforeAll` 完全替换 `global.fetch`，不受影响 |
| `global.fetch` 泄漏到后续测试文件 | 🟡 中 | 已在 setup 中设置为可配置，afterAll 恢复 |
| 组件测试期望不同 API 数据 | 🔴 高 | 当前默认返回 `{ theme: 'dark' }`，需确认与所有测试场景兼容 |

---

## Open Questions

1. `homepageAPI.test.ts` 为何从不恢复 `global.fetch`？是否应该在 `afterAll` 中添加 `global.fetch = originalFetch`？
2. 组件测试是否应该使用 `jest.mock('../../services/homepageAPI')` 而非 mock `global.fetch`？这样更符合 Jest 隔离原则。

---

## 验收标准

```typescript
// 运行以下命令，预期全部通过
npx jest src/components/__tests__/theme-binding.test.tsx src/services/homepageAPI.test.ts --no-coverage
// 期望: Tests: 23 passed, 0 failed
```

---

*分析产出：docs/homepage-theme-api-analysis-epic3-test-fix/analysis.md*
