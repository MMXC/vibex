# SPEC — Epic 3: 测试基础设施统一

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**Epic**: Epic 3 — 测试基础设施统一
**Stories**: ST-05
**总工时**: 8h
**状态**: Ready for Development

---

## 1. Overview

将项目从 Jest + Vitest 双测试框架统一到仅使用 Vitest，消除维护负担，简化 CI 配置。

**根因**: 项目同时运行 Jest 和 Vitest，`jest.config.js` 和 `vitest.config.ts` 并存，`tests/unit/setup.tsx` 提供 Jest globals 兼容层（`vi.fn` 替代 `jest.fn`），两套配置需同步维护。

---

## 2. Story: ST-05 — Vitest 全面迁移（8h）

### 2.1 目标
删除 `jest.config.js`，统一所有测试使用 Vitest 运行，确保无功能 regression。

### 2.2 实施步骤

#### 2.2.1 删除 Jest 配置

```bash
# 删除 Jest 配置文件
rm jest.config.js

# 删除 Jest 兼容层
rm tests/unit/setup.tsx
```

#### 2.2.2 更新 vitest.config.ts

确保 Vitest 配置覆盖所有测试目录：

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    environment: 'node',  // 或 'jsdom' / 'happy-dom'（按需）
    globals: true,         // Vitest 全局 API（类似 Jest）
    setupFiles: ['./tests/setup.ts'],  // ← 新建单一 setup 文件
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

#### 2.2.3 迁移 vi.fn() 用法

Vitest 的 `vi.fn()` 与 Jest 的 `jest.fn()` API 兼容，但仍需全面检查：

```bash
# 检查是否有 vi.fn() 需要修复
grep -rn "vi\.fn()" tests/ --include="*.ts"
grep -rn "jest\.fn()" tests/ --include="*.ts"
grep -rn "jest\." tests/ --include="*.ts"
```

常见兼容问题：
```typescript
// ❌ Jest 特定用法（需替换）
jest.spyOn(obj, 'method').mockResolvedValue(value)
jest.useFakeTimers()

// ✅ Vitest 兼容用法
vi.spyOn(obj, 'method').mockResolvedValue(value)
vi.useFakeTimers()
```

#### 2.2.4 创建统一 setup 文件

```typescript
// tests/setup.ts
import { vi } from 'vitest';

// 全局 teardown（如需要）
afterAll(() => {
  vi.restoreAllMocks();
});
```

#### 2.2.5 更新 CI 配置

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: pnpm test  # 仅运行 Vitest，不再运行 Jest
```

#### 2.2.6 并行验证（迁移期间）

在 PR 中同时运行两套测试，确认结果一致后再切换：

```yaml
# 迁移期间 CI 配置（PR 验证用）
- name: Run both test suites (migration verification)
  run: |
    pnpm test --reporter=json > vitest-results.json
    npx jest --json > jest-results.json || true
    # 对比两份 JSON 结果
```

### 2.3 验收条件

| 条件 | 验证方式 |
|------|---------|
| `jest.config.js` 文件不存在 | `ls jest.config.js` 返回 "No such file" |
| `tests/unit/setup.tsx` 文件不存在 | `ls tests/unit/setup.tsx` 返回 "No such file" |
| `pnpm test` 运行 Vitest | 输出包含 "vitest" |
| 所有现有测试通过 | `pnpm test` exit code 0 |
| CI 仅运行一套测试命令 | `.github/workflows/test.yml` 无 jest 调用 |

### 2.4 验收测试

```typescript
// 迁移后运行原有测试套件，确保无 regression
test('原有 canvas API 测试在 Vitest 下通过', async () => {
  const results = await runVitest(['tests/integration/canvas.test.ts']);
  expect(results.length).toBeGreaterThan(0);
  expect(results.every(r => r.status === 'pass')).toBe(true);
});

test('vitest.config.ts 正确配置', () => {
  const config = readVitestConfig();
  expect(config.test.globals).toBe(true);
  expect(config.test.environment).toBeDefined();
});

test('无 jest.config.js 文件残留', () => {
  expect(fs.existsSync('jest.config.js')).toBe(false);
});
```

---

## 3. DoD Checklist — Epic 3

- [ ] `jest.config.js` 文件已删除
- [ ] `tests/unit/setup.tsx` 中的 Jest compat layer 已移除
- [ ] `vitest.config.ts` 覆盖所有测试目录
- [ ] 所有现有测试在 Vitest 下通过（无 regression）
- [ ] CI 中仅运行 `pnpm test`（无 jest 命令）
- [ ] `grep -rn "jest\." tests/` 返回空（无 jest 残留引用）
- [ ] `pnpm test` exit code 0
- [ ] PR 已合并到 main

---

*Spec 由 PM Agent 基于 architect 分析文档生成 — 2026-04-10*
