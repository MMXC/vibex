# VibeX Sprint 54 — 提案分析

**Sprint**: Sprint 54
**日期**: 2026-06-02
**分析依据**: Sprint 51-53 (E1-E5) 交付物 CHANGELOG 回顾 + 遗留 gap 识别

---

## 提案总览

| ID | 优先级 | 功能名称 | 根因 | 影响 |
|----|--------|---------|------|------|
| P001 | P0 | Canvas Snapshot 版本历史 UI | S51-E1 实现 IndexedDB 持久化但无 UI 入口 | 核心协作功能缺失 |
| P002 | P1 | Canvas 文件导入增强 | 仅支持模板导入，缺少原生文件拖放 | 用户体验断点 |
| P003 | P1 | 协作者 Cursor 实时同步 | S53-E1 presence 仅显示在线状态，无 cursor | 协作体验不完整 |
| P004 | P2 | 画布性能优化 | 500+ 节点大画布无 viewport culling | 核心性能问题 |
| P005 | P2 | Template Gallery 增强 | S52-E4 分类完成，无 preview/thumbnail | 模板使用体验差 |

---

## P001 — Canvas Snapshot 版本历史 UI [P0]

**问题**: S51-E1 实现了 `historyDB.ts` + IndexedDB 持久化，但用户无法通过 UI 访问历史版本。`canvasHistoryStore` 的 `saveHistory`/`loadHistory` 无 UI 触发点。

**根因**: 架构层持久化完成，UI 层缺失。snapshot restore 需要 revision-aware restore（使用 `loadHistoryWithRevision`）。

**影响**: 协作用户无法回滚误操作，Undo 链断裂时无兜底。

**技术风险**:
- `loadHistoryWithRevision` API 是否在 canvasHistoryStore 中已实现需验证
- IndexedDB schema 兼容性
- 多用户同时 restore 的并发冲突

**缓解方案**: 先实现 HistoryPanel UI，store API 作为基础依赖若有缺失补充实现。

**Acceptance Criteria**:
- [ ] DDSCanvasPage 工具栏有 History 按钮
- [ ] 点击按钮打开 HistoryPanel，显示 ≥1 条历史快照
- [ ] 点击 "Restore" 按钮，画布状态恢复对应版本
- [ ] vitest HistoryPanel 8/8 通过

---

## P002 — Canvas 文件导入增强 [P1]

**问题**: 当前仅支持从 TemplateGallery 导入 JSON。用户无法直接拖放本地 `.json` / `.yaml` / `.vibex` 文件到画布上。

**根因**: ReactFlow v12 无原生文件拖放事件处理。需要自己实现 HTML5 Drag & Drop API。

**影响**: 用户导入外部文件路径繁琐，降低工作效率。

**技术风险**:
- YAML 解析依赖（需确认 js-yaml 或类似库可用性）
- 大文件导入性能（500+ 节点 JSON 解析）
- Drop event 与 ReactFlow 内置事件的冲突

**缓解方案**: 先验证 package.json 中已有解析库；使用 `dataTransfer.items` 区分文件类型。

**Acceptance Criteria**:
- [ ] 拖放 `.json` 文件到画布 → 节点导入成功
- [ ] 拖放 `.yaml` 文件到画布 → 自动转换后导入
- [ ] 无效文件格式 → 显示 error toast
- [ ] vitest useFileDrop 10/10 通过

---

## P003 — 协作者 Cursor 实时同步 [P1]

**问题**: S53-E1 的 PresenceIndicator 仅显示在线用户 avatar stack，无 cursor 位置同步。协作者在画布上的编辑位置对其他用户不可见。

**根因**: WebSocket 消息类型 `cursor:move` 未实现，presence:join/leave/ping 仅覆盖在线状态。

**影响**: 实时协作缺少最重要的 "看到对方在做什么" 能力。

**技术风险**:
- 高频 cursor:move 消息可能造成网络拥塞（需 throttle）
- Cursor 位置与节点关联的坐标变换
- 多显示器/高 DPI 屏幕的坐标映射

**缓解方案**: 100ms throttle；坐标统一使用 ReactFlow viewport transform。

**Acceptance Criteria**:
- [ ] 协作者移动鼠标 → 其他用户看到彩色 cursor + name label
- [ ] cursor 位置 100ms throttle，不卡顿
- [ ] 自己 cursor 不显示在自己屏幕上
- [ ] vitest CursorOverlay 8/8 通过

---

## P004 — 画布性能优化 [P2]

**问题**: 500+ 节点的大型画布无任何优化，所有节点即使不在视口内也全部渲染。滚动和缩放严重卡顿。

**根因**: ReactFlow 默认 renderAll 属性为 true。视口裁剪 (viewport culling) 需要手动配置或自定义 node renderer。

**影响**: 大型项目用户体验不可接受，影响核心使用场景。

**技术风险**:
- 自定义 node renderer 可能破坏现有节点功能
- Viewport culling 计算量（需在主线程外验证）
- minimap 组件是否也需 culling

**缓解方案**: 先实现 ViewportCulling 工具函数，验证性能后再集成；minimap culling 作为独立任务。

**Acceptance Criteria**:
- [ ] 500 节点画布滚动帧率 ≥30fps (Chrome DevTools Performance)
- [ ] 视口外节点不渲染（React DevTools Profiler 验证）
- [ ] vitest ViewportCulling 8/8 通过

---

## P005 — Template Gallery 增强 [P2]

**问题**: S52-E4 实现分类和搜索，但模板使用前无法预览内容。`TemplateGallery` 仅显示缩略名和分类标签，无视觉 preview。

**根因**: Canvas 模板存储 `CanvasTemplateData` 无 `thumbnail` 字段，也无 preview 渲染逻辑。

**影响**: 用户无法评估模板是否适合，降低模板使用率。

**技术风险**:
- mini canvas 渲染性能（模板可能有 200+ 节点）
- thumbnail 存储占用 IndexedDB 空间
- Recent 标签页 localStorage 容量限制

**缓解方案**: mini canvas 使用简化渲染（只显示节点位置，不渲染完整交互）；Recent 标签限制 5 个。

**Acceptance Criteria**:
- [ ] 点击模板卡片 → 弹出 TemplatePreviewDialog，显示 mini canvas 渲染
- [ ] Gallery 有 "Recent" 标签页，显示最近使用模板
- [ ] vitest TemplatePreviewDialog 6/6 通过
