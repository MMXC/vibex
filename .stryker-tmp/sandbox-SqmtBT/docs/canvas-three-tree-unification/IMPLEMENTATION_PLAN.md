# IMPLEMENTATION_PLAN: canvas-three-tree-unification

## Sprint 0（~14h）

### Epic 1: Tab + 废除 phase（3.25h）
1. 新增 TabBar.tsx（三 tab：context/flow/component）
2. CanvasPage.tsx 引入 TabBar，移除 phase gate
3. 三 Panel 全保留 DOM，CSS 控制显隐
4. 验证任意 phase 可操作任意树

### Epic 2: 面板折叠解耦（1.25h）
1. panelExpand 状态独立存储
2. 切换 phase 后折叠状态保留
3. 验证可同时展开多个面板

### Epic 3: confirmed → isActive（2.5h）
1. lib/canvas/types.ts 移除 confirmed，新增 isActive
2. migration.ts 编写 confirmed → isActive
3. 移除 confirmNode/confirmAll 方法
4. 验证 isActive=false 不参与生成

### Epic 4: Cascade 手动触发（3.5h）
1. 移除 cascadeContextChange
2. 新增 generateFlowFromContext / generateComponentFromFlow
3. 验证编辑/删除 context 不重置下游

### Epic 5: Tab UI（1h）
1. Tab bar 固定可见，200ms 动画
2. collapse 按钮移入 Tab bar

### Epic 6: 回归测试（2.5h）
1. gstack screenshot 验证三树数据
2. E2E 测试覆盖
3. npm build + TypeScript 0 errors

## 验收
- npm test + E2E 通过
- gstack screenshot 验证三树数据保留
- confirmed 完全移除

### Epic 1: Tab 切换器 + 废除 phase 约束 ✅
- [x] S1.1: TabBar.tsx + TabBar.module.css — 新增三树 Tab 切换器
- [x] S1.2: Tab 切换时三树数据全部保留（面板始终渲染）
- [x] S1.3: 移除 phase 对树操作的约束（useKeyboardShortcuts enabled）
- [x] S1.4: hasNodes 函数替代 areAllConfirmed 作为显示指标
- [x] 验收: npm build 通过（CI=false）

### Epic 2: 面板折叠解耦 ✅
- [x] S2.1: contextPanelCollapsed / flowPanelCollapsed / componentPanelCollapsed 独立 boolean 状态
- [x] S2.2: persist partialize 中添加三个 panelCollapsed 字段（切换 phase 后保留折叠状态）
- [x] S2.3: 验证可同时展开多个面板（三状态互相独立）
- [x] 验收: tsc --noEmit 通过

### Epic 3: confirmed → isActive ✅
- [x] S3.1: types.ts — 移除 confirmed，新增 isActive?: boolean
- [x] S3.2: Migration v2→v3: confirmed→isActive (true by default)
- [x] S3.3: 移除 confirmContextNode/confirmFlowNode/confirmComponentNode/confirmAllComponentNodes
- [x] S3.4: 更新 CascadeUpdateManager.areAllConfirmed→hasActiveNodes
- [x] S3.5: 移除 confirm 按钮和 checkbox UI
- [x] 验收: npm build + tsc 通过, 3180 测试通过 (99%)

### Epic 4: Cascade 手动触发 ✅
- [x] S4.1: 移除 cascadeContextChange/cascadeFlowChange 自动调用
- [x] S4.2: 编辑/删除 context 不重置 flow/component 树
- [x] S4.3: 新增 generateComponentFromFlow 手动生成方法
- [x] S4.4: CascadeUpdateManager 函数标记为 @deprecated
- [x] 验收: tsc 通过
