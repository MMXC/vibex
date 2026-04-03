# Implementation Plan: vibex-canvas-expand-dir-20260328

| 任务 | 工时 |
|------|------|
| 扩展 `ExpandDirection` 类型 | 0.5h |
| 实现 `toggleCenterPanel` | 1h |
| CSS Grid 中间展开规则 | 1h |
| 中间面板热区双侧添加 | 1h |
| 最小宽度保护（200px）| 0.5h |
| 动画流畅度验证 | 0.5h |
| **总计** | **~4.5h** |

### 文件变更
```
src/lib/canvas/canvasStore.ts          [修改]
src/components/canvas/canvas.module.css [修改]
src/components/canvas/HoverHotzone.tsx   [修改]
```
