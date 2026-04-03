# E3 Spec: 测试覆盖率提升

## 覆盖率目标

| 模块 | 当前分支覆盖 | 目标分支覆盖 |
|------|------------|------------|
| historySlice | 16% | 40% |
| contextStore | 30% | 50% |
| flowStore | 25% | 50% |
| componentStore | 20% | 50% |
| canvasStore | 16% | 40% |
| **全局** | **33.75%** | **50%** |

## 覆盖提升策略

### historySlice 优先修复
```typescript
describe('historySlice', () => {
  // 覆盖所有 action branches
  test('UNDO with empty stack does nothing', () => { ... });
  test('REDO with empty stack does nothing', () => { ... });
  test('PUSH past limit removes oldest', () => { ... });
  test('branch: canUndo=true, canRedo=false', () => { ... });
});
```
