# Feature List — vibex-sprint1-prototype-canvas-qa

**项目**: vibex-sprint1-prototype-canvas-qa
**阶段**: Planning (create-prd)
**日期**: 2026-04-18
**上游**: analysis.md (2026-04-18)

---

## 1. Feature List 表格

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F1.1 | 组件面板拖拽 | ComponentPanel 展示 10 个组件卡片，支持 drag dataTransfer | Analyst: E1-U1 | 0.5d |
| F1.2 | 画布节点创建 | ProtoFlowCanvas 接收 drop → 创建 ProtoNode | Analyst: E1-U2 | 0.5d |
| F1.3 | 节点组件渲染 | ProtoNode 根据 ui-schema 渲染 10 种组件类型 | Analyst: E1-U3 | 0.5d |
| F1.4 | 属性面板编辑 | ProtoAttrPanel 双击打开属性编辑 → 节点实时更新 | Analyst: E1-U4 | 0.5d |
| F2.1 | MockData Tab | ProtoAttrPanel 内置 MockData Tab 编辑绑定数据 | Analyst: E2 | 0.5d |
| F2.2 | Mock数据渲染 | 节点预览使用 mockDataBindings 数据渲染 | Analyst: E2 | 0.5d |
| F3.1 | 页面列表管理 | RoutingDrawer 提供 addPage/removePage/selectPage | Analyst: E3 | 0.5d |
| F3.2 | 页面导航切换 | 切换 page → ProtoFlowCanvas 高亮/切换节点集 | Analyst: E3 | 0.5d |
| F4.1 | 导出格式 v2.0 | prototypeStore.getExportData() → JSON 含 version:'2.0' | Analyst: E4-U1 | 0.5d |
| F4.2 | Round-trip 端到端测试 | export → import → 数据完全一致（闭环验证） | Analyst: E4-U2 GAP | 1d |
| F5.1 | 默认组件验证 | 10 个 DEFAULT_COMPONENTS 定义完整正确 | Analyst: E5 | 0.5d |

---

## 2. Epic/Story 映射

| Epic | Story | 功能 | 优先级 |
|------|-------|------|--------|
| E1 | E1-U1 | 组件面板拖拽 | P0 |
| E1 | E1-U2 | 画布节点创建 | P0 |
| E1 | E1-U3 | 节点组件渲染 | P0 |
| E1 | E1-U4 | 属性面板编辑 | P0 |
| E2 | E2-U1 | MockData Tab | P1 |
| E2 | E2-U2 | Mock数据渲染 | P1 |
| E3 | E3-U1 | 页面列表管理 | P1 |
| E3 | E3-U2 | 页面导航切换 | P1 |
| E4 | E4-U1 | 导出格式 v2.0 | P0 |
| E4 | E4-U2 | Round-trip 端到端测试 | P0 |
| E5 | E5-U1 | 默认组件验证 | P0 |

---

## 3. 已知 GAP 及处理

| GAP | 描述 | 处理方式 |
|-----|------|---------|
| E4-U2 Round-trip 测试缺失 | 无 export→import→compare 闭环测试 | F4.2 补测 |
| PrototypeExporter 未接入 | 575行组件未被引用，冗余代码 | 暂不处理，文档记录 |
| Dev Server middleware 警告 | output:export 与 middleware 冲突 | 全局问题，coord 后续安排 |
