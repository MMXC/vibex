# Spec: E2-S2 — 创建 canvas.module.css.d.ts 类型声明文件

## 文件

- **新建**: `vibex-fronted/src/components/canvas/canvas.module.css.d.ts`

## 目的

为 canvas 聚合模块的 10 个子模块提供精确的类名类型声明，弥补全局 `css-modules.d.ts` 无法检测具体键的不足。

## 声明范围

### canvas.export.module.css（队列项相关）
```typescript
queueItem: string;
queueItemQueued: string;
queueItemGenerating: string;
queueItemDone: string;
queueItemError: string;
queueItemInfo: string;
queueItemName: string;
queueItemMeta: string;
queueItemProgress: string;
queueItemRetry: string;
queueItemErrorMsg: string;
queueItemActions: string;
```

### canvas.base.module.css（TabBar / PhaseProgressBar 相关）
```typescript
canvasContainer: string;
tabBarWrapper: string;
phaseProgressBar: string;
phaseItem: string;
phase_completed: string;
phase_active: string;
phase_pending: string;
```

### canvas.flow.module.css（节点类型标记 / 图标按钮）
```typescript
nodeTypeMarker: string;
'nodeTypeMarker--start': string;
'nodeTypeMarker--end': string;
flowStepTypeIcon: string;
'flowStepTypeIcon--branch': string;
'flowStepTypeIcon--loop': string;
'flowStepTypeIcon--normal': string;
iconBtn: string;
'iconBtn--edit': string;
'iconBtn--delete': string;
```

### canvas.context.module.css（BoundedContextTree 相关）
```typescript
boundedContextTree: string;
contextNodeList: string;
nodeCard: string;
nodeEditForm: string;
nodeEditInput: string;
nodeEditTextarea: string;
nodeEditActions: string;
```

### canvas.trees / canvas.components / canvas.panels / canvas.toolbar / canvas.thinking / canvas.misc.module.css

需枚举所有已使用的类名（可从 planning.md E2-S2 列表复制，CSS 文件验证后补充）。

## 模板

```typescript
// canvas.module.css.d.ts
declare const styles: {
  // canvas.export.module.css
  queueItem: string;
  queueItemQueued: string;
  queueItemGenerating: string;
  queueItemDone: string;
  queueItemError: string;
  // ... (其余子模块)
};
export = styles;
```

## DoD 检查单

- [ ] `canvas.module.css.d.ts` 存在
- [ ] 包含 `queueItemQueued`、`queueItemGenerating`、`queueItemDone`、`queueItemError`
- [ ] 包含含特殊字符的类名：`'nodeTypeMarker--start'`、`'iconBtn--edit'`
- [ ] `tsc --noEmit` 无新增错误
- [ ] `styles.queueItemQueued` 推断类型为 `string`
