# Spec: E3 - Sprint 2 架构基础

## 1. 概述

**工时**: 10-14h | **优先级**: P0
**依赖**: E1 (Sprint 0)

## 2. 修改范围

### 2.1 E3-S1: canvasStore 最小化拆分

**目标结构**:
```
lib/canvas/stores/
├── contextStore.ts      # < 300 行
├── flowStore.ts         # < 300 行
├── componentStore.ts   # < 300 行
├── uiStore.ts          # < 200 行
└── canvasStore.ts      # < 100 行（代理层）
```

**迁移步骤**:
1. 创建新 store 文件
2. 逐字段迁移状态
3. 更新 consumer import
4. 删除旧代码

### 2.2 E3-S2: Vitest 优化

**文件**: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    // 快套件：组件测试
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.slow.test.ts'],
    // 慢套件：集成测试
  }
});
```

### 2.3 E3-S3: 每个子 store 独立测试

```typescript
// contextStore.test.ts
describe('contextStore', () => {
  it('should add context node', () => {
    useContextStore.getState().addContextNode(mockNode);
    expect(useContextStore.getState().contextNodes).toHaveLength(1);
  });
});
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E3-AC1 | 检查行数 | contextStore | ≤ 300 行 |
| E3-AC2 | 检查行数 | canvasStore | ≤ 100 行 |
| E3-AC3 | vitest 运行 | 快套件 | ≤ 60s |
| E3-AC4 | 运行测试 | 所有 store | 100% 通过 |

## 4. DoD

- [ ] contextStore < 300 行
- [ ] flowStore < 300 行
- [ ] componentStore < 300 行
- [ ] canvasStore < 100 行
- [ ] vitest < 60s
- [ ] 所有 store 有独立测试
