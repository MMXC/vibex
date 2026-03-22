# PRD: Epic3 API Binding 测试修复

## 1. 业务背景

### 问题描述
`src/components/__tests__/theme-binding.test.tsx` 中的 3 个测试用例失败。根因是 `src/services/__mocks__/homepageAPI.ts` 中的 `smartFetch()` 函数无法正确检测 jest mock，导致回退到 stub 数据 `{ theme: 'dark' }`（缺少 `userPreferences` 字段）。

### 目标用户
- 前端开发工程师（修复测试）
- 持续集成（确保 npm test 通过）

## 2. 功能需求

### Epic-MockFix: 修复 smartFetch mock 检测

| Story | 描述 | 验收标准 |
|-------|------|----------|
| US-MockFix-1 | smartFetch 正确检测 jest mock | `setupFetchMock({ theme: 'dark', userPreferences: { theme: 'light' } })` 后，`smartFetch()` 返回包含 `userPreferences.theme` 的数据 |
| US-MockFix-2 | mock 检测失败时安全回退 | 当 `global.fetch` 不是 jest mock 时，返回 STUB_DATA |

### Epic-TestVerify: 验证 theme-binding 测试通过

| Story | 描述 | 验收标准 |
|-------|------|----------|
| US-TestVerify-1 | userPreferences 覆盖 API default | `setupFetchMock({ theme: 'light', userPreferences: { theme: 'dark' } })` → Consumer 显示 mode='dark' |
| US-TestVerify-2 | API default 生效（无 userPreferences） | `setupFetchMock({ theme: 'dark' })` → Consumer 显示 mode='dark' |
| US-TestVerify-3 | localStorage 持久化 | 写入 `vibex-theme` 到 localStorage，内容包含 `"mode":"dark"` |

## 3. 验收标准

| ID | Given | When | Then | expect() 断言 |
|----|-------|------|------|--------------|
| AC1 | `setupFetchMock({ theme: 'light', userPreferences: { theme: 'dark' } })` | 运行 `'API userPreferences overrides API default'` | Consumer mode='dark' | `toHaveTextContent('dark')` |
| AC2 | `setupFetchMock({ theme: 'dark' })` | 运行 `'API default used'` | Consumer mode='dark' | `toHaveTextContent('dark')` |
| AC3 | 任意 mock setup | 验证 localStorage 写入 | setItem 调用包含 `"mode":"dark"` | `toHaveBeenCalledWith('vibex-theme', expect.stringContaining('"mode":"dark"'))` |
| AC4 | 非 jest mock fetch | `smartFetch()` 被调用 | 返回 stub Response | `res.json()` resolves to `{ theme: 'dark' }` |

## 4. 技术方案

### 方案：简化 smartFetch 检测逻辑

**修改文件**: `src/services/__mocks__/homepageAPI.ts`

**当前问题代码**:
```typescript
if (
  typeof fetch === 'function' &&
  (fetch as any).mock &&
  (fetch as any)._isMockFunction
) {
```

**修复后代码**:
```typescript
if (typeof global.fetch === 'function') {
  try {
    const result = await (global.fetch as Function)();
    // 检查是否为有效的 Response-like 对象
    if (result && typeof result === 'object' && 'json' in result) {
      return result as Response;
    }
  } catch {
    // fetch 失败或不可调用，使用 stub
  }
}
```

**原理**: 不再依赖 jest 内部属性检测 mock，而是直接尝试调用并检查返回值的结构特征（`json` 方法的存在）。如果调用失败或返回值无效，则回退到 stub。

## 5. DoD

- [ ] `smartFetch()` 能正确处理 `setupFetchMock` 设置的 jest mock
- [ ] 3 个失败测试用例全部通过
- [ ] `npm test -- --coverage=false --watchAll=false --testPathPatterns=theme` 100% 通过
- [ ] 所有 homepageAPI + ThemeWrapper + theme-binding 测试全部通过
- [ ] 提交 PR 并通过 code review

## 6. Out of Scope

- 修改 `HomepageAPIResponse` 类型定义（已在 Epic 1-2 定义）
- 修改 `ThemeContext` 或 `ThemeWrapper` 实现逻辑
- 修改 `resolveMergedTheme` 合并策略
- 添加新的功能，只修复现有测试
