# Analyst 提案 — Canvas JSON 前后端统一 + 版本化 + 自动保存

**Agent**: analyst
**日期**: 2026-04-02
**项目**: canvas-json-persistence
**仓库**: /root/.openclaw/vibex
**分析视角**: 数据架构 + 行业最佳实践

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| A001 | analysis | 三树节点数据模型统一 | 前端所有节点类型 | P0 |
| A002 | analysis | 后端存储版本化方案 | 后端 API + DB | P0 |
| A003 | analysis | 自动保存策略设计 | 前端状态管理 | P1 |
| A004 | analysis | 前后端数据同步协议 | 前端 + 后端 | P1 |

---

## 2. 提案详情

### A001: 三树节点数据模型统一

**分析视角**: 前端 Zustand store 现状分析

**问题描述**:
三树节点（BoundedContextNode / BusinessFlowNode / ComponentNode）字段不统一：
- `isActive`: 控制 API payload 是否包含
- `selected`: UI 选择状态（E1 注释存在，行为不确定）
- `status`: 节点确认状态（`'pending' | 'generating' | 'confirmed' | 'error'`）

关键问题：`selected` 和 `isActive` 语义重叠，Migration 2→3 只处理了 `isActive`（`confirmed` → `isActive`），未处理 `status`。

**根因分析**:
1. 三树独立迭代，字段定义各自为政
2. `selected` 字段从未被正式使用（代码中无赋值点）
3. Migration 策略缺失 `status` 映射

**影响范围**: 前端所有画布交互功能

**建议方案**:
统一节点状态机：
```
NodeState = {
  status: 'idle' | 'generating' | 'confirmed' | 'error'  // 视觉 + 行为
  isActive: boolean  // 是否参与 API payload
  selected: boolean  // 是否被用户在 UI 选中（多选场景）
}
```
- 删除 `selected` 字段（如果未使用）
- Migration 3→4: `status: confirmed → 'confirmed'`
- 为三树定义统一的 NodeState 接口

**验收标准**:
- [ ] 三树节点类型共享统一 NodeState 接口
- [ ] Migration 3→4 正确映射 `status`
- [ ] `selected` 字段有明确的 UI 语义或被删除

---

### A002: 后端存储版本化方案

**分析视角**: 竞品分析 + 行业最佳实践

**问题描述**:
当前后端 Prisma schema 中：
- `Project.version` 仅用于乐观锁（非真正的版本化）
- `FlowData.nodes` 是 JSON 字符串，无版本历史
- 无 canvas 节点的后端持久化（全存 localStorage）

**竞品分析**:

| 产品 | 版本化方案 | 特点 |
|------|----------|------|
| Figma | 实时协同 + 历史版本 | 每个操作一个 snapshot，支持 named version |
| Notion | Page History | 每次保存一个 snapshot，可命名、可比较、可回滚 |
| Miro | 增量操作日志 | 操作日志 + snapshot，节省存储 |
| Lucidchart | 数据库行级版本 | 每版本一行，支持 diff |

**建议方案**:

方案 1: **时间戳 Snapshot**（推荐）
```
CanvasSnapshot {
  id: string
  projectId: string
  version: int  // 自增版本号
  nodes: Json   // 完整节点状态
  createdAt: DateTime
  createdBy: string
  metadata: Json  // { phase, selectedNodeIds, ... }
}
```
- 每个自动保存创建一个 snapshot
- `Project.currentSnapshotId` 指向当前版本
- 保留最近 50 个版本，超出后合并
- 支持按时间点回滚

方案 2: **增量操作日志**
- 每个操作记录一条 log
- 重建状态时 replay 所有 log
- 缺点：复杂，回滚慢

**工作量估算**: 后端 6-8h + 前端 4-6h

**验收标准**:
- [ ] 后端可按 projectId 查询历史版本列表
- [ ] 支持回滚到指定版本
- [ ] 回滚操作有 API 记录

---

### A003: 自动保存策略设计

**分析视角**: 用户体验 + 技术实现

**问题描述**:
当前 canvas 数据仅存储在 localStorage：
- 换设备/换浏览器数据丢失
- 刷新页面状态正确（Zustand persist）
- 无多设备同步

**建议方案**:

自动保存触发策略：
```
策略 A: Debounce 防抖（推荐）
  - 节点变更后 2s 无操作 → 保存到后端
  - 适用于快速编辑场景

策略 B: 定期保存
  - 每 30s 保存一次（如有变更）
  - 适用于低频编辑

策略 C: 事件触发
  - Phase 切换时强制保存
  - API 请求前保存当前状态
  - 页面 unload 时 navigator.sendBeacon
```

推荐组合：**Debounce 2s + Phase 切换强制保存 + unload beacon**

**工作量估算**: 4-6h

**验收标准**:
- [ ] 节点编辑后 2s 内自动保存
- [ ] 切换 Phase 时状态已保存
- [ ] 跨会话数据一致性
- [ ] 保存时有视觉反馈（Saving.../Saved ✓）

---

### A004: 前后端数据同步协议

**分析视角**: API 设计 + 离线优先

**问题描述**:
无明确定义前后端数据同步协议：
- 前端不知道何时该拉取后端数据
- 后端不知道前端当前版本
- 冲突解决策略缺失

**建议方案**:

定义 SyncProtocol：
```ts
interface CanvasSyncState {
  projectId: string
  version: number           // 后端 snapshot 版本
  lastSyncedAt: string     // ISO timestamp
  pendingChanges: number    // 未同步变更计数
}

// 同步策略：
// 1. 加载页面时：GET /api/canvas/{projectId} → 对比 version
// 2. version 相等 → 使用本地数据
// 3. version 不同 → 提示用户选择（合并/覆盖/取消）
// 4. 保存后：version++，lastSyncedAt 更新
```

**工作量估算**: 3-4h

**验收标准**:
- [ ] 页面加载时检查版本一致性
- [ ] 版本冲突时用户有明确选项
- [ ] 离线状态有友好提示

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| agent-submit | canvas-json-persistence | ✅ | proposals/20260402/analyst.md |
| analyst-review | canvas-json-persistence | ✅ | docs/canvas-json-persistence/analysis.md |

---

## 4. 做得好的

1. 三树类型定义已有统一基础（共享 NodeState 部分）
2. Zustand persist middleware 已有基础设施
3. Migration 机制已建立

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | `selected` 字段语义不清 | 明确用途或删除 |
| 2 | 后端无 canvas 节点存储 | 新建 CanvasSnapshot model |
| 3 | 无版本化意识 | 建立 snapshot 机制 |
