# IMPLEMENTATION_PLAN: canvas-drawer-persistent

## Sprint 0（~10h）

### Epic 1: CanvasStore 扩展（1.5h）
1. 新增 drawer 状态字段（leftDrawerOpen/rightDrawerOpen/width）
2. 新增 abortGeneration() + sseStatus
3. 写 canvasStore drawer actions 单元测试

### Epic 5: 布局改造（1.5h）
1. CanvasPage.tsx 改为 flex row
2. CSS 变量 `--left-drawer-width` / `--right-drawer-width`
3. 画布最小宽度 400px 保护
4. 验证三列 grid 不受影响

### Epic 2: 左抽屉（3.75h）
1. LeftDrawer.tsx 容器（折叠/展开动画）
2. RequirementTextarea 迁移
3. SendButton → generateContexts
4. HistoryList（sessionStorage，3-5 条）
5. ProjectBar 左抽屉按钮

### Epic 3: 右抽屉 + 合并（3.5h）
1. RightDrawer.tsx 容器
2. StatusIndicator（idle/generating/complete/error）
3. AbortButton + abortGeneration 集成
4. 合并 canvas-drawer-msg 消息列表到底部

## Sprint 1（~4.5h）

### Epic 4: 拖拽（2.5h）
1. ResizeHandle 组件
2. 左右抽屉拖拽边界限制（100-400px）
3. 折叠时记忆上次宽度

### Epic 6: E2E（2h）
1. 左抽屉展开/折叠/输入/生成 E2E
2. 右抽屉状态/中止 E2E
3. 拖拽边界 E2E
4. gstack screenshot 验证 UI

## 验收
npm test + E2E 通过 + gstack screenshot 验证左右抽屉展开
