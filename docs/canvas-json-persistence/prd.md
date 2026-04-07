# PRD: Canvas JSON 前后端统一 + 版本化 + 自动保存

**项目**: canvas-json-persistence
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
当前 Canvas 数据仅存 localStorage，换设备丢失；无版本历史，无法回滚；三树字段不统一。

### 目标
统一三树节点数据结构，后端存储版本化，支持自动保存跨会话持久化。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| 数据持久化 | 仅 localStorage | 后端存储 |
| 版本历史 | 无 | 可回滚 |
| 自动保存 | 无 | 2s debounce |
| 数据一致性 | 三树各异 | 统一 NodeState |

---

## Epic 拆分

### Epic 1: 统一数据模型
**工时**: 3-4h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | NodeState 接口统一 | 1h | expect(NodeStateShared).toBe(true) |
| E1-S2 | Migration 3→4 修复 | 1h | expect(migration34Pass).toBe(true) |
| E1-S3 | selected 字段明确 | 1h | expect(selectedFieldDefined).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | NodeState 共享 | 三树节点类型共享统一 NodeState | expect(NodeStateShared).toBe(true) | ❌ |
| F1.2 | Migration 3→4 | status 映射修复 | expect(migration34Pass).toBe(true) | ❌ |
| F1.3 | selected 字段 | 明确 selected 字段语义 | expect(selectedFieldDefined).toBe(true) | ❌ |

---

### Epic 2: 后端版本化存储
**工时**: 6-8h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | CanvasSnapshot Model | 2h | expect(CanvasSnapshotModel).toBeDefined() |
| E2-S2 | 版本列表 API | 2h | expect(snapshotsAPIWorks).toBe(true) |
| E2-S3 | 回滚 API | 2h | expect(rollbackAPIWorks).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Prisma Model | CanvasSnapshot 含 version/timestamp/data | expect(CanvasSnapshotModel).toBeDefined() | ❌ |
| F2.2 | GET snapshots | `GET /api/canvas/{projectId}/snapshots` | expect(snapshotsList).toBeArray() | ❌ |
| F2.3 | POST rollback | `POST /api/canvas/{projectId}/rollback` | expect(rollbackWorks).toBe(true) | ✅ |
| F2.4 | Prisma migration | `npx prisma migrate dev` | expect(migrationSuccess).toBe(true) | ❌ |

---

### Epic 3: 自动保存
**工时**: 4-6h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | Debounce 保存 | 2h | expect(debounce2s).toBe(true) |
| E3-S2 | 视觉反馈 | 1h | expect(saveIndicator).toBe(true) |
| E3-S3 | beacon 保存 | 1h | expect(beaconSave).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | Debounce 2s | 编辑后 2s 内触发保存 | expect(debounceWorks).toBe(true) | ❌ |
| F3.2 | 保存指示器 | 状态栏显示保存中/已保存 | expect(saveIndicatorVisible).toBe(true) | ✅ |
| F3.3 | Page unload beacon | 页面关闭时 beacon 保存 | expect(beaconSave).toBe(true) | ❌ |

---

### Epic 4: 同步协议
**工时**: 3-4h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 冲突检测 | 1h | expect(conflictDetection).toBe(true) |
| E4-S2 | 版本号比较 | 2h | expect(versionCompare).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 冲突检测 | 检测服务端版本与本地版本差异 | expect(conflictDetected).toBe(true) | ✅ |
| F4.2 | 冲突提示 UI | 冲突时提示用户选择保留版本 | expect(conflictUI).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 统一数据模型 | 3-4h | P0 |
| E2 | 后端版本化存储 | 6-8h | P0 |
| E3 | 自动保存 | 4-6h | P0 |
| E4 | 同步协议 | 3-4h | P1 |
| **总计** | | **16-22h** | |

---

## Sprint 排期建议

| Sprint | Epic | 工时 | 依赖 |
|--------|------|------|------|
| Sprint 1 | E1 | 3-4h | 无 |
| Sprint 2 | E2 | 6-8h | E1 |
| Sprint 3 | E3 | 4-6h | E2 |
| Sprint 4 | E4 | 3-4h | E3 |

---

## DoD

### E1: 统一数据模型
- [ ] NodeState 接口三树共享
- [ ] Migration 3→4 测试通过
- [ ] selected 字段语义明确

### E2: 后端版本化存储
- [ ] CanvasSnapshot Model 定义
- [ ] GET snapshots API 工作
- [ ] POST rollback API 工作
- [ ] Prisma migration 成功

### E3: 自动保存
- [ ] Debounce 2s 保存
- [ ] 状态栏视觉反馈
- [ ] Page unload beacon 保存

### E4: 同步协议
- [ ] 冲突检测逻辑
- [ ] 冲突提示 UI

---

## 验收标准（expect() 断言汇总）

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 三树节点 | 渲染 | 共享 NodeState |
| E1-AC2 | Migration 3→4 | 执行 | 测试通过 |
| E2-AC1 | GET snapshots | API 调用 | 返回版本列表 |
| E2-AC2 | POST rollback | API 调用 | 数据回滚成功 |
| E3-AC1 | 编辑完成 | 2s 后 | 触发保存 |
| E3-AC2 | 保存中 | 状态栏 | 显示指示器 |
| E3-AC3 | 页面关闭 | beforeunload | beacon 发送 |
| E4-AC1 | 版本冲突 | 检测 | 提示 UI 显示 |
