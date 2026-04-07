# 需求分析报告: E4 Sync Protocol — 冲突检测与冲突解决

**任务**: canvas-sync-protocol-complete / analyze-requirements
**角色**: analyst
**日期**: 2026-04-03
**项目**: canvas-sync-protocol-complete
**Epic 背景**: canvas-json-persistence（前后端统一 + 版本化 + 自动保存）

---

## 业务场景分析

### 当前实现状态

通过源码审查，canvas-json-persistence Epic 的前三个 Sprint 已完成：

| Sprint | 内容 | 状态 | 关键文件 |
|--------|------|------|---------|
| Sprint 1-2 | 数据模型统一 | ✅ 完成 | `NodeState.ts`, `canvasStore.ts` |
| Sprint 3 | 自动保存 + Migration | ✅ 完成 | `useAutoSave.ts`, `SaveIndicator.tsx` |
| **Sprint 4** | **冲突检测 + 冲突解决 UI** | **❌ 待完成** | — |

### 前端已就绪的部分

`useAutoSave.ts` 中已实现：
- `SaveStatus` 枚举包含 `'conflict'` 状态
- 409 响应被捕获并标记为 `isConflict`
- `setSaveStatus('conflict')` 触发冲突态
- `SaveIndicator.tsx` 已有冲突状态的 UI 展示（🔄图标 + "解决"按钮）

**关键问题**：前端已具备冲突 UI 的"展示层"，但**后端 API 和冲突解决逻辑均未实现**。

### 后端缺口分析

```
API Config 配置了以下端点：
  GET    /v1/canvas/snapshots          ← 不存在
  POST   /v1/canvas/snapshots           ← 不存在
  GET    /v1/canvas/snapshots/:id       ← 不存在
  POST   /v1/canvas/snapshots/:id/restore ← 不存在

CanvasSnapshot 表：已创建（migration 0006）
  字段：id, projectId, version, name, data(JSON), createdAt, createdBy, isAutoSave
  约束：UNIQUE(projectId, version) — 乐观锁支持

缺口：
  1. 后端 /v1/canvas/snapshots 路由缺失
  2. 冲突检测逻辑缺失（version 比较 + 409 响应）
  3. 冲突解决策略缺失（keep-local / keep-server / merge）
  4. 多端同步（WebSocket/SSE）缺失
```

### 业务场景

**场景 1：单用户多标签页编辑**
用户同时在两个浏览器标签页打开同一个项目，在标签页 A 做修改，标签页 B 触发自动保存时收到 409（因为本地 version 低于服务器最新 version）。

**场景 2：多用户并发编辑**
用户 A 和用户 B 同时编辑同一个项目的画布，用户 A 的保存覆盖了用户 B 的修改，用户 B 收到冲突告警。

**场景 3：跨设备同步**
用户在电脑 A 编辑后，在电脑 B 打开项目，期望看到最新状态而非自己的过期缓存。

---

## JTBD（Jobs to Be Done）

### JTBD 1: 用户需要知道自己的修改是否被覆盖
**触发**: 用户辛辛苦苦编辑了半小时，刷新后发现什么都没了
**期望**: 冲突时能看到对比，明确选择保留哪个版本
**价值**: 防止数据丢失，提升编辑安全感

### JTBD 2: 用户需要继续工作而不被强制中断
**触发**: 自动保存失败显示错误，用户不知所措
**期望**: 有清晰的"解决"按钮和操作引导，不要阻断工作流
**价值**: 减少摩擦，保持创作心流

### JTBD 3: 团队成员需要感知彼此的存在
**触发**: 团队协作者在不知情的情况下相互覆盖
**期望**: 看到当前有多少人在编辑（在线状态）
**价值**: 增强团队协作的透明度

### JTBD 4: 用户需要灵活解决冲突
**触发**: 两个版本的修改都很重要，不接受二选一
**期望**: 有三选一选项（保留本地 / 保留服务器 / 合并）
**价值**: 满足高级用户的精细化需求

---

## 技术方案选项

### 方案 A：后端 REST + 轮询 + 冲突 Dialog（推荐）

**架构设计**：
```
前端                           后端
  │                              │
  │── POST /snapshots (带version) ──→  version比较
  │                              │
  │  ← 409 { conflict: true, serverVersion, serverSnapshot }
  │                              │
  │  [显示冲突 Dialog]              │
  │    ├─ 保留本地 (强制 PUT/覆盖)
  │    ├─ 保留服务器 (丢弃本地，取回 serverSnapshot)
  │    └─ 合并 (diff视图 + 逐字段选择)
  │                              │
  │── POST /snapshots (version+1) ←─  重新保存
```

**后端实现**：
1. 新建 `src/app/api/v1/canvas/snapshots/route.ts`
2. POST handler：检查 `version` 参数
   - 若 version > 当前最大版本 → 插入成功
   - 若 version ≤ 当前最大版本 → 返回 **409 Conflict** + `serverSnapshot` + `serverVersion`
3. 轮询：`useAutoSave` 每 30s 拉取一次最新 `version`（已有 `listSnapshots` API，只需加一个轻量 `HEAD` 或 `GET /latest-version`）
4. 冲突 Dialog：新增 `ConflictDialog.tsx` 组件，3 个操作按钮

**前端改动**：
| 文件 | 改动 |
|------|------|
| `ConflictDialog.tsx` | 新建 — 三按钮冲突解决 UI |
| `canvasApi.ts` | 增加 `getLatestVersion(projectId)` 轻量端点 |
| `useAutoSave.ts` | 增加轮询检测逻辑，触发 conflict 时打开 Dialog |
| `SaveIndicator.tsx` | conflict 按钮 → 打开 ConflictDialog |

**工时**：4-6h
- 后端 snapshots CRUD：2h
- 冲突检测逻辑 + 409 返回：1h
- 前端 ConflictDialog：1.5h
- 集成测试：1h

**优点**：简单可靠，RESTful，兼容现有架构，改动最小
**缺点**：轮询有延迟（最多 30s 才检测到冲突），无实时推送

---

### 方案 B：WebSocket 实时同步（进阶）

**架构设计**：
```
用户A               服务器              用户B
  │                   │                   │
  │─ WebSocket 连接 ─→│                   │
  │                   │←─ WebSocket 连接 ──│
  │                   │                   │
  │ [修改节点]         │                   │
  │── publish change ─→│                   │
  │                   │── broadcast ──────→│ [实时看到A的修改]
  │                   │                   │
  │ [离线重连]         │                   │
  │── reconnect ────→│                   │
  │                   │← 发送未同步变更 ───│ (lastSyncTs)
```

**改动范围**：
- 后端：新增 WebSocket Server（或使用 Socket.io/Partykit）
- 前端：新增 `useRealtimeSync` hook，订阅变更事件
- 冲突策略：改为 CRDT（Conflict-free Replicated Data Types）自动合并，或 OT（Operational Transform）

**工时**：15-20h
- WebSocket 服务：6h
- 前端实时订阅：4h
- CRDT/OT 实现：5h
- 测试 + 调试：5h

**优点**：实时感知，冲突可精确合并
**缺点**：改动巨大，涉及实时系统的可靠性、跨节点状态一致性；超出当前 Epic 范围

---

### 方案对比

| 维度 | 方案 A (REST+轮询) | 方案 B (WebSocket) |
|------|-------------------|-------------------|
| 工期 | 4-6h | 15-20h |
| 复杂度 | 低 | 高 |
| 实时性 | 30s 轮询延迟 | 即时 |
| 风险 | 低 | 高（状态一致性） |
| 适用场景 | 当前 Epic 目标 | 未来多用户协作 |
| 建议 | **采用** | 下个 Epic |

---

## 可行性评估

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端 CanvasSnapshot 表 | ✅ 就绪 | migration 0006 已存在 |
| 前端冲突状态 UI | ✅ 就绪 | SaveIndicator 已显示 conflict |
| 前端冲突捕获逻辑 | ✅ 就绪 | useAutoSave 捕获 409 |
| 后端 snapshots API | ❌ 缺失 | 需要新建 |
| 冲突 Dialog UI | ❌ 缺失 | 需要新建 |
| 版本轮询检测 | ❌ 缺失 | 需要实现 |
| 冲突解决后重保存 | ❌ 缺失 | 需要实现 |

**结论**：前端基础就绪，后端 API 和冲突解决 UI 需要新建。**方案 A 可行性 100%，建议实施。**

---

## 风险矩阵

| 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|------|------|------|------|---------|
| 轮询延迟导致冲突未及时检测 | 中 | 中 | 🟡 中 | 缩短轮询至 15s；显示"其他设备正在编辑"警告 |
| 冲突 Dialog 操作误选导致数据丢失 | 低 | 高 | 🟡 中 | 所有操作前增加"确认"提示；保留 conflict snapshot |
| 后端 snapshots API 性能问题 | 低 | 中 | 🟢 低 | 加索引；分页查询；只返回 metadata 不返回全量 data |
| 用户不理解冲突概念 | 中 | 中 | 🟡 中 | Dialog 内提供友好的中文化说明 + 截图示例 |
| 409 响应格式不匹配前端预期 | 低 | 高 | 🟢 低 | 统一使用 `{ conflict: true, serverVersion, snapshot }` 格式，写入 API 契约 |

---

## 验收标准

### 核心功能

- [ ] 后端 `POST /v1/canvas/snapshots` 支持 `version` 参数进行乐观锁
- [ ] 后端在 `version <= 当前最大版本` 时返回 409，body 包含 `serverSnapshot`
- [ ] 前端 `useAutoSave` 检测到 409 后设置 `saveStatus: 'conflict'`
- [ ] 前端 ConflictDialog 三个按钮（保留本地 / 保留服务器 / 取消）功能正常
- [ ] "保留服务器" 操作从 serverSnapshot 恢复三树状态
- [ ] "保留本地" 操作强制保存（version+1 重新 POST）
- [ ] 冲突解决后 `saveStatus` 恢复 `idle`，SaveIndicator 正常显示

### 体验增强

- [ ] 冲突 Dialog 有中文化说明，解释发生了什么
- [ ] 冲突状态下 SaveIndicator 显示 🔄 图标和"版本冲突"文字
- [ ] 版本轮询每 30s 检查一次最新 version（轻量 HEAD 请求）
- [ ] 页面刷新后冲突状态被正确恢复（无静默覆盖）

### 测试覆盖

- [ ] `useAutoSave` 冲突检测单元测试（mock 409 响应）
- [ ] ConflictDialog 三按钮交互测试
- [ ] 端到端测试：标签页A保存 → 标签页B触发冲突 → 解决

---

## 实施路线图

```
Phase 1: 后端 API 补全（2h）
  ├── POST /v1/canvas/snapshots（含 version 乐观锁 + 409）
  ├── GET  /v1/canvas/snapshots?projectId=xxx（列表）
  └── GET  /v1/canvas/snapshots/:id/restore（恢复）

Phase 2: 前端冲突 UI（2h）
  ├── ConflictDialog.tsx（三按钮组件）
  ├── useAutoSave 集成冲突 Dialog 触发
  └── SaveIndicator conflict 状态连接 Dialog

Phase 3: 轮询检测 + 集成测试（1h）
  ├── 轻量版本检测轮询（GET /latest-version 或复用 list）
  └── E2E 测试验证完整冲突流程

预计总工时: 5h
```

---

## 依赖关系

```
后端 snapshots API（Phase 1）
        ↓
前端冲突检测触发（Phase 2）
        ↓
ConflictDialog UI（Phase 2）
        ↓
轮询 + 集成测试（Phase 3）
```

> **注**：Phase 1 完成后前端可立即开始集成，无需等待其他依赖。
