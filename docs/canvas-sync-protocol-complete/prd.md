# PRD: VibeX Canvas E4 同步协议 — 冲突检测与解决

**项目**: canvas-sync-protocol-complete
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告
**背景**: canvas-json-persistence Epic E4 缺失，前端已就绪（SaveIndicator conflict 状态 + useAutoSave 409 捕获），后端 API 和冲突解决 UI 需新建。

---

## 1. 执行摘要

### 背景
canvas-json-persistence Epic 前三个 Sprint 已完成（数据模型 + 版本化存储 + 自动保存），但 E4 同步协议缺失。前端已具备冲突 UI 基础（SaveIndicator conflict 状态 + useAutoSave 409 捕获），后端 `/v1/canvas/snapshots` API 和 ConflictDialog 组件需新建。

### 目标
完成后端 snapshots REST API（含乐观锁 + 409 冲突响应），集成前端 ConflictDialog，实现单用户多标签页和多设备场景下的冲突检测与解决。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| 后端 snapshots API 覆盖 | 0% | 100% |
| 冲突检测响应时间 | N/A | < 30s（轮询间隔） |
| 冲突解决成功率 | 0% | > 90% |
| 409 场景 E2E 覆盖 | 0% | 100% |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | 后端 Snapshots API | P0 | 3h | 无 |
| E2 | 前端冲突 UI | P0 | 2h | E1 |
| E3 | 轮询检测 + 集成 | P0 | 1h | E1 |
| E4 | 测试覆盖 | P1 | 1h | E2+E3 |

**总工时**: 7h

---

### Epic 1: 后端 Snapshots API（P0）

#### 概述
实现 `POST /v1/canvas/snapshots`（含 version 乐观锁）和 `GET /v1/canvas/snapshots`，返回 409 冲突响应。

#### Stories

**S1.1: POST snapshots 含乐观锁**
| 字段 | 内容 |
|------|------|
| Story | 作为后端，我需要在保存时校验 version，防止数据覆盖 |
| 功能点 | `POST /v1/canvas/snapshots` — version > 当前最大版本 → 插入成功；version ≤ 当前 → 409 |
| 验收标准 | `expect(await POST({projectId, data, version: 5})).resolves.toMatchObject({status:200})` + `expect(await POST({projectId, data, version: 1})).resolves.toMatchObject({status:409})` |
| 页面集成 | 无 |
| 工时 | 1.5h |
| 依赖 | 无 |

**S1.2: GET snapshots 列表**
| 字段 | 内容 |
|------|------|
| Story | 作为前端，我需要获取项目的快照列表 |
| 功能点 | `GET /v1/canvas/snapshots?projectId=xxx` 返回快照列表（不含全量 data）|
| 验收标准 | `expect(response.snapshots).toBeInstanceOf(Array)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | 无 |

**S1.3: 409 响应体标准化**
| 字段 | 内容 |
|------|------|
| Story | 作为前端，我需要 409 响应包含 serverSnapshot 和 serverVersion |
| 功能点 | 冲突响应：`{ conflict: true, serverVersion, serverSnapshot }` |
| 验收标准 | `expect(conflictResponse).toMatchObject({conflict:true, serverVersion:expect.any(Number), serverSnapshot:expect.any(Object)})` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S1.1 |

**S1.4: Restore API**
| 字段 | 内容 |
|------|------|
| Story | 作为前端，我需要在用户选择"保留服务器"时恢复快照 |
| 功能点 | `POST /v1/canvas/snapshots/:id/restore` — 恢复指定快照到 canvas |
| 验收标准 | `expect(await restore(snapshotId)).resolves.toMatchObject({status:200})` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S1.1 |

#### DoD
- POST snapshots 含乐观锁，version 过期返回 409
- 409 响应体包含 serverSnapshot + serverVersion
- GET snapshots 返回列表
- Restore API 可恢复指定快照

---

### Epic 2: 前端冲突 UI（P0）

#### 概述
实现 ConflictDialog 组件，集成 useAutoSave 的冲突触发，覆盖三种解决路径。

#### Stories

**S2.1: ConflictDialog 组件**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望看到友好的冲突解决界面 |
| 功能点 | ConflictDialog：三按钮（保留本地 / 保留服务器 / 取消）+ 中文化说明 |
| 验收标准 | `expect(screen.getByText('保留本地')).toBeVisible()` + `expect(screen.getByText('保留服务器')).toBeVisible()` |
| 页面集成 | 【需页面集成】CanvasPage |
| 工时 | 1h |
| 依赖 | E1 |

**S2.2: 保留本地逻辑**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我选择保留本地修改后，希望强制覆盖服务器版本 |
| 功能点 | POST snapshots 时 version 传 serverVersion + 1（强制覆盖）|
| 验收标准 | `expect(await resolve('keep-local')).resolves.toMatchObject({status:200})` + `expect(saveStatus).toBe('idle')` |
| 页面集成 | 【需页面集成】ConflictDialog |
| 工时 | 0.5h |
| 依赖 | S2.1 |

**S2.3: 保留服务器逻辑**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我选择保留服务器版本后，希望三树状态被恢复 |
| 功能点 | 调用 restore API，用 serverSnapshot 替换 canvasStore 三树数据 |
| 验收标准 | `expect(await resolve('keep-server')).resolves.toMatchObject({status:200})` + `expect(contextNodes).toEqual(serverSnapshot.contexts)` |
| 页面集成 | 【需页面集成】canvasStore |
| 工时 | 0.5h |
| 依赖 | S2.1 |

#### DoD
- ConflictDialog 三个按钮功能正常
- 保留本地 → 强制覆盖，saveStatus 恢复 idle
- 保留服务器 → 三树数据恢复，dialog 关闭

---

### Epic 3: 轮询检测与集成（P0）

#### 概述
实现轻量版本轮询检测，使前端能发现冲突（轮询间隔 30s）。

#### Stories

**S3.1: 轻量版本检测**
| 字段 | 内容 |
|------|------|
| Story | 作为前端，我希望每 30s 检测一次是否有新版本 |
| 功能点 | useAutoSave 中新增轮询：`GET /v1/canvas/snapshots/latest?projectId=xxx`（只返回最新 version）|
| 验收标准 | `expect(pollInterval).toBe(30000)` + `expect(localVersion < serverVersion → saveStatus='conflict')` |
| 页面集成 | 【需页面集成】useAutoSave |
| 工时 | 0.5h |
| 依赖 | E1 |

**S3.2: useAutoSave 集成冲突 Dialog**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望 saveStatus 为 conflict 时自动打开 ConflictDialog |
| 功能点 | `useEffect` 监听 `saveStatus === 'conflict'`，触发 dialog 打开 |
| 验收标准 | `expect(saveStatus).toBe('conflict')` → `expect(conflictDialog).toBeVisible()` |
| 页面集成 | 【需页面集成】SaveIndicator |
| 工时 | 0.5h |
| 依赖 | S2.1 |

#### DoD
- 轮询间隔 30s，检测到版本差异设置 conflict 状态
- ConflictDialog 自动打开

---

### Epic 4: 测试覆盖（P1）

#### 概述
为冲突检测和解决流程建立完整的测试覆盖。

#### Stories

**S4.1: useAutoSave 冲突单元测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我希望冲突检测有单元测试验证 |
| 功能点 | mock 409 响应，验证 saveStatus 变为 'conflict' |
| 验收标准 | `expect(mockSaveStatus).toBe('conflict')` when server returns 409 |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E1 |

**S4.2: ConflictDialog E2E 测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我希望端到端验证冲突解决完整流程 |
| 功能点 | `conflict-resolution.spec.ts`：标签页 A 保存 → 标签页 B 触发冲突 → 解决 |
| 验收标准 | `expect(continuous3Runs.every(r => r.status === 'passed')).toBe(true)` |
| 页面集成 | 【需页面集成】CanvasPage |
| 工时 | 0.5h |
| 依赖 | E2+E3 |

#### DoD
- 冲突检测单元测试覆盖 409 场景
- E2E 测试覆盖完整冲突解决流程

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | 乐观锁 | `version过期→409, version最新→200` |
| E1 | S1.2 | GET 列表 | `snapshots is Array` |
| E1 | S1.3 | 409 响应 | `{conflict:true, serverVersion, serverSnapshot}` |
| E1 | S1.4 | Restore | `restore → 200` |
| E2 | S2.1 | ConflictDialog | `三按钮可见` |
| E2 | S2.2 | 保留本地 | `keep-local → 200 + idle` |
| E2 | S2.3 | 保留服务器 | `keep-server → 200 + 数据恢复` |
| E3 | S3.1 | 轮询 | `poll 30s + conflict 检测` |
| E3 | S3.2 | Dialog 打开 | `conflict → dialog visible` |
| E4 | S4.1 | 单元测试 | `409 → conflict status` |
| E4 | S4.2 | E2E | `3 consecutive passes` |

**合计**: 4 Epic，11 Story，24 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Phase 1 Day 1 | E1 后端 API | 3h | snapshots API 就绪 |
| Phase 1 Day 2 | E2 前端冲突 UI | 2h | ConflictDialog 完成 |
| Phase 1 Day 3 | E3 轮询集成 | 1h | 冲突检测生效 |
| Phase 2 Day 1 | E4 测试覆盖 | 1h | 测试通过 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 轮询 overhead < 50ms/次 |
| 可靠性 | 冲突解决后无静默数据丢失 |
| 兼容性 | 支持 Chrome / Firefox |

---

## 6. 实施约束

- 后端 API 路径：`/v1/canvas/snapshots`
- 轮询间隔：30s（避免过多请求）
- 冲突响应体：`{ conflict: true, serverVersion, serverSnapshot }`
- ConflictDialog 优先中文界面
- 乐观锁版本比较：`<=` 即冲突（严格小于等于）
