# PRD: vibex-canvas-expandable-20260327

## VibeX 卡片画布增强：三栏双向展开 + 卡片拖拽 + 虚线领域框

---

## 1. 执行摘要

### 背景
当前 VibeX 画布为固定三栏布局，用户无法展开/聚焦特定栏（左侧上下文树、中间画布、右侧详情），也无法自由拖拽卡片排序。设计文档 `vibex-canvas-expandable-20260327.md` 定义了三个功能增强方向。

### 目标
实现：
1. 三栏双向展开（悬停热区 + 点击展开动画）
2. 卡片拖拽排序（ReactFlow v12 升级）
3. 虚线领域框（DDD 限界上下文视觉分组）

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 展开动画流畅度 | 300ms ease-in-out |
| ReactFlow v12 升级后 CI 通过 | 100% |
| 拖拽位置持久化 | 刷新页面不丢失 |
| E2E 测试覆盖率 | 100% |
| 总工时 | ~9.5h（Dev 7h + Test 2.5h） |

---

## 2. 功能需求

### F1: 三栏双向展开

#### F1.1 CanvasExpandState Store Slice
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **新增状态**: `leftExpanded`, `centerExpanded`, `rightExpanded`: boolean
- **验收标准**:
  ```typescript
  // 初始状态
  expect(canvasStore.getState().leftExpanded).toBe(false);
  expect(canvasStore.getState().centerExpanded).toBe(false);
  expect(canvasStore.getState().rightExpanded).toBe(false);

  // 展开/折叠
  canvasStore.getState().setLeftExpanded(true);
  expect(canvasStore.getState().leftExpanded).toBe(true);
  ```

#### F1.2 CSS Grid 动态宽度
- **文件**: `vibex-fronted/src/components/canvas/canvas.module.css`
- **扩展 `.treePanelsGrid`**: 支持 `grid-template-columns` 动态切换
- **默认**: `1fr 1fr 1fr`（三等分）
- **展开 left**: `1.5fr 0.75fr 0.75fr`
- **展开 center**: `0.75fr 1.5fr 0.75fr`
- **展开 right**: `0.75fr 0.75fr 1.5fr`
- **最小宽度保护**: `min-width: 200px`（任意栏）
- **验收标准**:
  ```typescript
  // 展开动画时长
  const grid = document.querySelector('.treePanelsGrid');
  const computedStyle = getComputedStyle(grid);
  expect(computedStyle.transition).toContain('grid-template-columns');
  expect(computedStyle.transitionDuration).toBe('0.3s');
  ```

#### F1.3 边缘热区 + 展开箭头图标
- **文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- **热区**: 每栏右侧边缘 8px hover 区域（pointer-events: auto）
- **图标**: 左右箭头（`chevron-left` / `chevron-right`），悬停时显示
- **验收标准**:
  ```typescript
  // 悬停右边缘 → 显示展开图标
  const rightEdge = wrapper.find('[data-testid="right-expand-handle"]');
  rightEdge.simulate('mouseenter');
  expect(wrapper.find('ExpandIcon').prop('visible')).toBe(true);

  // 点击 → 展开 right 栏
  rightEdge.simulate('click');
  expect(canvasStore.getState().rightExpanded).toBe(true);
  ```

#### F1.4 折叠动画
- 展开状态下，再次点击同一热区 → 恢复三等分布局
- 展开状态下，点击其他栏热区 → 切换展开目标（最多一栏展开）
- **验收标准**:
  ```typescript
  canvasStore.getState().setRightExpanded(true);
  canvasStore.getState().setLeftExpanded(true); // 切换
  expect(canvasStore.getState().rightExpanded).toBe(false);
  expect(canvasStore.getState().leftExpanded).toBe(true);
  ```

---

### F2: 卡片拖拽排序

#### F2.1 ReactFlow v12 升级
- **文件**: `vibex-fronted/package.json`
- **命令**: `pnpm add @xyflow/react@latest`
- **验收标准**:
  ```typescript
  // 构建通过
  const buildResult = execSync('pnpm build', { cwd: vibexFrontendDir });
  expect(buildResult.exitCode).toBe(0);

  // TypeScript 编译无错误
  const tsResult = execSync('pnpm tsc --noEmit', { cwd: vibexFrontendDir });
  expect(tsResult.exitCode).toBe(0);
  ```

#### F2.2 DraggableCardTreeRenderer 封装
- **文件**: `vibex-fronted/src/components/canvas/nodes/DraggableCardTreeRenderer.tsx`（新建）
- **封装**: ReactFlow v12 拖拽 API + 现有 CardTreeRenderer
- **验收标准**:
  ```typescript
  // 组件存在且可实例化
  const renderer = rendererFactory.create('draggable');
  expect(renderer).toBeInstanceOf(DraggableCardTreeRenderer);

  // 支持 onNodesChange
  expect(typeof renderer.props.onNodesChange).toBe('function');
  ```

#### F2.3 拖拽位置持久化
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **新增字段**: `draggedPositions: Record<string, { x: number; y: number }>`
- **触发时机**: 拖拽结束后（debounce 200ms）
- **验收标准**:
  ```typescript
  // 拖拽卡片 A 到新位置
  const cardA = { id: 'card-A', position: { x: 100, y: 200 } };
  canvasStore.getState().updateDraggedPosition(cardA.id, cardA.position);

  // 刷新页面后位置恢复
  const persisted = localStorage.getItem('canvas-dragged-positions');
  expect(JSON.parse(persisted)['card-A']).toEqual(cardA.position);
  ```

#### F2.4 关系边自动重连
- **验收标准**:
  ```typescript
  // 拖拽卡片后，关系边跟随移动
  const initialEdgePoints = getEdgePoints('edge-1');
  dragCard('card-B', { x: 300, y: 400 });
  const updatedEdgePoints = getEdgePoints('edge-1');
  expect(updatedEdgePoints).not.toEqual(initialEdgePoints);
  ```

---

### F3: 虚线领域框

#### F3.1 BoundedGroupNode 组件
- **文件**: `vibex-fronted/src/components/canvas/nodes/BoundedGroupNode.tsx`（新建）
- **使用**: ReactFlow v12 subflow/group 模式
- **样式**: 虚线边框（`border: 2px dashed`）、半透明背景、圆角
- **属性**: `label`（领域名）、`color`（边框颜色）
- **验收标准**:
  ```typescript
  const node = renderer.renderNode('bounded-group', {
    id: 'group-1',
    data: { label: '患者管理', color: '#6366f1' },
    children: ['card-1', 'card-2'],
  });
  expect(node.props.style.border).toContain('dashed');
  expect(node.props.data.label).toBe('患者管理');
  ```

#### F3.2 BoundedGroups Store Slice
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **新增字段**: `boundedGroups: Array<{ id: string; label: string; color: string; nodeIds: string[] }>`
- **验收标准**:
  ```typescript
  canvasStore.getState().addBoundedGroup({
    id: 'bg-1',
    label: '核心域',
    color: '#6366f1',
    nodeIds: ['card-1', 'card-2'],
  });
  const groups = canvasStore.getState().boundedGroups;
  expect(groups.length).toBe(1);
  expect(groups[0].nodeIds).toContain('card-1');
  ```

#### F3.3 右键菜单创建/删除
- **文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- **创建**: 右键选中文本 → "创建领域框" → 弹出命名输入 → 确认
- **删除**: 右键领域框 → "删除领域框" → 确认
- **验收标准**:
  ```typescript
  // 创建领域框
  const menu = openContextMenu({ x: 200, y: 300, selection: 'card-1,card-2' });
  menu.click('创建领域框');
  dialog.fill('核心域');
  dialog.confirm();
  expect(canvasStore.getState().boundedGroups.length).toBe(1);

  // 删除领域框
  const groupNode = findBoundedGroupNode('bg-1');
  openContextMenu(groupNode).click('删除领域框');
  expect(canvasStore.getState().boundedGroups.length).toBe(0);
  ```

#### F3.4 跨框关系边处理
- 关系边穿越领域框时，自动在边框处打断（使用 `insertPathEdge`）
- **验收标准**:
  ```typescript
  // card-1 在 group-1，card-3 在 group-2
  // 连接它们的边应在两框边界处打断
  const edge = getEdge('card-1', 'card-3');
  expect(edge.points.some(p => p.x === group1Bounds.right)).toBe(true);
  expect(edge.points.some(p => p.x === group2Bounds.left)).toBe(true);
  ```

---

## 3. Epic 拆分

### Epic 1: 三栏双向展开（P0）
**Stories**:
- S1.1 CanvasExpandState Store slice 实现
- S1.2 CSS Grid 动态宽度 + 动画
- S1.3 边缘热区 + 展开箭头图标
- S1.4 折叠逻辑（点击切换/再次点击折叠）

**验收**: 悬停显示图标 → 点击展开动画 300ms → 再次点击折叠

---

### Epic 2: 卡片拖拽排序（P0）
**Stories**:
- S2.1 ReactFlow v12 升级 + CI 回归
- S2.2 DraggableCardTreeRenderer 封装
- S2.3 拖拽位置持久化（localStorage）
- S2.4 关系边自动重连

**验收**: 拖拽卡片 → 位置保存 → 刷新页面位置不变

---

### Epic 3: 虚线领域框（P1）
**Stories**:
- S3.1 BoundedGroupNode 组件实现
- S3.2 BoundedGroups Store slice
- S3.3 右键菜单创建/删除领域框
- S3.4 跨框关系边打断处理

**验收**: 右键创建领域框 → 卡片包裹 → 跨框边正确穿越

---

### Epic 4: 回归测试（P0）
**Stories**:
- S4.1 Playwright E2E：三栏展开交互
- S4.2 Playwright E2E：卡片拖拽 + 持久化
- S4.3 Playwright E2E：虚线领域框创建/删除
- S4.4 CI 验证：npm build + E2E 100% 通过

**验收**: 所有 E2E 测试 100% 通过，CI 绿灯

---

## 4. UI/UX 流程

### 展开交互流程
```
用户悬停左栏右边缘（8px热区）
        ↓
显示 → 展开箭头图标
        ↓
用户点击 → leftExpanded = true
        ↓
CSS Grid 动画（300ms）→ 左栏 1.5fr，其余 0.75fr
        ↓
用户点击同一热区 → leftExpanded = false → 恢复 1fr 1fr 1fr
```

### 拖拽流程
```
用户长按卡片 → 进入拖拽模式
        ↓
拖动到新位置 → 释放
        ↓
debounce 200ms → 保存 position 到 localStorage
        ↓
刷新页面 → 读取 localStorage → 恢复位置
        ↓
关系边自动跟随重连
```

### 领域框流程
```
用户选中多个卡片（Ctrl+点击）
        ↓
右键 → "创建领域框"
        ↓
弹出输入框 → 输入名称 → 确认
        ↓
BoundedGroupNode 包裹选中卡片
        ↓
右键领域框 → "删除领域框" → 确认
        ↓
领域框移除，卡片恢复自由状态
```

---

## 5. 非功能需求

| NFR | 要求 |
|-----|------|
| 性能 | 拖拽 100+ 节点时帧率 ≥ 30fps |
| 动画 | 展开动画 300ms，不卡顿 |
| 兼容性 | 移动端（< 768px）保持折叠单栏 |
| 可访问性 | 热区和图标支持键盘操作 |

---

## 6. 验收标准总览

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | 悬停显示图标，点击展开动画 300ms | gstack 交互 |
| P0 | ReactFlow v12 升级后 CI 通过 | CI |
| P0 | 拖拽位置持久化，刷新不丢失 | Playwright |
| P0 | 关系边跟随拖拽重连 | gstack 截图 |
| P0 | E2E 测试 100% 通过 | Playwright |
| P1 | 领域框创建/删除正常 | Playwright |
| P1 | 跨框边正确打断 | gstack 截图 |
| P2 | 移动端保持折叠单栏 | Playwright |

---

## 7. DoD

**Epic 完成的充要条件**:
1. ✅ 代码修改已提交（git commit）
2. ✅ npm build 通过
3. ✅ 所有单元测试通过
4. ✅ E2E 测试通过（展开 + 拖拽 + 领域框）
5. ✅ task_manager 状态已更新

---

## 8. 依赖项

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| ReactFlow | v12+ | 拖拽 API |
| dagre | latest | 自动布局（可选） |
| Playwright | latest | E2E 测试 |
| Zustand | (现有版本) | 状态管理 |

---

## 9. Out of Scope

- 展开宽度可配置（固定 1.5x）
- 拖拽 Undo/Redo
- 领域框嵌套
- 自动布局触发器（仅手动触发）
