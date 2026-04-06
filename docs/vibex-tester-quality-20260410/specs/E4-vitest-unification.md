# Spec: E4 - Vitest 框架统一

**Epic**: E4
**来源**: T-P0-4
**工时**: 2.5h
**状态**: Draft

---

## 1. Overview

将所有 Jest 语法测试迁移到 Vitest，消除双框架维护负担，清理 Jest 配置文件。

## 2. Problem Statement

VibeX 同时维护 Jest 和 Vitest 两套测试框架：
- `useAIController.test.tsx` 使用 Jest 语法（`jest.fn()`、`jest.mock()`）
- `vitest.config.ts` 是当前主框架
- Jest 配置可能仍在 `package.json` 中或作为独立文件

双框架导致：
- 学习成本和维护成本翻倍
- `useAIController.test.tsx` 因 exclude 规则被跳过

## 3. Technical Spec

### 3.1 迁移 useAIController.test.tsx

**变更前** (Jest 语法):
```typescript
import { jest } from '@jest/globals';
const mockUseAI = jest.fn();
// 或
const useAI = require('./useAI');
jest.mock('./useAI');
```

**变更后** (Vitest 语法):
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
const mockUseAI = vi.fn();
// 或
vi.mock('./useAI');
```

**检查清单**:
- [ ] `jest.fn()` → `vi.fn()`
- [ ] `jest.mock()` → `vi.mock()`
- [ ] `jest.spyOn()` → `vi.spyOn()`
- [ ] `require()` → `import`
- [ ] `@jest/globals` import → `vitest` import
- [ ] `describe`, `it`, `test`, `expect` 来自 `vitest` 而非 `jest`

### 3.2 修复 useAutoSave.test.ts

**问题**: `vitest.config.ts` 或配置中可能有 `exclude` 规则将 `useAutoSave.test.ts` 排除在外。

**检查并修复**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // 移除对 useAutoSave.test.ts 的 exclude
    ]
  }
});
```

### 3.3 Jest 配置清理

**检查 `package.json`**:
```json
{
  "scripts": {
    // 移除 "test:jest": "jest"
    // 保留 "test": "vitest run"
  }
}
```

**检查并删除/废弃**:
- `jest.config.js`
- `jest.config.ts`
- `jest.setup.ts`
- `.jestrc`

**在 Jest 配置文件顶部添加废弃注释**（如需保留历史）:
```typescript
// ⚠️ DEPRECATED: Jest 已废弃，请使用 Vitest
// 删除时间: 待 @ci-blocking 清理完成后
// import { defineConfig } from 'jest';
// ...
```

## 4. Acceptance Criteria

### S4.1: useAIController.test.tsx 迁移
```bash
npx vitest run src/useAIController.test.tsx --reporter=verbose
# 期望: 测试运行，无 FAIL
```

### S4.2: useAutoSave.test.ts 不被 exclude
```bash
npx vitest run src/useAutoSave.test.ts --reporter=verbose
# 期望: 测试运行（不被跳过）
```

### S4.3: Jest 清理
```bash
ls jest.config.* 2>/dev/null && echo "still exists" || echo "cleaned"
# 期望: cleaned
grep "test:jest" package.json && echo "still exists" || echo "cleaned"
# 期望: cleaned
```

## 5. Out of Scope

- 迁移其他可能存在的 Jest 测试（基于扫描结果）
- 性能对比测试

## 6. Dependencies

- 无外部依赖
- 可并行于 E5 执行

## 7. Rollback Plan

- 保留 Jest 配置文件的 git 历史，可随时恢复
- 标记 commit 以便快速回退
