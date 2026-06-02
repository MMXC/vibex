# Sprint 51 功能分析报告

## 概述

Sprint 50 完成了画布搜索、自动布局、评论实时通知、模板导入导出四大功能。Sprint 51 聚焦于画布编辑体验的核心补强和协作能力深化。

**Sprint 50 交付成果：**
- S50-E1: 画布全局搜索（Fuse.js + keywordIndex）
- S50-E2: 节点自动布局（Dagre TB/LR 算法 + Cmd+L 快捷键）
- S50-E3: 评论实时通知（WebSocket 推送 + CommentBadge）
- S50-E4: 模板导入/导出管理（.vbtmpl 格式 + 冲突检测）
- S50-E5: Timeline 增强（未交付，待并入 S51）

---

## P001 — Undo/Redo 持久化

**问题描述：** 当前 Undo/Redo 仅在当前会话有效，刷新页面或切换画布后操作历史丢失。用户完成复杂编辑后如误操作，无法回滚到之前状态。

**根因分析：**
- `canvasHistoryStore` 仅维护内存状态，未持久化到 IndexedDB
- `oplogStore` 记录操作日志但同样是会话级内存
- 画布切换时旧画布的 history 自动丢弃

**影响评估：**
- 用户流失风险：高（数据丢失导致信任崩塌）
- 影响范围：所有使用画布编辑的用户
- 优先级：P0

**技术方案：**
1. 扩展 `canvasHistoryStore`：引入 `saveHistory` / `loadHistory` actions
2. IndexedDB 存储：`historyDB` → `canvas_history` 表，存储 `{ canvasId, timestamp, snapshot }`
3. 历史深度控制：`MAX_HISTORY_DEPTH = 50`，LIRS 驱逐策略
4. 快照策略：每 N 次操作或每 5 分钟生成快照，而非每次操作
5. 恢复流程：打开画布时从 IndexedDB 加载最新快照 → 重放 oplog → 恢复状态

**验收标准：**
- 刷新页面后，Undo 可回滚至少 10 步历史操作
- 切换画布后返回，原画布历史完整保留
- IndexedDB 存储占用不超过 5MB/画布（超过自动清理最旧快照）

---

## P002 — PNG 批量导出

**问题描述：** 当前支持 PNG 单张导出，批量导出场景（导出所有画布、导出选中画布组）无直接入口，需逐个操作，效率低下。

**根因分析：**
- `exportCanvasAsPNG` 仅处理单个 canvasId
- `CanvasListPanel` 的批量导出入口仅限 PDF 格式
- ExportMenu 未提供批量 PNG 选项

**影响评估：**
- 用户效率影响：中（专业用户批量导出是高频操作）
- 影响范围：需要导出素材的场景（PPT 制作、报告生成）
- 优先级：P1

**技术方案：**
1. 新增 `exportMultipleAsPNG(csvCanvasIds[]): Promise<Blob[]>` — 并发导出
2. `CanvasListPanel` 批量操作栏添加「导出 PNG」按钮
3. 进度反馈：`ExportProgress` 组件显示导出进度（X/Y 完成）
4. ZIP 打包：多选导出时自动打包为 `vibex-export-{date}.zip`
5. 后端支持：`/api/export/batch-png` — 服务端合并（避免浏览器内存压力）

**验收标准：**
- 选中 10 个画布，点击「导出 PNG」→ 生成包含 10 张 PNG 的 ZIP 文件
- 单张 PNG 导出保留当前视图范围（viewport 可见区域）
- 导出过程中可取消，进度条实时更新

---

## P003 — MiniMap 缩略导航

**问题描述：** 大型画布（100+ 节点）场景下，用户无法快速了解画布整体结构，导航效率低。当前无任何缩略图或导航辅助。

**根因分析：**
- `@xyflow/react` 内置 `MiniMap` 组件，但 VibeX 未集成
- 画布无限画布模式（±50,000 bounds）进一步加剧导航难度

**影响评估：**
- 用户体验影响：高（大型画布使用体验极差）
- 优先级：P1

**技术方案：**
1. 引入 `@xyflow/react` 内置 `MiniMap` 组件（已安装，无需额外依赖）
2. 新增 `MiniMap.tsx` wrapper：`nodeColor` 按卡片类型着色，`nodeStrokeWidth` 缩放
3. 集成位置：画布右下角，`Background` 组件之上（Panel 定位）
4. 交互：点击 MiniMap 区域 → 视口跳转；拖拽视口框 → 实时导航
5. 性能：`nodeColor` 采样（每 20px 取一个节点代表点），避免渲染所有节点

**验收标准：**
- MiniMap 显示在画布右下角，默认可见
- 点击 MiniMap 任意区域，视口平滑跳转
- MiniMap 随画布实时更新（添加/删除节点后同步刷新）

---

## P004 — 多选批量操作

**问题描述：** 当前画布仅支持单个节点操作。无法批量移动、批量删除、批量复制卡片，效率极低。

**根因分析：**
- `ddsChapterStore` 的 `selectedCardIds: string[]` 已支持多选（底层支持）
- Toolbar 仅暴露「删除选中」按钮，批量移动/复制无入口
- 多选框选（marquee selection）未实现

**影响评估：**
- 用户效率影响：高（大型画布编辑场景）
- 优先级：P1

**技术方案：**
1. **框选模式**：`useSelectionBox` hook — 鼠标拖拽生成矩形选区，选中区域内的所有卡片
2. **批量操作 Toolbar**：选中 2+ 卡片时，显示浮动 Toolbar（移动/复制/删除/编组）
3. **批量移动**：`moveCards(deltaX, deltaY)` — 将选中卡片整体偏移
4. **批量复制**：`duplicateCards()` — 复制选中卡片，偏移 20px 放置
5. **对齐工具**：左对齐/右对齐/水平居中/垂直居中

**验收标准：**
- 鼠标拖拽生成蓝色选区框，框内卡片高亮选中
- 选中 3 个卡片，点击 Toolbar「复制」→ 生成 3 个副本
- 选中卡片后按 Delete 键 → 批量删除（带确认提示）

---

## P005 — @提及 + 评论通知深化

**问题描述：** S50-E3 评论通知已实现基础推送，但 @提及功能缺失，无法在评论中 @团队成员，无法针对特定节点位置评论。

**根因分析：**
- 评论系统基于卡片 ID（`cardId`）但无法 @具体位置（坐标）
- 无用户提及（@username）解析和通知触发
- 评论面板无 @ 补全 UI

**影响评估：**
- 协作体验影响：高（@提及是团队协作标配）
- 优先级：P2

**技术方案：**
1. **@提及解析**：评论文本正则匹配 `@[a-zA-Z0-9_]+`，解析为 `mentions[]`
2. **Mentions API**：`/api/comments/mentions` — 存储 mentions 列表
3. **@补全 UI**：`CommentInput` 组件，`@` 触发下拉补全（团队成员列表）
4. **节点位置评论**：`CommentCard` 支持 `position?: {x, y}` — 可针对画布坐标而非仅卡片评论
5. **通知触发**：评论发布时，若 `mentions.length > 0`，通过 WebSocket 推送通知到被 @ 用户

**验收标准：**
- 评论输入框输入 `@` 触发成员补全下拉
- 发送含 `@username` 的评论后，对应用户收到 WebSocket 通知
- 可在画布任意坐标位置添加评论（无需绑定卡片）

---

## 技术风险

| ID | 风险 | 概率 | 影响 | 缓解方案 |
|----|------|------|------|----------|
| R1 | IndexedDB 存储超限 | 中 | 高 | LIRS 驱逐 + 5MB 上限 + 自动清理 |
| R2 | MiniMap 性能（大画布） | 中 | 中 | 节点采样 + `shouldComponentUpdate` 优化 |
| R3 | 批量导出内存压力 | 高 | 中 | 服务端 ZIP 合并，浏览器端流式处理 |
| R4 | @提及通知推送失败 | 低 | 中 | 降级为轮询 + Slack 通知 |

---

*生成时间：2026-06-02 | Sprint 50 交付分析 | VibeX Team*
