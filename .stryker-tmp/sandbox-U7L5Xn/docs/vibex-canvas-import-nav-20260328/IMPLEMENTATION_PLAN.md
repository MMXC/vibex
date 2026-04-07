# Implementation Plan: vibex-canvas-import-nav-20260328

| 任务 | 工时 |
|------|------|
| 扩展 `example-canvas.json` — 添加 previewUrl | 0.5h |
| 扩展 `ComponentNode` TypeScript 类型 | 0.5h |
| 修改 `ComponentTree.handleNodeClick` | 1h |
| Toast fallback 处理 | 0.5h |
| E2E 导航验证 | 1h |
| **总计** | **~3.5h** |

### 文件变更
```
data/example-canvas.json                    [修改]
src/components/canvas/ComponentTree.tsx    [修改]
src/types/canvas.ts                       [修改]
```
