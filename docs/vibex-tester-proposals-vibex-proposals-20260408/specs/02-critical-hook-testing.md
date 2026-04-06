# Spec: Epic 2 — 关键 Hook 单元测试

**项目**: vibex-tester-proposals-vibex-proposals-20260408  
**Epic**: 关键 Hook 单元测试  
**工时**: 3 人天  
**Owner**: Tester Agent  

---

## 1. 概述与目标

Epic 2 聚焦于为高风险的 Canvas 核心 Hook 补充单元测试。当前 `useAIController`（AI 生成控制逻辑）和 `useAutoSave`（自动保存逻辑）完全无测试覆盖，这两个 Hook 状态机复杂、依赖外部 API，是重构风险最高的组件。本 Epic 目标是在 3 人天内建立完整的测试套件，覆盖率分别达到 ≥80% 和 ≥75%。

## 2. Story S2.1: useAIController 单元测试

### 目标
为 AI 生成控制逻辑编写 ≥15 个测试用例，覆盖率 branches ≥ 80%。

### 文件位置
```
src/hooks/canvas/useAIController.test.ts  # 新建
```

### Hook 分析

#### useAIController 职责（推测）
- 管理 AI 生成请求的生命周期（idle → pending → streaming → complete/error）
- 处理 AI 响应流（streaming tokens）
- 维护生成状态（cancel、retry、pause）
- 与 canvas store 交互（插入 AI 生成的内容）

#### 状态机（推测）
```
IDLE → PENDING → STREAMING → COMPLETE
                 ↘ ERROR ↗
COMPLETE → IDLE（重置）
任何状态 → CANCELLED → IDLE
```

### 测试用例矩阵

| # | 测试场景 | Given | When | Then |
|----|---------|-------|------|------|
| T1 | 初始状态为 idle | 组件挂载 | useAIController() | expect(status).toBe('idle') |
| T2 | 触发 AI 生成 | status=idle | triggerGenerate(prompt) | expect(status).toBe('pending') |
| T3 | 开始接收流 | status=pending | onFirstChunk() | expect(status).toBe('streaming') |
| T4 | 接收 token 更新 | status=streaming | onChunk('hello') | expect(tokens).toContain('hello') |
| T5 | 流结束标记 | status=streaming | onComplete() | expect(status).toBe('complete') |
| T6 | 错误处理 | status=pending | onError(err) | expect(status).toBe('error') |
| T7 | 取消生成 | status=streaming | cancel() | expect(status).toBe('cancelled') |
| T8 | 重置到 idle | status=complete | reset() | expect(status).toBe('idle') |
| T9 | 重试失败请求 | status=error | retry() | expect(status).toBe('pending') |
| T10 | prompt 为空时不触发 | prompt='' | triggerGenerate('') | expect(status).toBe('idle') |
| T11 | 长文本截断 | status=streaming | onChunk(超长文本) | expect(tokens.length).toBeLessThan(MAX_TOKENS) |
| T12 | 并发请求抑制 | status=pending | triggerGenerate('a') + triggerGenerate('b') | 只执行第一个请求 |
| T13 | store 交互 | status=complete | onComplete() | expect(mockStore.insertContent).toHaveBeenCalled() |
| T14 | 错误时 store 回滚 | status=error | onError() | expect(mockStore.rollback).toHaveBeenCalled() |
| T15 | 覆盖率边界: undefined prompt | prompt=undefined | triggerGenerate(undefined) | expect(status).toBe('idle') |

### Mock 策略

```typescript
// 使用 vi.mock() 而非硬编码 mock 对象（历史经验教训）
const mockStore = {
  insertContent: vi.fn(),
  rollback: vi.fn(),
  status: { current: 'idle' }
};

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn(() => mockStore)
}));

// Mock AI API via MSW or vi.mock()
vi.mock('@/lib/ai/client', () => ({
  generateStream: vi.fn(() => mockStream)
}));
```

### 覆盖率验收

```bash
pnpm vitest run src/hooks/canvas/useAIController.test.ts \
  --coverage \
  --coverageReporters=text-summary
```

期望输出包含：
```
File              | % Stmts | % Branch | % Funcs | % Lines |
...useAIController |    90.0 |    82.5 |   100.0 |    90.0 |
```

### 验收标准
- [ ] `src/hooks/canvas/useAIController.test.ts` 存在
- [ ] ≥15 个测试用例
- [ ] 分支覆盖率 branches ≥ 80%
- [ ] 使用 `vi.mock()` 的 `mockReturnValue` 而非硬编码 mock 对象
- [ ] 测试文件名匹配 `*.test.ts`（Vitest 规范）
- [ ] `pnpm vitest run` 全部通过（0 failures）

---

## 3. Story S2.2: useAutoSave 单元测试

### 目标
为自动保存逻辑编写 ≥15 个测试用例，覆盖率 stmts ≥ 75%，正确 mock `navigator.sendBeacon`。

### 文件位置
```
src/hooks/canvas/useAutoSave.test.ts  # 新建
```

### Hook 分析

#### useAutoSave 职责（推测）
- 监听 canvas store 变化
- 防抖：变化后延迟 N ms 才触发保存
- 使用 `navigator.sendBeacon` 发送保存请求
- 处理保存失败（回退到 fetch）
- 维护保存状态（saving、saved、error）

### 测试用例矩阵

| # | 测试场景 | Given | When | Then |
|----|---------|-------|------|------|
| T1 | 初始状态 saved | 组件挂载 | useAutoSave() | expect(status).toBe('saved') |
| T2 | 变化触发防抖保存 | canvas 变化 | triggerChange() | expect(status).toBe('saving') after debounceMs |
| T3 | sendBeacon 成功 | status=saving | sendBeacon resolves | expect(status).toBe('saved') |
| T4 | sendBeacon 失败回退 fetch | sendBeacon unavailable | onBeaconFail() | expect(fetch).toHaveBeenCalled() |
| T5 | 保存失败标记 error | 请求失败 | onSaveError(err) | expect(status).toBe('error') |
| T6 | 防抖: 快速变化只保存一次 | 连续 5 次变化 | rapidChanges() | expect(sendBeacon).toHaveBeenCalledTimes(1) |
| T7 | 防抖延迟可配置 | 自定义 debounce=2000 | triggerChange() | 2000ms 后才触发 |
| T8 | 卸载时取消待处理保存 | 组件卸载 | onBeforeUnmount() | clearTimeout called |
| T9 | 无变化时不保存 | canvas 未变化 | checkNoChanges() | expect(sendBeacon).not.toHaveBeenCalled() |
| T10 | 空 canvas 不保存 | canvas 内容为空 | triggerChange() | expect(sendBeacon).not.toHaveBeenCalled() |
| T11 | 保存内容完整性 | 复杂 canvas 对象 | triggerChange() | sendBeacon payload 包含完整 canvas 数据 |
| T12 | sendBeacon mock 正确使用 | test setup | vi.stubGlobal | navigator.sendBeacon 是 mock fn |
| T13 | 并发保存请求抑制 | 已在 saving 中 | triggerChange() | 忽略新变化（debounce 中） |
| T14 | localStorage 降级 | sendBeacon + fetch 都失败 | onBothFail() | 尝试 localStorage 降级 |
| T15 | 保存性能: 大量节点 | 100+ 节点 canvas | triggerChange() | save 完成时间 < 500ms |

### Mock 策略（关键）

```typescript
// ✅ 正确: vi.stubGlobal
beforeEach(() => {
  vi.stubGlobal('navigator', {
    sendBeacon: vi.fn(() => true)
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ❌ 错误: 硬编码 mock
const originalSendBeacon = window.navigator.sendBeacon;
window.navigator.sendBeacon = vi.fn(); // 不推荐，污染全局
```

### 覆盖率验收

```bash
pnpm vitest run src/hooks/canvas/useAutoSave.test.ts \
  --coverage \
  --coverageReporters=text-summary
```

期望输出包含：
```
File           | % Stmts | % Branch | % Funcs | % Lines |
...useAutoSave |    78.0 |    70.0 |   100.0 |    78.0 |
```

### 验收标准
- [ ] `src/hooks/canvas/useAutoSave.test.ts` 存在
- [ ] ≥15 个测试用例
- [ ] 语句覆盖率 stmts ≥ 75%
- [ ] `navigator.sendBeacon` 使用 `vi.stubGlobal` mock（无硬编码）
- [ ] `vi.unstubAllGlobals()` 在 `afterEach` 中清理
- [ ] 防抖逻辑有独立测试（快速变化只保存一次）
- [ ] `pnpm vitest run` 全部通过（0 failures）

---

## 4. 测试模板规范

### 文件头部模板
```typescript
/**
 * useAIController.test.ts
 * 
 * 测试套件: useAIController Hook
 * 覆盖范围: AI 生成控制逻辑完整测试
 * 覆盖率目标: branches >= 80%
 * 
 * 测试策略:
 * - 状态机完整覆盖（idle/pending/streaming/complete/error/cancelled）
 * - Mock store 交互验证
 * - Mock AI API 流式响应
 * - 边界条件（空 prompt、超长文本、并发请求）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIController } from '../useAIController';
```

### Mock 导入规范
```typescript
// 按历史经验: 使用 vi.mock() 的 mockReturnValue
import { useCanvasStore } from '@/stores/canvasStore';

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn(() => ({
    insertContent: vi.fn(),
    rollback: vi.fn(),
    status: { current: 'idle' }
  }))
}));
```

### 描述命名规范
```typescript
describe('useAIController', () => {
  describe('状态转换', () => {
    it('IDLE -> PENDING: 触发生成时状态变为 pending', () => {});
    it('PENDING -> STREAMING: 收到首个 chunk 时状态变为 streaming', () => {});
  });
  
  describe('错误处理', () => {
    it('API 错误时状态变为 error，并回滚 store', () => {});
  });
  
  describe('并发控制', () => {
    it('已有 pending 请求时，忽略新的生成触发', () => {});
  });
});
```

---

## 5. 交付物清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/hooks/canvas/useAIController.test.ts` | 新增 | ≥15 个用例，覆盖率 branches ≥ 80% |
| `src/hooks/canvas/useAutoSave.test.ts` | 新增 | ≥15 个用例，覆盖率 stmts ≥ 75% |

---

## 6. 质量门槛

| 指标 | 门槛 | 检查命令 |
|------|------|---------|
| 用例数量 | ≥15 / Hook | `grep -c "it(" src/hooks/canvas/use*.test.ts` |
| 分支覆盖率 | ≥80% (useAIController) | vitest --coverage |
| 语句覆盖率 | ≥75% (useAutoSave) | vitest --coverage |
| 测试通过率 | 100% | `pnpm vitest run --reporter=verbose` |
| Mock 方式 | vi.stubGlobal | `grep "vi.stubGlobal" src/hooks/canvas/useAutoSave.test.ts` |
| 硬编码 mock | 0 个 | `grep "window.navigator" src/hooks/canvas/useAutoSave.test.ts` |

---

*Spec 由 PM Agent 生成于 2026-04-08*
