# Spec: Epic 1 — 画布编辑器引导体系

**Epic ID**: F1
**文件路径**: /root/.openclaw/vibex/vibex-fronted/src/components/canvas/
**状态**: Pending

---

## F1.1 空状态引导文案

### 描述
三栏（BoundedContextTree / BusinessFlowTree / ComponentTree）empty state 显示操作引导文案。

### 验收标准
```javascript
// F1.1
expect(screen.getAllByText(/创建|上传/).length).toBeGreaterThanOrEqual(3);
```

### 实现约束
- BoundedContextTree: "从首页创建需求，开始分析"
- BusinessFlowTree: "在首页完成 Step1 后自动生成"
- ComponentTree: "在首页完成 Step2 后自动生成"
- 文案可配置（国际化）

### 组件文件
- `src/components/canvas/BoundedContextTree.tsx`
- `src/components/canvas/BusinessFlowTree.tsx`
- `src/components/canvas/ComponentTree.tsx`

---

## F1.2 Toolbar 悬浮提示

### 描述
CanvasToolbar 的每个按钮增加 `data-tooltip` 属性，hover 时显示提示。

### 验收标准
```javascript
// F1.2
expect(document.querySelectorAll('[data-tooltip]').length).toBeGreaterThanOrEqual(3);
```

### 按钮清单
| 按钮 | tooltip |
|------|---------|
| Undo | 撤销 (Ctrl+Z) |
| Redo | 重做 (Ctrl+Shift+Z) |
| 同步滚动 | 三栏同步滚动 |
| 导出 | 导出项目 |
| 全屏 | 全屏模式 |

### CSS 样式
- 使用现有 `.tooltip` 类或新增 `.canvasTooltip`
- 延迟 300ms 显示，避免闪烁
- 深色背景 + 白色文字

---

## F1.3 连线类型图例

### 描述
Canvas 角落（右下角）显示三种连线样式说明。

### 验收标准
```javascript
// F1.3
const legend = document.querySelector('[class*="edgeLegend"]');
expect(legend).toBeVisible();
expect(legend.textContent).toMatch(/sequence|branch|loop/i);
```

### 样式定义
```
[sequence] ────────── 实线蓝：顺序流程
[branch] - - - - - - 虚线橙：条件分支
[loop] ······ 回环紫：循环流程
```

### 组件文件
- 新建 `src/components/canvas/EdgeLegend.tsx`
- 位置：`z-index: 50`，固定右下角
- 仅在有连线数据时显示

---

## F1.4 节点标记 Tooltip

### 描述
start（绿圈）/ end（红方）标记增加 `title` 属性，hover 显示说明。

### 验收标准
```javascript
// F1.4
const startMarkers = document.querySelectorAll('[class*="nodeTypeMarker--start"]');
const endMarkers = document.querySelectorAll('[class*="nodeTypeMarker--end"]');
startMarkers.forEach(m => expect(m.title).toMatch(/起点|start/i));
endMarkers.forEach(m => expect(m.title).toMatch(/终点|end/i));
```

### 实现约束
- 使用原生 `title` 属性（无障碍友好）
- 或使用 `data-tooltip` + CSS 浮动层
- 绿色使用 `var(--color-success)`，红色使用 `var(--color-error)`
