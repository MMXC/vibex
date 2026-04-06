# Epic 4: Hook 测试激活

**Epic ID**: E4
**项目**: vibex-tester-proposals-vibex-proposals-20260410
**概述**: 修复被 exclude 的 Hook 测试，恢复 useAIController 和 useAutoSave 的 CI 保障

---

## 1. 背景

两个关键 Hook 测试文件存在但无法在 CI 中运行：

| 文件 | 问题 | 影响 |
|------|------|------|
| `src/hooks/canvas/useAIController.test.tsx` | 使用 Jest 风格语法（`jest.fn()`、`jest.mock()`），Vitest 不兼容 | AI 生成控制逻辑无 CI 保障 |
| `src/hooks/canvas/__tests__/useAutoSave.test.ts` | 被 vitest.config.ts exclude，显式排除 | 自动保存逻辑无 CI 保障 |

## 2. 范围

### 2.1 包含
- 迁移 useAIController.test.tsx 从 jest.* 到 vi.*
- 调查并修复 useAutoSave.test.ts 被 exclude 的根因
- 从 vitest.config.ts 移除 exclude 规则
- 验证两个测试在 Vitest 中运行并通过

### 2.2 不包含
- 引入 MSW（未来 Epic）
- 新增 Hook 测试覆盖率

## 3. 技术方案

### 3.1 useAIController.test.tsx: jest → vi 迁移

**读取当前文件**:
```bash
cat vibex-fronted/src/hooks/canvas/useAIController.test.tsx
```

**迁移规则**:

| Jest 风格 | Vitest 风格 |
|-----------|------------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock('path')` | `vi.mock('path')` |
| `jest.spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.resetModules()` | `vi.resetModules()` |
| `beforeEach(() => { jest.clearAllMocks() })` | `beforeEach(() => { vi.clearAllMocks() })` |
| `import { jest }` | 删除 import（使用全局 vi） |

**兼容性**: `tests/unit/setup.tsx` 已提供 Jest globals 兼容层。但 `useAIController.test.tsx` 应直接使用 `vi.*` 以保持一致性。

**验证**:
```bash
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx --reporter=verbose
# 0 failures
```

### 3.2 useAutoSave.test.ts: 调查与修复

**步骤 1**: 读取并分析文件
```bash
cat vibex-fronted/src/hooks/canvas/__tests__/useAutoSave.test.ts
```

**步骤 2**: 读取 vitest.config.ts 确认 exclude 规则
```bash
grep -A10 "exclude" vibex-fronted/tests/unit/vitest.config.ts
```

**步骤 3**: 尝试运行测试查看失败原因
```bash
cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts 2>&1 | head -100
```

**常见问题及修复**:

问题 1: `navigator.sendBeacon` 未 mock
```ts
// 修复
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});
```

问题 2: `localStorage` mock 不完整
```ts
// 修复
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

问题 3: `fetch` mock 缺失
```ts
// 修复
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
```

**步骤 4**: 移除 exclude 规则

从 `tests/unit/vitest.config.ts` 的 exclude 数组中移除：
```ts
exclude: [
  '**/src/hooks/canvas/__tests__/useAutoSave.test.ts',  // 删除这一行
]
```

### 3.3 验证

```bash
# useAIController 测试
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx --reporter=verbose
# 0 failures

# useAutoSave 测试
cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts --reporter=verbose
# 0 failures

# exclude 已移除
grep "useAutoSave" vibex-fronted/tests/unit/vitest.config.ts
# 应无 exclude 匹配
```

## 4. 验收标准

| Story | 验收条件 | 验证命令 |
|-------|---------|---------|
| S4.1 | useAIController.test.tsx 无 jest.* 语法 | `grep "jest\." vibex-fronted/src/hooks/canvas/useAIController.test.tsx` 无输出 |
| S4.1 | useAIController 测试通过 | `cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx` 0 failures |
| S4.2 | useAutoSave 测试通过 | `cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts` 0 failures |
| S4.3 | exclude 规则移除 | `grep "useAutoSave" vibex-fronted/tests/unit/vitest.config.ts` 无 exclude 匹配 |

## 5. 预期文件变更

```
# 修改
vibex-fronted/src/hooks/canvas/useAIController.test.tsx     # jest → vi 迁移
vibex-fronted/tests/unit/vitest.config.ts                 # 移除 exclude
```

**注意**: 如果 useAutoSave.test.ts 需要 mock 补充，也可能修改该文件。

## 6. 风险

- useAutoSave 测试的失败根因可能比预期复杂（依赖链过长、真实 API 调用等）
- 缓解: Sprint Day 3 专门安排诊断时间，如果 2 小时内无法定位，标记为 "需要进一步分析" 并延后
- `useAIController.test.tsx` 迁移后可能仍有其他兼容性问题（React Testing Library、状态管理等）

## 7. 依赖

- Epic 1: Playwright 配置统一（确保 CI 环境正确）
- `tests/unit/setup.tsx`（Jest globals 兼容层）: 已存在，无需修改
