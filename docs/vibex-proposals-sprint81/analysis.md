# S81 提案分析 — 基于 S79/S80 已完成功能

**Sprint**: vibex-proposals-sprint81
**Date**: 2026-06-09
**Analyst**: coord (self-impl, analyst agent phantom)
**Source**: CHANGELOG.md S79/S80 entries + git log

## 已完成功能回顾 (S79/S80)

| Sprint | Epic | 功能 |
|--------|------|------|
| S79 | E1 | 定时导出执行引擎 (ScheduledExportRunner) |
| S79 | E2 | 模板更新通知面板 (NotificationPanel TabBar) |
| S79 | E3 | 评论回复 + @提及通知系统 |
| S79 | E4 | 关联追踪 BFS 深度遍历 |
| S79 | E5 | Merge History Viewer (IndexedDB 持久化) |
| S80 | E1 | 通知偏好设置管理面板 |
| S80 | E2 | 模板分类/标签过滤测试覆盖 |
| S80 | E3 | Merge History Enrichment (节点统计/贡献者) |
| S80 | E4 | SettingsModal 4-tab 统一设置中心 |
| S80 | E5 | 协作者在线状态与活动流 |

## 识别缺口 (Gap Analysis)

### P001: 画布性能监控面板
**类别**: UI增强
**缺口来源**: S80 DPR 缩放优化完成了前端实现，但缺乏性能监控视图
**问题**: 用户无法查看画布渲染性能指标（FPS、节点数、连接数）
**根因**: 仅有 DPR 设置而无监控面板，性能问题无法量化
**影响**: 中 — 影响专业用户和大型画布体验
**技术方案**: 新增 `PerformanceMonitor` 面板组件，集成 `performance.now()` 采样 + `requestAnimationFrame` FPS 计算，嵌入 `DDSCanvasPage` 侧边栏
**接受标准**: 
- 实时 FPS 显示 (60fps / <30fps 红色警告)
- 当前节点数 / 连接数统计
- 面板可折叠

### P002: 画布导入格式支持扩展
**类别**: 数据管理
**缺口来源**: S80 SettingsModal 完成了但无导入能力
**问题**: 用户只能从模板市场导入，无法从本地文件或 URL 导入
**根因**: 现有 `ZipExporter` 支持导出但无对应导入器
**影响**: 高 — 严重限制工作流
**技术方案**: 新增 `CanvasImporter` 类，支持 `.flow.json` / `.flow.zip` 格式解析，`ImportMenu` 组件提供文件选择 + URL 输入模式
**接受标准**:
- 支持拖拽文件导入
- 支持 URL 导入（GET 请求）
- 冲突处理（同名画布：覆盖/重命名/取消）
- vitest 覆盖解析逻辑

### P003: 协作编辑实时统计面板
**类别**: 协作增强
**缺口来源**: S80 E5 完成在线状态但缺乏活动统计
**问题**: 无法查看协作者活跃时段、编辑热力图
**根因**: `presenceStore` 只记录在线/离线，无历史统计
**影响**: 低 — 协作洞察是锦上添花
**技术方案**: `collabSessionStore` 新增 `sessionStats` Record + `ActivityHeatmap` 组件
**接受标准**:
- 显示当前会话活跃用户数
- 显示协作者最近编辑时间线

### P004: 模板市场搜索增强
**类别**: 模板系统
**缺口来源**: S80 E2 测试覆盖了搜索但无 AI 推荐
**问题**: 模板市场仅支持分类筛选，无智能推荐
**根因**: S78-E2 订阅功能完成但无推荐引擎
**影响**: 中 — 影响模板市场使用体验
**技术方案**: `templateStore` 新增 `getRecommendedTemplates(userId)` 方法，基于订阅作者 + 历史使用加权评分
**接受标准**:
- 模板市场新增「推荐」Tab
- 推荐结果基于订阅作者优先 + 近期使用加权

### P005: 设置数据导入导出
**类别**: 数据管理
**缺口来源**: S80 E1 完成偏好设置但无持久化导出
**问题**: 用户无法备份/迁移设置
**根因**: `notificationStore` 偏好存 IndexedDB 但无导出接口
**影响**: 中 — 换设备设置丢失
**技术方案**: `settingsStore` 新增 `exportSettings()` / `importSettings(json)` 方法，`SettingsModal` 新增「导入/导出」按钮
**接受标准**:
- 导出为 JSON 文件下载
- 支持从 JSON 文件导入
- 导入前校验格式

## 技术债务观察

1. **IndexedDB 版本漂移**: S79-E5 (DB v10) → S80-E1 (DB v11)，无版本迁移测试
2. **通知系统架构**: `mentionsStore` (S51) + `notificationStore` (S68) 分离，但 `notificationStore.addNotification` 跨文件调用需清理
3. **presenceStore 内存泄漏风险**: `lastActiveAt` Record 无限增长，需定期 GC

## 优先级建议

| ID | 功能 | 优先级 | 工作量估计 |
|----|------|--------|-----------|
| P001 | 画布性能监控面板 | P1 | 中 |
| P002 | 画布导入格式支持 | P1 | 大 |
| P003 | 协作实时统计 | P2 | 小 |
| P004 | 模板搜索增强 | P2 | 中 |
| P005 | 设置导入导出 | P1 | 小 |
