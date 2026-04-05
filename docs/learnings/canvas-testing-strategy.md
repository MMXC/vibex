# 经验沉淀: canvas-testing-strategy

> **项目**: canvas-testing-strategy
> **完成时间**: 2026-04-05
> **沉淀时间**: 2026-04-05 15:26

---

## 问题描述

`CanvasPage.tsx` 正在被拆分为多个 hooks，但这些 hooks 无测试覆盖，重构后边界条件遗漏不会被自动发现。

## 解决方案

为 6 个 Canvas hooks 建立完整的单元测试套件：

| Epic | Hook | 测试数 | 覆盖率目标 |
|------|------|--------|-----------|
| E1 | useCanvasRenderer | 33 | 97.29% stmts |
| E2 | useDndSortable | 20 | 独立测试 |
| E3 | useDragSelection | 17 | 独立测试 |
| E4 | useCanvasSearch | 17 | 独立测试 |
| E5 | useTreeToolbarActions | 5 | 独立测试 |
| E6 | useVersionHistory | 17 | 独立测试 |

## 关键教训

### 1. Mock Store 的真实性问题
**发现**: 测试中的 mockStore 过于简化（所有字段返回空数组），无法真实反映 Zustand store 的实际行为。

**影响**: 测试通过但实际运行时报错。

**防范**: 每个测试前使用 `vi.mock()` 的 `mockReturnValue` 而非硬编码 mock 对象，确保 store 调用被正确追踪。

### 2. Vitest vs Jest 语法迁移
**发现**: 部分测试使用了 Jest 语法（`jest.fn()`）在 Vitest 环境中运行，导致 `vi.mock` 无法正常工作。

**防范**: Vitest 配置中 `testPathIgnorePatterns` 必须排除 `jest.*` 配置文件，确保 Vitest 只读取 `vitest.config.ts`。

### 3. Hook 单元测试的 TDD 价值
**发现**: E1 useCanvasRenderer 的 33 个测试覆盖了 null/undefined/empty 边界条件，在测试开发阶段就发现了 2 个潜在 bug。

**经验**: 对于复杂状态处理 hooks，单元测试的边界覆盖比集成测试更有价值。

### 4. 覆盖率阈值设置
**发现**: E1 设置了行覆盖率 80% 的阈值，但实际达到了 97.29%。合理的初始阈值避免强制降级。

**经验**: 首次建立测试覆盖时，阈值应设置为当前可达值的 80-90%，逐步提高。

### 5. Vitest 配置路径问题
**发现**: `vitest.config.ts` 的 `include` 需要明确添加 `src/hooks/**/*.test.ts` 和排除 Jest 语法的 `*.test.ts` 文件。

**防范**: Vitest 配置文件的 `include/exclude` 必须与 Jest 配置完全隔离，避免交叉污染。

---

## 跨项目高阶模式

见 MEMORY.md 索引（待追加）
