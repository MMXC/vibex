# S78 需求分析 — Sprint78 提案分析

**项目**: vibex-proposals-sprint78
**日期**: 2026-06-08
**状态**: 已完成

---

## 执行摘要

Sprint78 基于 S75-S77 已完成的画布协作生态，聚焦 5 个核心能力扩展：分支自动合并、模板订阅通知、内联评论、定时导出+Webhook、画布关系追踪。

---

## 当前状态分析

### S75-S77 完成的Epic

| Sprint | Epic | 完成内容 |
|--------|------|---------|
| S75-E1 | 搜索历史工具栏 | RecentSearchesDropdown, 搜索历史持久化 |
| S75-E2 | 通知分类TabBar | 全部/提及/回复/系统 四类过滤 |
| S75-E3 | 分支对比历史记录 | BranchDiffDialog 历史Tab |
| S75-E4 | 协作活动流消息 | CollabActivityPanel handleSend, comment类型 |
| S75-E5 | Canvas快照管理 | SnapshotManagerPanel 批量删除 |
| S76-E1 | 画布背景设置 | canvasBackground统一状态, BackgroundSettingsPanel |
| S76-E2 | 批量PNG导出ZIP | BatchOpsToolbar export + ZipExporter |
| S76-E3 | Fuse.js加权搜索 | indexedSearch + CanvasMeta扩展 |
| S76-E4 | Canvas批量导入导出 | CanvasImportPanel + batch export menu |
| S76-E5 | 协作冲突检测 | remoteEditing + ConflictWarningBanner |
| S77-E1 | 通知持久化同步 | IndexedDB + REST API 合并 |
| S77-E2 | WebSocket稳定性 | heartbeat ping/pong + reconnect |
| S77-E3 | 分支权限控制 | BranchPermissionDialog + permission checks |
| S77-E4 | 离线缓存与冲突 | canvasOfflineStore + CanvasChangeLog |
| S77-E5 | DPR性能优化 | effectiveDPR + PerformanceSettings Tab |

### 识别出的核心缺口

#### 缺口 1: 分支合并体验断链
S70-E1 的 `mergeBranch()` 在冲突时仅写入 `pendingConflicts`，没有自动合并策略。用户需要手动处理所有冲突，即使 90% 的节点无冲突。S77-E3 的权限控制仅限制操作权限，不解决合并效率问题。

#### 缺口 2: 模板市场缺少订阅机制
当前模板市场用户发现→收藏→使用后无法持续追踪作者动态。用户无法获知已订阅模板的更新，也无法订阅整个分类。

#### 缺口 3: 协作评论与节点无关联
S75-E4 的评论是全局活动流，评论与画布节点无关联。用户无法针对特定节点发起讨论，上下文章丢失。

#### 缺口 4: 导出能力缺少自动化
批量导出是手动触发的，无定时备份和 Webhook 通知。依赖 VibeX 做定期备份的企业用户无法自动化。

#### 缺口 5: 画布关系网络缺失
当前画布之间是独立的，无法表达父子关系、参考关系。项目级画布管理依赖文件夹，无关系语义。

---

## 提案优先级建议

| 优先级 | 提案 | 理由 |
|--------|------|------|
| P0 | P001 分支自动合并 | 核心用户体验，直接影响分支管理效率 |
| P1 | P002 模板订阅通知 | 提升用户粘性，通知系统已在 S77-E1 完善 |
| P1 | P003 内联评论 | S75-E4 已打基础，扩展节点评论自然演进 |
| P2 | P004 定时导出+Webhook | 企业需求，S76-E2 批量导出已完善基础设施 |
| P2 | P005 画布关系追踪 | 生态能力，画布网络化管理 |

---

## 风险评估

- **P001 风险**: `autoMergeBranch` 的 diff 算法复杂度较高，需要对 snapshot 结构做深度比较。建议 MVP 仅处理节点级别的简单合并（节点增/删/改），复杂边合并仍走手动。
- **P003 风险**: `collabSessionStore` 已通过 S75-E4 扩展，需确保新增的 `comments` 字段与现有 `activityEntries` 独立。
- **P004 风险**: Webhook 调用需要网络可达性，S77-E4 离线缓存可能影响 webhook 触发时机。需在 `syncStatus === 'synced'` 时触发。
