# VibeX Sprint 84 — IMPLEMENTATION_PARTITION

> **Date**: 2026-06-10
> **Sprint**: 84
> **Total Epics**: 5

---

## Epic 分配

| Epic | 功能 | Feature ID | Dev | Tester | Reviewer |
|------|------|------------|-----|--------|----------|
| E1 | 画布版本 Diff 对比 | S84-F01 | dev-e1 | tester-e1 | reviewer-e1 |
| E2 | 协作者在线状态与光标显示 | S84-F02 | dev-e2 | tester-e2 | reviewer-e2 |
| E3 | 画布快速跳转面板 | S84-F03 | dev-e3 | tester-e3 | reviewer-e3 |
| E4 | 模板搜索增强与收藏 | S84-F04 | dev-e4 | tester-e4 | reviewer-e4 |
| E5 | 全局键盘快捷键体系 | S84-F05 | dev-e5 | tester-e5 | reviewer-e5 |

---

## DoD (Definition of Done)

### E1: 画布版本 Diff 对比 ✅
- [x] `DiffPanel.tsx` 组件实现（新增绿色/删除红色/修改黄色三色高亮）
- [ ] `/api/canvas/:id/diff` 后端 API 实现并返回 JSON diff
- [ ] `canvasTimelineStore.ts` 新增 diff 状态 slice
- [ ] 时间轴节点右键菜单增加「与当前版本对比」入口
- [ ] 支持「单向对比」和「双向对比」两种模式
- [ ] vitest 测试：DiffPanel 渲染测试 (≥5 cases)
- [ ] E2E 测试：从时间轴选择两个版本并查看 diff
- [ ] CHANGELOG.md 更新 (S84-E1 entry)
- [ ] **Dependencies**: S83-E1 (VersionTimeline), S83-E5 (canvasTimelineStore)

### E2: 协作者在线状态与光标显示
- [ ] `CollaboratorAvatars.tsx` 组件（头像栏 + 状态点）
- [ ] `CollaboratorCursors.tsx` 组件（SVG 光标 + 昵称标签）
- [ ] `presenceStore.ts` Zustand store 实现
- [ ] WebSocket `presence` 事件订阅/发布逻辑
- [ ] WS 重连后自动恢复 presence 状态（reconnect handler）
- [ ] 协作者断线淡出动画（300ms CSS transition）
- [ ] 颜色池分配逻辑（8 色循环）
- [ ] vitest 测试：presence 事件处理 (≥8 cases)
- [ ] E2E 测试：两个浏览器同时打开同一画布，观察头像和光标
- [ ] CHANGELOG.md 更新 (S84-E2 entry)
- [ ] **Dependencies**: S83-E3 (ConflictConfirmToast), S83-E1 (canvasTimelineStore)

### E3: 画布快速跳转面板
- [ ] `CommandPalette.tsx` 组件（弹窗 + 搜索框 + 结果列表）
- [ ] `commandPaletteStore.ts` Zustand store（recentCanvases 持久化）
- [ ] Fuse.js 模糊搜索集成
- [ ] 键盘导航（↑↓ Enter Esc）完整实现
- [ ] Ctrl+K / Cmd+K 全局快捷键在 AppShell 注册
- [ ] localStorage 持久化最近 10 条访问记录
- [ ] vitest 测试：搜索、导航、历史记录 (≥10 cases)
- [ ] CHANGELOG.md 更新 (S84-E3 entry)
- [ ] **Dependencies**: S83-E1 (VersionTimeline), S83-E5 (批量导出 UI)

### E4: 模板搜索增强与收藏
- [ ] 增强搜索栏组件（支持名称+标签组合搜索）
- [ ] Fuse.js 模糊搜索集成（typo 容错）
- [ ] 收藏 API：`/api/templates/:id/favorite` POST/DELETE
- [ ] `GET /api/templates/favorites` 获取用户收藏列表
- [ ] `GET /api/templates/search` 增强搜索 API
- [ ] `user_template_favorites` 数据表迁移
- [ ] TemplateGallery 新增「我的收藏」Tab
- [ ] templateStore 增加 favorites slice
- [ ] 收藏按钮（星形图标）状态切换动画
- [ ] vitest 测试：搜索、收藏、Tab 切换 (≥10 cases)
- [ ] E2E 测试：搜索模板、收藏、取消收藏
- [ ] CHANGELOG.md 更新 (S84-E4 entry)
- [ ] **Dependencies**: S83-E4 (TagSelector, tagStore)

### E5: 全局键盘快捷键体系
- [ ] `keyboardStore.ts` Zustand store（shortcuts 配置 + localStorage 持久化）
- [ ] `useKeyboardShortcut` hook 实现（支持组合键解析）
- [ ] `ShortcutHelpDialog.tsx` 组件（Ctrl+/ 触发，显示所有快捷键）
- [ ] `ShortcutSettingsPanel.tsx` 组件（可配置快捷键 + 冲突检测）
- [ ] 全局快捷键在 AppShell 中注册（Ctrl+S/Z/Y/K/B, F11）
- [ ] 快捷键冲突检测逻辑（修改时提示）
- [ ] 默认快捷键：Ctrl+S 保存, Ctrl+Z 撤销, Ctrl+Y 重做, Ctrl+K 跳转, F11 全屏, Ctrl+B 侧边栏, Ctrl+/ 帮助
- [ ] vitest 测试：快捷键注册、触发、配置 (≥10 cases)
- [ ] E2E 测试：使用键盘快捷键完成保存、撤销、跳转操作
- [ ] CHANGELOG.md 更新 (S84-E5 entry)
- [ ] **Dependencies**: 无（S84 独立功能，可最先实现）

---

## 跨 Epic 依赖图

```
S83-E1 (VersionTimeline) ──┐
                          ├──> S84-E1 (Diff) ──> done
S83-E3 (ConflictConfirm) ─┼──> S84-E2 (Presence)
S83-E4 (tagStore) ─────────┼──> S84-E4 (Search+Favorite)
S83-E5 (BatchExport) ──────┴──> S84-E3 (CommandPalette)
S84-E5 (Shortcuts) ───────────────────────> done (无依赖)
```

---

## 建议开发顺序

1. **E5** — 全局快捷键体系（无依赖，可最先完成）
2. **E3** — 快速跳转面板（依赖 S83-E1/E5，但影响范围小）
3. **E4** — 模板搜索增强（依赖 S83-E4，扩展性强）
4. **E1** — 版本 Diff（依赖 S83-E1，核心功能）
5. **E2** — 协作者在线状态（依赖最多，安排最后）

---

## 测试覆盖率要求

| Epic | 单元测试 | E2E |
|------|----------|-----|
| E1 | ≥5 cases | 1 flow |
| E2 | ≥8 cases | 1 flow |
| E3 | ≥10 cases | 1 flow |
| E4 | ≥10 cases | 1 flow |
| E5 | ≥10 cases | 1 flow |
