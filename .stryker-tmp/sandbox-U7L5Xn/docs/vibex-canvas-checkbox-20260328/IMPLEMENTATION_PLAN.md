# Implementation Plan: vibex-canvas-checkbox-20260328

| 任务 | 工时 |
|------|------|
| 创建 `CheckboxIcon.tsx` | 1h |
| 替换 `ComponentSelectionStep` | 0.5h |
| 替换 `NodeSelector` | 0.5h |
| 替换 `BoundedContextTree` | 0.5h |
| 深色模式适配 | 0.5h |
| 无障碍验证（aria-checked）| 0.5h |
| **总计** | **~3.5h** |

### 文件变更
```
src/components/common/CheckboxIcon.tsx    [新增]
src/components/steps/ComponentSelectionStep.tsx [修改]
src/components/canvas/NodeSelector.tsx         [修改]
src/components/canvas/BoundedContextTree.tsx  [修改]
```
