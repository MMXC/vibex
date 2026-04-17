# Spec: E4 - Sprint 3 Store 完整拆分

## 1. 概述

**工时**: 8-12h | **优先级**: P1
**依赖**: E3 (Sprint 2)

## 2. 修改范围

### 2.1 E4-S1: canvasStore 完全拆分

- 移除所有旧状态字段
- canvasStore 仅保留代理逻辑
- 入口文件 < 200 行

### 2.2 E4-S2: 独立测试文件

- contextStore.test.ts
- flowStore.test.ts
- componentStore.test.ts
- uiStore.test.ts

### 2.3 E4-S3: 无循环依赖

```bash
# ESLint 检测
npx eslint src/lib/canvas --rule 'import/no-cycle: error'
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E4-AC1 | 检查行数 | canvasStore 入口 | ≤ 200 行 |
| E4-AC2 | 检查测试文件 | 4 个 store | 各有测试 |
| E4-AC3 | ESLint | import/no-cycle | 0 违规 |

## 4. DoD

- [ ] canvasStore < 200 行
- [ ] 4 个独立测试文件
- [ ] 循环依赖 = 0
