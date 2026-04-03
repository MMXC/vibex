# Spec: E2 - canvasStore 按领域拆分

## 1. 概述

**工时**: 8-12h | **优先级**: P0
**依赖**: D-001 (TS 错误清理) + D-002 (Jest 稳定)

## 2. 当前状态

- `canvasStore.ts`: 1433 行
- 状态字段: 40+ 个（selectedNodeIds, contextNodes, flowNodes, componentNodes 等）
- 问题: 状态更新链路不透明，修改风险高

## 3. 目标拆分

### 3.1 拆分结构

```
canvasStore/
├── contextStore.ts   # < 300 行
│   ├── BoundedContextNode 状态
│   ├── contextNodes
│   └── confirmContextNode / editContextNode
├── flowStore.ts      # < 300 行
│   ├── FlowNode 状态
│   ├── flowNodes
│   └── confirmFlowNode / editFlowNode
├── componentStore.ts # < 300 行
│   ├── ComponentNode 状态
│   ├── componentNodes
│   └── toggleNodeSelect
├── uiStore.ts        # < 200 行
│   ├── 布局状态（scrollTop, panelCollapsed）
│   └── ui 操作
└── canvasStore.ts    # < 100 行（代理层）
    └── useCanvasStore = (...args) => {
          return useContextStore(...args) 
              || useFlowStore(...args)
              || useComponentStore(...args)
              || useUIStore(...args);
        }
```

### 3.2 迁移步骤

1. **创建新 store 文件**（每个 store 独立开发）
2. **迁移状态字段**（逐字段迁移，保持向后兼容）
3. **迁移 actions**（逐 action 迁移）
4. **更新 consumer**（替换 import 路径）
5. **删除旧代码**（确认无引用后删除）
6. **回归测试**（三树功能验证）

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 统计行数 | contextStore.ts | ≤ 300 行 |
| E2-AC2 | 统计行数 | flowStore.ts | ≤ 300 行 |
| E2-AC3 | 统计行数 | componentStore.ts | ≤ 300 行 |
| E2-AC4 | 统计行数 | canvasStore.ts | ≤ 100 行 |
| E2-AC5 | 手动测试 | 三树创建/选择/确认/删除 | 所有操作正常 |
| E2-AC6 | 单元测试 | contextStore coverage | ≥ 70% |

## 5. 风险缓解

- **每次 store 抽取后**: 立即运行对应树的 E2E
- **完整迁移后**: 运行 full E2E suite
- **CI 门禁**: E2E 通过率 ≥ 95% 才合并

## 6. DoD

- [ ] contextStore.ts < 300 行
- [ ] flowStore.ts < 300 行
- [ ] componentStore.ts < 300 行
- [ ] canvasStore.ts < 100 行
- [ ] 三树功能回归测试通过
- [ ] contextStore 覆盖率 ≥ 70%
