# S80 QA 分析报告

## 项目背景
Sprint80 已完成 5 个 Epic 的开发，所有代码已合并至 `origin/main` (SHA `878427ea6`)。本 QA 项目负责验证产出物完整性、交互可用性和设计一致性。

---

## P001: 通知偏好设置管理面板 (E1) 验证
**问题**: E1 实现了 IndexedDB 持久化的通知偏好设置系统。需要验证各配置项的保存/读取/重置流程完整性。

**根因**: E1 新增 `notification_prefs` IndexedDB store 和 `NotificationPreferencesPanel` 组件，替换原有的 `NotificationSettingsDrawer`。

**影响**: 用户通知偏好无法持久化 → 每次刷新丢失设置，体验中断。

**技术方案**:
- 验证 `notification_prefs` objectStore (DB v11) 存在
- 验证 `notificationStore.setPreference/getPreference` 逻辑
- 验证 `loadPreferencesFromIndexedDB` 初始化时序
- 验证面板 UI：频道开关 + 类型开关 + 重置按钮渲染
- 验证 DDSToolbar ⚙️ 按钮触发面板

**验收标准**:
- [ ] IndexedDB `notification_prefs` store 可读写
- [ ] 偏好设置刷新页面后保持
- [ ] 重置按钮清空所有偏好
- [ ] DDSToolbar 设置按钮打开正确面板

---

## P002: 模板分类/标签过滤测试 (E2) 验证
**问题**: E2 为 `templateStore` 编写了 19 个测试用例，覆盖 `filterByCategory`/`filterByTag`/`searchTemplates`/`filterTemplates` 及 `CategoryFilter` 组件。需要验证测试覆盖率完整性和测试通过率。

**根因**: E2 是纯测试 epic，验证 S77-E3 `templateStore` 的分类/标签过滤功能实现。

**影响**: 测试缺失 → 分类/标签过滤 regression 风险高。

**技术方案**:
- 运行 `npx vitest run templateStore.category.test.ts` 确认 19/19 通过
- 验证 `metadata.tags` 字段 AND 交集过滤逻辑
- 验证 CategoryFilter 多选 AND/OR 模式
- 验证空状态场景

**验收标准**:
- [ ] `templateStore.category.test.ts` 19/19 通过
- [ ] `CategoryFilter.test.tsx` 相关测试通过
- [ ] AND/OR 模式切换行为正确

---

## P003: Merge History Enrichment (E3) 验证
**问题**: E3 为 `MergeHistoryEntry` 新增 `mergedNodeIds`/`conflictCount`/`authorIds` 字段，扩展了 MergeHistoryPanel 的详情展示和 Markdown 导出功能。

**根因**: E3 在 E5 (S79) MergeHistoryViewer 基础上进行 enrichment。

**影响**: Merge 历史信息不完整 → 协作冲突溯源困难。

**技术方案**:
- 验证 `MergeHistoryEntry` 类型包含 3 个新字段
- 验证 `recordMerge` 存储 enriched fields
- 验证 Timeline Item 展开详情显示
- 验证贡献者头像列表渲染
- 验证 conflictCount > 0 显示 ⚠️ 徽章
- 验证 Markdown 导出格式正确
- 运行 `npx vitest run canvasHistoryStore.e3-merge-history.test.ts` 确认 4/4 通过

**验收标准**:
- [ ] MergeHistoryEntry 新字段完整
- [ ] Timeline 展开详情显示节点统计和贡献者
- [ ] ⚠️ 冲突徽章在 conflictCount > 0 时显示
- [ ] Markdown 导出包含所有 enriched fields
- [ ] vitest 4/4 通过

---

## P004: 画布设置中心 (E4) 验证
**问题**: E4 实现了 `SettingsModal.tsx` 4-tab 设置中心（快捷键/画布/通知/性能），集成到 DDSToolbar。需要验证 4 个 tab 的切换、设置持久化和 DDSToolbar 集成。

**根因**: E4 统一了分散的设置入口，提升用户体验。

**影响**: 设置分散 → 用户难以找到偏好配置入口。

**技术方案**:
- 验证 `SettingsModal.tsx` 4-tab 渲染正确
- 验证 `lastOpenedTab` 持久化（settingsStore）
- 验证 DDSToolbar ⚙️ 按钮打开 SettingsModal
- 验证 Tab 切换状态保持
- 验证 `SettingsModal.test.tsx` 7/7 通过

**验收标准**:
- [ ] 4-tab 面板正常打开
- [ ] Tab 切换不重置其他 Tab 的值
- [ ] lastOpenedTab 刷新后保持
- [ ] DDSToolbar 设置按钮功能正确
- [ ] vitest 7/7 通过

---

## P005: 协作者在线状态与活动流 (E5) 验证
**问题**: E5 实现了 `presenceStore` 的 `lastActiveAt`/`isOnline`/`updateLastActive`，新增 `OnlinePresenceIndicator` 组件，集成到 `DDSCanvasPage`。需要验证在线状态计算、指示器渲染和 WebSocket 消息处理。

**根因**: E5 在 S62-E1 `useWebSocketPresence` 基础上扩展了活动状态感知。

**影响**: 无法感知协作者在线状态 → 实时协作体验不完整。

**技术方案**:
- 验证 `presenceStore.lastActiveAt` Record 正确更新
- 验证 `isOnline(userId)` 5 分钟阈值逻辑
- 验证 `OnlinePresenceIndicator` 绿点/灰点切换
- 验证 `PresenceUpdateMessage` WebSocket 类型处理
- 验证 `handleNodeMouseMove`/`handleNodesChange` 触发 `updateLastActive`
- 验证 `OnlinePresenceIndicator` 定位 (top:60px, right:16px)
- 运行 `presenceStore.e5.test.ts` 11/11 + `OnlinePresenceIndicator.test.tsx` 7/7

**验收标准**:
- [ ] 5 分钟内活跃 → 绿点，≥5 分钟 → 灰点
- [ ] 指示器在 DDSCanvasPage 正确位置渲染
- [ ] WebSocket presence_update 消息处理正确
- [ ] 用户移动/节点变化触发状态更新
- [ ] vitest 18/18 通过 (11+7)

---

## 技术风险

| 风险 | 级别 | 说明 |
|------|------|------|
| E5 `onlineUsers` 类型一致性 | 中 | 代码中 `onlineUsers` 应为 `string[]`，需验证类型使用正确 |
| E4 Tab 切换与 DDSToolbar 状态冲突 | 低 | 多个设置入口可能产生状态竞争 |
| E3 Markdown 导出格式兼容性 | 低 | 导出格式需验证不同语言/特殊字符处理 |
| E2 测试与 store 实现版本匹配 | 低 | 测试写于 S80，store 可能已在 main 上被修改 |

---

## 依赖关系
- P001 (E1 验证) 独立
- P002 (E2 测试验证) 独立
- P003 (E3 验证) 依赖 E5 (S79) MergeHistoryPanel 已存在
- P004 (E4 验证) 独立
- P005 (E5 验证) 依赖 S62 `useWebSocketPresence` 已存在

---

## 验收质量阈值
- 所有 vitest 测试必须 100% 通过
- E1-E5 每个 Epic 至少一个端到端验证步骤
- 发现的问题按 P0(阻塞)/P1(严重)/P2(一般) 分级
