# Spec: E1 - E4 同步协议（Sync Protocol）

**Epic ID**: E1  
**Epic 名称**: E4 同步协议  
**优先级**: P0  
**预估工时**: 7h（E1-S1: 2h + E1-S2: 3h + E1-S3: 2h）  
**依赖**: Sprint 3 E1（统一数据模型）、E2（后端版本化存储）

---

## 1. Overview

实现多用户并发编辑的冲突检测与解决机制，闭合 canvas-json-persistence 最后一块拼图。

**核心流程**:
```
用户A 保存 (version=3) ──┐
                          ├──→ 后端检查: serverVersion=4 → 返回 HTTP 409
用户B 保存 (version=4) ──┘
                          └──→ 前端渲染 ConflictDialog
```

---

## 2. Story Specs

### E1-S1: 自动保存携带版本号

#### 功能点
- 修改 `useAutoSave` hook，在每次保存请求中携带 `version` 字段
- 后端 `snapshots.ts` 增加乐观锁检查

#### 技术规格

**前端** (`src/hooks/useAutoSave.ts`):
```typescript
interface SnapshotPayload {
  canvasId: string;
  json: string;
  timestamp: number;
  version: number; // 新增字段
}
```

**后端** (`server/routes/snapshots.ts`):
```typescript
// 乐观锁检查
if (localVersion < serverVersion) {
  return res.status(409).json({
    code: 'VERSION_CONFLICT',
    serverVersion,
    serverSnapshot: serverSnapshot.json
  });
}
```

#### 验收标准
```typescript
// POST 请求体包含 version
expect(snapshotPayload).toHaveProperty('version');
expect(typeof snapshotPayload.version).toBe('number');

// 版本冲突时返回 409
expect(serverResponse.status).toBe(409);
expect(serverResponse.body.code).toBe('VERSION_CONFLICT');
expect(serverResponse.body).toHaveProperty('serverVersion');
expect(serverResponse.body).toHaveProperty('serverSnapshot');
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `src/hooks/useAutoSave.ts` | 修改 |
| `server/routes/snapshots.ts` | 修改 |
| `server/prisma/schema.prisma` | 确认（version 字段已存在）|

---

### E1-S2: ConflictDialog 冲突解决 UI

#### 功能点
新建 `ConflictDialog` 组件，提供三个操作选项：
1. **Keep Local**: 强制推送本地版本（`version = serverVersion + 1`）
2. **Accept Server**: 放弃本地修改，接受服务端版本
3. **Merge**: 合并两份 canvas JSON（TODO: 实现细节待定）

#### 技术规格

**组件接口**:
```typescript
interface ConflictDialogProps {
  localSnapshot: CanvasSnapshot;
  serverSnapshot: CanvasSnapshot;
  onKeepLocal: () => void;
  onAcceptServer: () => void;
  onMerge: () => void;
  onClose: () => void;
}
```

**UI 布局**:
```
┌─────────────────────────────────────┐
│         ⚠️ 检测到版本冲突            │
├─────────────────────────────────────┤
│  [Local Preview]  [Server Preview]   │
│    Canvas JSON       Canvas JSON     │
├─────────────────────────────────────┤
│  [Keep Local] [Accept Server] [Merge]│
│      [× Close]                       │
└─────────────────────────────────────┘
```

#### 验收标准
```typescript
// 对话框渲染
expect(screen.getByText(/冲突检测/i)).toBeVisible();
expect(screen.getByRole('button', { name: 'Keep Local' })).toBeVisible();
expect(screen.getByRole('button', { name: 'Accept Server' })).toBeVisible();
expect(screen.getByRole('button', { name: 'Merge' })).toBeVisible();

// Keep Local: version 更新
await userEvent.click(screen.getByRole('button', { name: 'Keep Local' }));
expect(onKeepLocal).toHaveBeenCalledTimes(1);

// Accept Server: 接受服务端版本
await userEvent.click(screen.getByRole('button', { name: 'Accept Server' }));
expect(onAcceptServer).toHaveBeenCalledTimes(1);

// 版本号正确更新
const resolvedVersion = getLastSavedVersion();
expect(resolvedVersion).toBe(serverVersion + 1);
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `src/components/ConflictDialog/ConflictDialog.tsx` | 新建 |
| `src/components/ConflictDialog/ConflictDialog.module.css` | 新建 |
| `src/components/ConflictDialog/index.ts` | 新建 |
| `src/app/page.tsx` | 修改（集成）|

---

### E1-S3: 冲突场景 E2E 测试覆盖

#### 测试场景矩阵

| # | 测试文件 | 场景描述 | 预期结果 |
|---|---------|---------|---------|
| T1 | `conflict-no-conflict.spec.ts` | 单用户正常保存，无冲突 | 保存成功，version +1 |
| T2 | `conflict-409-handling.spec.ts` | 双用户版本冲突，触发 409 | 收到 409，渲染 ConflictDialog |
| T3 | `conflict-keep-local.spec.ts` | 选择 Keep Local | 本地版本推送成功 |
| T4 | `conflict-accept-server.spec.ts` | 选择 Accept Server | 服务端版本被接受 |

#### 验收标准
```typescript
// 4 个冲突测试场景全部通过
expect(conflictTests.filter(t => t.status === 'passed')).toHaveLength(4);
expect(playwrightExitCode).toBe(0);

// 每个场景独立可运行
conflictTests.forEach(test => {
  expect(test.status).toBeDefined();
});
```

#### 文件变更
| 文件 | 操作 |
|------|------|
| `tests/e2e/conflict-no-conflict.spec.ts` | 新建 |
| `tests/e2e/conflict-409-handling.spec.ts` | 新建 |
| `tests/e2e/conflict-keep-local.spec.ts` | 新建 |
| `tests/e2e/conflict-accept-server.spec.ts` | 新建 |

---

## 3. 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| E1-S1 后端 version 字段不存在 | 🟡 中 | Sprint 3 已完成 E2，确认 Prisma schema 有 version 字段 |
| E1-S2 Merge 功能实现复杂 | 🟡 中 | Phase 1 仅实现 Keep Local / Accept Server，Merge 标记 TODO |
| E1-S3 E2E 测试 flaky | 🟡 中 | 使用 `waitForSelector` 替代 `waitForTimeout` |

---

*Spec 由 PM Agent 生成于 2026-04-03*
