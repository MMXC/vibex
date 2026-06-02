# Sprint 52 — 产品需求文档（PRD）

**项目**: vibex-proposals-sprint52
**版本**: 1.0
**日期**: 2026-06-02

---

## 执行摘要

Sprint 52 聚焦**画布协作能力增强**（P001 实时感知）和**导出/模板/快捷键等工具完善**（P002-P005）。基于 Sprint 51 的持久化基础设施，构建协作感知层，同时完善用户日常工具链。

**Epic 数量**: 5（E1: 协作感知 P0，E2: 导出扩展 P1，E3: Undo 冲突处理 P1，E4: 模板增强 P2，E5: 快捷键配置 P2）

---

## Epic-Story 映射表

| Epic ID | 标题 | 优先级 | 负责人 | 依赖 |
|---------|------|--------|--------|------|
| E1 | 画布协作实时感知 | P0 | Dev | — |
| E2 | 批量导出格式扩展（SVG/PDF） | P1 | Dev | E1 无依赖 |
| E3 | Undo/Redo 协作冲突处理 | P1 | Dev | S51-E1 持久化 |
| E4 | 模板管理增强（分类/标签/搜索） | P2 | Dev | S50-E4 导入导出 |
| E5 | 键盘快捷键自定义 UI | P2 | Dev | S48-E3 基础设施 |

---

## 功能详情

### E1 — 画布协作实时感知

**目标**: 用户打开画布时，能看到当前在线的其他协作者头像列表，离开时自动移除。

#### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| E1.1 | presence:join 消息 | 打开画布自动发送 `presence:join` WebSocket 消息，30s 间隔 ping |
| E1.2 | 在线用户列表 UI | 侧边栏 DDSToolbar 区域显示在线用户头像+名称列表 |
| E1.3 | 离线自动移除 | 30s 无 ping 则从列表移除，附带 Toast "XX 离开了" |
| E1.4 | Presence Store | `collaborationPresenceStore` 管理 `onlineUsers[]`，Vitest 覆盖 join/leave/ping |
| E1.5 | D1 Presence 表 | `collaboration_presence` 表（userId, projectId, canvasId, lastPing） |

#### expect() 断言示例

```typescript
// E1: collaborationPresenceStore
expect(store.onlineUsers).toHaveLength(2);
expect(store.onlineUsers[0].userId).toBe('user-a');
expect(store.onlineUsers[0].status).toBe('online');

// E1.3: 离线移除
vi.advanceTimersByTime(35000);
expect(store.onlineUsers).toHaveLength(1);
```

#### DoD

- [ ] `presence:join/leave/ping` WebSocket 消息类型已实现
- [ ] `collaborationPresenceStore` 管理 onlineUsers 正确
- [ ] PresenceIndicator UI 显示头像列表
- [ ] 30s 无 ping 自动移除用户
- [ ] `collaboration_presence` D1 表已创建并可写入
- [ ] Vitest `collaborationPresenceStore.test.ts` 全部通过

---

### E2 — 批量导出格式扩展（SVG + PDF）

**目标**: 在 S51-E2 PNG 批量导出基础上，新增 SVG 和 PDF 两种格式支持。

#### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| E2.1 | SVG 导出 | `exportMultipleAsSVG()` 遍历 ReactFlow 节点生成可缩放 SVG（含样式内联） |
| E2.2 | PDF 导出 | `exportMultipleAsPDF()` 生成 PDF（每画布一页），使用 jsPDF |
| E2.3 | 格式切换 UI | ExportProgress.tsx 支持 PNG/SVG/PDF 切换下拉菜单 |
| E2.4 | 后端 PDF API | `/api/export/pdf-batch` 接收 SVG 数据生成 PDF |
| E2.5 | Vitest | `exportMultipleAsSVG.test.ts` 和 `exportMultipleAsPDF.test.ts` 覆盖边界 cases |

#### expect() 断言示例

```typescript
// E2.1: SVG 导出
const svg = await exportMultipleAsSVG(nodes, edges);
expect(svg).toContain('<svg');
expect(svg).toContain('<rect'); // ReactFlow node
expect(svg).toContain('stroke'); // style inline

// E2.2: PDF 导出
const pdf = await exportMultipleAsPDF([canvas1, canvas2]);
expect(pdf).toHaveLength(2);
expect(pdf[0].format).toBe('pdf');
```

#### DoD

- [ ] `exportMultipleAsSVG.ts` 生成有效 SVG（含节点/边/样式）
- [ ] `exportMultipleAsPDF.ts` 生成 PDF，每画布一页
- [ ] ExportProgress UI 格式切换正确（PNG/SVG/PDF）
- [ ] 后端 `/api/export/pdf-batch` 可用
- [ ] Vitest `exportMultipleAsSVG.test.ts` 空/单/多节点全部通过
- [ ] Vitest `exportMultipleAsPDF.test.ts` 单/多画布全部通过

---

### E3 — Undo/Redo 协作冲突处理

**目标**: 多人协作时，引入 revision 乐观锁防止并发写入覆盖历史。

#### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| E3.1 | Revision 字段 | `canvasHistoryStore` 每个 entry 含 `revision` 字段，自增 |
| E3.2 | 乐观锁保存 | `historyDB.saveHistoryWithRevision(baseRevision, history)` revision 不匹配拒绝写入 |
| E3.3 | WebSocket revision:bump | 协作者操作后广播 `revision:bump`，本地更新 baseRevision |
| E3.4 | 冲突 Toast | Revision 冲突时弹出 Toast "其他人已修改，是否合并？" |
| E3.5 | Vitest | `canvasHistoryStore.test.ts` 和 `historyDB.test.ts` 新增 revision cases |

#### expect() 断言示例

```typescript
// E3.2: 乐观锁拒绝
await store.saveHistoryWithRevision(5, entries);
await expect(store.saveHistoryWithRevision(5, entries)).rejects.toThrow('Revision mismatch');

// E3.4: 冲突 Toast
expect(toastMock).toHaveBeenCalledWith(
  expect.stringContaining('其他人已修改'),
  'warning'
);
```

#### DoD

- [ ] `canvasHistoryStore` 含 `baseRevision` 字段且正确递增
- [ ] `saveHistoryWithRevision()` revision 不匹配时抛出错误
- [ ] WebSocket `revision:bump` 事件被正确处理
- [ ] 冲突时显示 Toast 提示
- [ ] Vitest `canvasHistoryStore.test.ts` revision 冲突 cases 通过
- [ ] Vitest `historyDB.test.ts` revision 校验 cases 通过

---

### E4 — 模板管理增强（分类/标签/搜索）

**目标**: 在 S50-E4 导入/导出基础上，为模板库增加分类、标签和搜索功能。

#### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| E4.1 | 分类字段 | 模板可选分类（流程图/思维导图/UML/其他） |
| E4.2 | 标签管理 | 模板可添加/删除多个标签字符串 |
| E4.3 | 分类 Tab | TemplateGallery 顶部分类 Tab 切换正确 |
| E4.4 | Fuse.js 搜索 | `TemplateSearchBar.tsx` 搜索返回相关模板（≥1 结果） |
| E4.5 | Vitest | `templateStore.test.ts` 和 `templateSearch.test.ts` 通过 |

#### expect() 断言示例

```typescript
// E4.1: 分类设置
store.setCategory('tpl-1', 'flowchart');
expect(store.templates['tpl-1'].category).toBe('flowchart');

// E4.4: 搜索
const results = searchTemplates('流程');
expect(results.length).toBeGreaterThanOrEqual(1);
expect(results[0].name).toContain('流程');
```

#### DoD

- [ ] `templateStore` 新增 `category` 和 `tags` 字段
- [ ] `setCategory/addTag/removeTag` actions 正确
- [ ] TemplateGallery 分类 Tab 过滤显示正确
- [ ] TemplateSearchBar Fuse.js 搜索返回相关结果
- [ ] `TemplateEditDialog` 支持 category selector + tag input
- [ ] Vitest `templateStore.test.ts` category/tag cases 通过
- [ ] Vitest `templateSearch.test.ts` 搜索逻辑通过

---

### E5 — 键盘快捷键自定义 UI

**目标**: 将 S48-E3 可配置化需求落地，用户可在 UI 中自定义快捷键并持久化。

#### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| E5.1 | shortcutStore | Zustand store 管理快捷键配置，localStorage 持久化 |
| E5.2 | DDSToolbar 入口 | DDSToolbar 显示"快捷键设置"按钮 |
| E5.3 | 设置面板 | `ShortcutSettingsPanel.tsx` 列出所有可配置快捷键 |
| E5.4 | 快捷键重绑定 | 双击快捷键 → `ShortcutKeyInput` 捕获 keydown → 保存 |
| E5.5 | 冲突检测 | 相同按键组合不能绑定多个 action |
| E5.6 | Vitest | `shortcutStore.test.ts` save/load/reset cases 通过 |

#### expect() 断言示例

```typescript
// E5.1: 持久化加载
const store = createShortcutStore();
expect(store.shortcuts['undo'].key).toBe('z');
expect(store.shortcuts['redo'].key).toBe('y');

// E5.5: 冲突检测
expect(() => store.bindShortcut('ctrl+z', 'redo')).toThrow('Key conflict');
```

#### DoD

- [ ] `shortcutStore.ts` 管理快捷键配置
- [ ] DDSToolbar 显示"快捷键设置"入口按钮
- [ ] ShortcutSettingsPanel 列出所有可配置快捷键
- [ ] 双击快捷键可重新绑定（keydown 捕获，显示 Ctrl+Shift+L 格式）
- [ ] 快捷键配置保存到 localStorage，刷新后恢复
- [ ] 冲突检测阻止同一按键组合绑定多个 action
- [ ] Vitest `shortcutStore.test.ts` 全部通过

---

## 页面集成表

| 页面 | 组件 | 改动 |
|------|------|------|
| DDSCanvasPage | PresenceIndicator | E1 新增（侧边栏在线用户列表） |
| DDSCanvasPage | ExportProgress (扩展) | E2 扩展 format 参数 |
| DDSCanvasPage | TemplateGallery | E4 新增分类 Tab + 搜索框 |
| DDSCanvasPage | TemplateEditDialog | E4 新增 category/tag 编辑 |
| DDSCanvasPage | ShortcutSettingsPanel | E5 新建（Modal/Panel） |
| DDSToolbar | — | E5 新增快捷键设置按钮 |

---

## 技术约束

- 禁止在 `src/app/` 下手动编辑（遵循 AGENTS.md）
- 所有 UI 使用 `design-tokens.css` 变量，禁止内联 `style={{}}`
- WebSocket 消息类型需向后兼容（旧客户端忽略未知消息）
- localStorage 快捷键配置需处理未定义/null 情况（merge 默认值）
