# AGENTS.md - Canvas Testing Strategy 开发约束

> **项目**: canvas-testing-strategy  
> **日期**: 2026-04-05  
> **Agent**: dev, tester, reviewer  
> **范围**: 所有参与 Canvas hook 测试开发的 agent

---

## 1. 测试文件规范

### 1.1 文件放置规范

```
src/hooks/canvas/
├── __tests__/
│   ├── useCanvasRenderer.test.ts      ← E1 测试
│   ├── useDndSortable.test.ts        ← E2 测试
│   ├── useDragSelection.test.ts       ← E3 测试
│   ├── useCanvasSearch.test.ts        ← E4 测试
│   ├── useTreeToolbarActions.test.ts ← E5 测试
│   └── useVersionHistory.test.ts     ← E6 测试
```

### 1.2 测试命名规范

```typescript
// ✅ 正确：描述性测试名称
describe('useCanvasRenderer', () => {
  describe('nodeRects calculation', () => {
    it('should return empty rects for empty nodes', () => { ... });
    it.each([...])('should handle $label', ({ ... }) => { ... });
  });
});

// ❌ 错误：无描述的测试名称
describe('useCanvasRenderer', () => {
  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

---

## 2. 测试编写规范

### 2.1 必须覆盖的场景

| Hook | 必须覆盖 | 可选覆盖 |
|------|----------|----------|
| useCanvasRenderer | nodeRects null/undefined, edges 计算, 性能 | memo deps 变化 |
| useDndSortable | 基本排序, 竞态条件, 边界条件 | 拖拽动画 |
| useDragSelection | 选框内选中, start===end, 清理选中 | 跨组件拖出 |
| useCanvasSearch | 搜索过滤, debounce, 空结果 | 搜索历史 |
| useTreeToolbarActions | 操作触发, store 更新, 批量操作 | 权限检查 |
| useVersionHistory | 版本列表, 当前版本, 版本切换 | 历史清理 |

### 2.2 Mock 规范

```typescript
// ✅ 正确：使用 mockStore
const mockStore = {
  contextNodes: [],
  componentNodes: [],
  flowNodes: [],
  selectedNodes: [],
  updateSelectedNodes: jest.fn(),
  confirmSelection: jest.fn(),
};

jest.mock('@/stores/canvasStore', () => ({
  useCanvasStore: jest.fn(() => mockStore),
}));

// ❌ 错误：过度 mock
jest.mock('@/stores/canvasStore');
jest.mock('@/lib/canvas/utils');
jest.mock('react-dnd');
```

### 2.3 覆盖率规范

| Epic | Hook | 最低行覆盖率 | 最低分支覆盖率 |
|------|------|-------------|---------------|
| E1 | useCanvasRenderer | 80% | 70% |
| E2 | useDndSortable | 80% | 70% |
| E3 | useDragSelection | 80% | 70% |
| E4 | useCanvasSearch | 60% | 50% |
| E5 | useTreeToolbarActions | 60% | 50% |
| E6 | useVersionHistory | 50% | 40% |

---

## 3. 覆盖率检查命令

### 3.1 本地检查

```bash
# 运行覆盖率
cd /root/.openclaw/vibex
pnpm test:coverage -- --include='hooks/canvas/**/*.ts'

# 检查单个文件覆盖率
pnpm test:coverage -- --include='hooks/canvas/useCanvasRenderer.test.ts'
```

### 3.2 覆盖率阈值

```bash
# 检查是否达标（70% 分支覆盖率）
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.branches.pct')
if (( $(echo "$COVERAGE < 70" | bc -l) )); then
  echo "FAIL: Coverage $COVERAGE% < 70%"
  exit 1
fi
echo "PASS: Coverage $COVERAGE% >= 70%"
```

---

## 4. CI 规范

### 4.1 CI 测试命令

```yaml
# .github/workflows/canvas-tests.yml
name: Canvas Hook Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        run: pnpm install

      - name: Run Tests with Coverage
        run: pnpm test:coverage -- --reporter=junit --outputFile=test-results/canvas.xml

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Check Thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage $COVERAGE% below threshold 70%"
            exit 1
          fi
```

### 4.2 禁止事项

```typescript
// ❌ 禁止：skip 测试而不说明原因
it.skip('should work', () => { ... });

// ✅ 正确：skip 并说明原因
it.skip('should work (blocked by: issue #123)', () => { ... });

// ❌ 禁止：覆盖率豁免
/* istanbul ignore next */
// 这段代码不测试
const deadCode = true;

// ✅ 正确：删除死代码或添加测试
const unused = calculateSomething(); // TODO: remove after refactor
```

---

## 5. TDD 流程

### 5.1 TDD 红-绿-重构

```
1. Red: 写一个失败的测试
2. Green: 写最少的代码让测试通过
3. Refactor: 重构代码，保持测试通过
```

### 5.2 重构前检查

```bash
# 1. 确保测试通过
pnpm test hooks/canvas/__tests__/useCanvasRenderer.test.ts

# 2. 记录当前覆盖率
pnpm test:coverage -- --include='hooks/canvas/useCanvasRenderer.test.ts' > /tmp/coverage-before.txt

# 3. 开始重构
# ...

# 4. 重构后验证
pnpm test hooks/canvas/__tests__/useCanvasRenderer.test.ts

# 5. 检查覆盖率未下降
pnpm test:coverage -- --include='hooks/canvas/useCanvasRenderer.test.ts' > /tmp/coverage-after.txt
diff /tmp/coverage-{before,after}.txt
```

---

## 6. 文档要求

### 6.1 测试文件注释

```typescript
/**
 * useCanvasRenderer Hook 测试
 *
 * 覆盖场景:
 * - nodeRects 计算（正常路径 + 边界条件）
 * - edges 计算（基于节点位置）
 * - 性能测试（100 节点 < 100ms）
 *
 * 参考: docs/proposals/20260405-1321/canvas-testing-strategy/
 */
describe('useCanvasRenderer', () => { ... });
```

---

## 7. 性能约束

| 指标 | 上限 | 说明 |
|------|------|------|
| 单个测试文件运行时间 | < 10s | 包括 setup/teardown |
| 所有 canvas hook 测试运行时间 | < 30s | CI 要求 |
| mock 初始化时间 | < 100ms | 避免 slow mocks |

---

## 8. 常见问题

### Q1: 如何测试 useMemo 的计算结果？
```typescript
// 使用 renderHook + act
const { result } = renderHook(() => useCanvasRenderer({ nodes }));
expect(result.current.nodeRects).toBeDefined();
```

### Q2: 如何测试异步 debounce？
```typescript
// 使用 fake timers
jest.useFakeTimers();
act(() => {
  result.current.setSearchTerm('test');
});
jest.advanceTimersByTime(300);
expect(result.current.results).toHaveLength(1);
jest.useRealTimers();
```

### Q3: 如何 mock React DnD？
```typescript
// 使用 @dnd-kit 的 mock
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    over: null,
  }),
}));
```

---

*本文档由 Architect Agent 生成 | 2026-04-05*
