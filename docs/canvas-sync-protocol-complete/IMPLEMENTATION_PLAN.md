# Implementation Plan: canvas-sync-protocol-complete

**项目**: canvas-sync-protocol-complete
**版本**: v1.0
**日期**: 2026-04-03

---

## 开发阶段

### Phase 1: 后端 API（2h）

**工作目录**: `/root/.openclaw/vibex/vibex-backend/src/app/api/v1/canvas/snapshots/`

#### 步骤 1.1: POST /v1/canvas/snapshots（含乐观锁）

**文件**: `route.ts`（新建）

```typescript
// 核心逻辑伪代码
export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, version, contextNodes, flowNodes, componentNodes } = body;

  // 获取当前最大版本
  const maxVersion = await prisma.canvasSnapshot.findFirst({
    where: { projectId: projectId || null },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const currentMax = maxVersion?.version ?? 0;

  // 乐观锁检查
  if (version !== undefined && version <= currentMax) {
    // 获取服务器最新快照（用于返回给前端）
    const serverSnapshot = await prisma.canvasSnapshot.findFirst({
      where: { projectId: projectId || null },
      orderBy: { version: 'desc' },
    });

    return Response.json({
      success: false,
      conflict: true,
      serverVersion: currentMax,
      serverSnapshot: {
        id: serverSnapshot!.id,
        version: serverSnapshot!.version,
        data: serverSnapshot!.data,
        createdAt: serverSnapshot!.createdAt.toISOString(),
      },
    }, { status: 409 });
  }

  // 插入新快照（version = currentMax + 1）
  const snapshot = await prisma.canvasSnapshot.create({
    data: {
      projectId: projectId || null,
      version: currentMax + 1,
      label: body.label ?? '',
      data: { contextNodes, flowNodes, componentNodes },
      isAutoSave: body.trigger === 'auto',
    },
  });

  return Response.json({
    success: true,
    snapshot: {
      id: snapshot.id,
      version: snapshot.version,
      label: snapshot.label,
      createdAt: snapshot.createdAt.toISOString(),
    },
  });
}
```

#### 步骤 1.2: GET /v1/canvas/snapshots/latest

**文件**: `route.ts`（同文件，添加 `GET` handler）

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const latest = await prisma.canvasSnapshot.findFirst({
    where: { projectId: projectId || null },
    orderBy: { version: 'desc' },
    select: { version: true, createdAt: true },
  });

  return Response.json({
    success: true,
    latestVersion: latest?.version ?? 0,
    updatedAt: latest?.createdAt?.toISOString() ?? null,
  });
}
```

#### 步骤 1.3: GET /v1/canvas/snapshots

```typescript
// 列表接口（不带 data）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const snapshots = await prisma.canvasSnapshot.findMany({
    where: { projectId: projectId || null, isDeleted: false },
    orderBy: { version: 'desc' },
    select: {
      id: true, version: true, label: true, isAutoSave: true, createdAt: true,
      // 不 select data，减少传输
    },
  });

  return Response.json({ success: true, snapshots });
}
```

#### 步骤 1.4: GET /v1/canvas/snapshots/[id]

**文件**: `[id]/route.ts`（新建）

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshot = await prisma.canvasSnapshot.findUnique({ where: { id } });
  if (!snapshot) return Response.json({ success: false }, { status: 404 });

  return Response.json({
    success: true,
    snapshot: {
      id: snapshot.id,
      version: snapshot.version,
      label: snapshot.label,
      isAutoSave: snapshot.isAutoSave,
      createdAt: snapshot.createdAt.toISOString(),
      data: snapshot.data,
    },
  });
}
```

#### 步骤 1.5: POST /v1/canvas/snapshots/[id]/restore

**文件**: `[id]/restore/route.ts`（新建）

```typescript
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshot = await prisma.canvasSnapshot.findUnique({ where: { id } });
  if (!snapshot) return Response.json({ success: false }, { status: 404 });

  // 获取当前最大版本
  const maxVersion = await prisma.canvasSnapshot.findFirst({
    where: { projectId: snapshot.projectId || null },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const newVersion = (maxVersion?.version ?? 0) + 1;

  // 以新版本号重新保存（不修改原 snapshot）
  const restored = await prisma.canvasSnapshot.create({
    data: {
      projectId: snapshot.projectId,
      version: newVersion,
      label: `从快照 ${snapshot.version} 恢复`,
      data: snapshot.data,
      isAutoSave: false,
    },
  });

  return Response.json({ success: true, version: newVersion });
}
```

#### 步骤 1.6: 单元测试

**文件**: `route.test.ts`（新建）

覆盖：乐观锁成功、409 冲突、latest、restore 全部路径。

---

### Phase 2: 前端冲突 UI（2h）

#### 步骤 2.1: ConflictDialog.tsx

**文件**: `vibex-fronted/src/components/canvas/features/ConflictDialog.tsx`（新建）

```
状态设计:
- open: boolean（受控）
- serverSnapshot: { version, data }（来自 409 响应）
- onKeepLocal: () => void
- onKeepServer: () => void
- onCancel: () => void

UI:
- 模态遮罩
- 标题: "版本冲突检测"
- 说明文字（解释发生了什么）
- 三个按钮:
  1. "保留本地修改" (primary)
  2. "使用服务器版本" (secondary)
  3. "取消" (ghost)
```

#### 步骤 2.2: useAutoSave.ts 改动

**文件**: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`

新增：
1. `conflictData` state: 存储 409 响应中的 `serverSnapshot`
2. 版本轮询 `useEffect`（30s interval）:
   ```typescript
   useEffect(() => {
     if (!projectId) return;
     const interval = setInterval(async () => {
       const { latestVersion } = await canvasApi.getLatestVersion(projectId);
       if (latestVersion > lastSnapshotVersionRef.current) {
         setSaveStatus('conflict');
       }
     }, 30000);
     return () => clearInterval(interval);
   }, [projectId]);
   ```
3. 捕获 409 时存储 `serverSnapshot` 到 `conflictData`

#### 步骤 2.3: canvasApi.ts 改动

```typescript
// 新增方法
getLatestVersion: async (projectId: string) => {
  const res = await fetch(`/api/v1/canvas/snapshots/latest?projectId=${projectId}`);
  return res.json();
}
```

#### 步骤 2.4: SaveIndicator.tsx 改动

conflict 按钮点击 → 打开 ConflictDialog（传入 `conflictData`）。

#### 步骤 2.5: canvas/page.tsx 改动

挂载 ConflictDialog 组件，使用 `saveStatus` 和 `conflictData` 控制显隐。

---

### Phase 3: 集成 + E2E（1h）

#### E2E 测试文件: `tests/e2e/conflict-resolution.spec.ts`

完整流程见 architecture.md Testing Strategy 章节。

---

## 验收检查清单

- [x] POST snapshots 乐观锁成功（version > max → 200）
- [x] POST snapshots 冲突（version ≤ max → 409 + serverSnapshot）
- [x] GET snapshots/latest 返回轻量版本号
- [x] POST restore → 新版本快照创建成功
- [x] ConflictDialog 三按钮可见且可点击
- [x] "保留本地" 后 saveStatus 恢复 idle
- [x] "保留服务器" 后 canvasStore 三树数据被替换
- [x] 轮询 30s 检测到版本差异自动触发 conflict
- [ ] E2E 完整冲突解决流程通过

## E3 完成状态

- [x] Backend: GET /v1/canvas/snapshots/latest (line 403-429 in snapshots.ts)
- [x] Frontend: canvasApi.getLatestVersion() added to canvasApi.ts
- [x] Frontend: 30s interval polling in useAutoSave.ts
- [x] TypeScript: tsc --noEmit 0 errors
- [x] Git: commit 1546864f pushed to origin/main
