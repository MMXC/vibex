# Epic E2 Spec: E4 Sync Protocol 冲突检测与解决

## 基本信息

| 字段 | 内容 |
|------|------|
| Epic ID | E2 |
| 名称 | E4 Sync Protocol 冲突检测与解决 |
| 优先级 | P1 |
| 状态 | 待开发 |
| 工时 | 5h |
| 对应提案 | D-001（Option A 推荐方案） |

## 背景

canvas-json-persistence Epic 1-3 已完成快照保存、版本化、自动保存功能，但 E4（Sync Protocol）因优先级被推迟。并发编辑场景下，多用户可能覆盖彼此的数据，需通过乐观锁 + 冲突 UI 解决。

## Story 列表

| 功能 ID | Story | 功能点 | 验收标准 | 页面集成 | 工时 | 依赖 |
|---------|-------|--------|----------|----------|------|------|
| E2-S1 | 后端 Snapshot API 增加 version 乐观锁检查 | `POST /v1/canvas/snapshots` 接收 `version` 字段，version 一致则保存，过时返回 409 Conflict | `expect(response.status).toBe(409)` when `localVersion < serverVersion` | 无 | 1.5h | 无 |
| E2-S2 | 前端 useAutoSave 携带 version 字段 | `useAutoSave` hook 在保存请求中携带当前 canvas version，发起条件保存 | `expect(savePayload).toHaveProperty('version')` | 无 | 1.5h | E2-S1 |
| E2-S3 | ConflictDialog 冲突解决 UI | 新建 ConflictDialog 组件，提供「保留本地」和「使用服务端」两个选项 | `expect(dialog.isVisible()).toBe(true)` on 409 response | 【需页面集成】 | 2h | E2-S1, E2-S2 |

## 验收标准（完整 expect 断言）

### E2-S1

```typescript
// version 一致 → 200 OK
const okResponse = await request('POST', '/v1/canvas/snapshots', {
  body: { canvasId: 'test-id', content: '...', version: 1 },
  localVersion: 1,
  serverVersion: 1
});
expect(okResponse.status).toBe(200);
expect(okResponse.body.version).toBe(2);

// version 过时 → 409 Conflict
const conflictResponse = await request('POST', '/v1/canvas/snapshots', {
  body: { canvasId: 'test-id', content: '...', version: 1 },
  localVersion: 1,
  serverVersion: 5
});
expect(conflictResponse.status).toBe(409);
expect(conflictResponse.body.code).toBe('VERSION_CONFLICT');
expect(conflictResponse.body.serverVersion).toBe(5);
expect(conflictResponse.body.serverContent).toBeDefined();

// version 领先 → 正常保存（正常编辑路径）
const aheadResponse = await request('POST', '/v1/canvas/snapshots', {
  localVersion: 10,
  serverVersion: 5
});
expect(aheadResponse.status).toBe(200);
```

### E2-S2

```typescript
// useAutoSave 每次保存携带 version
const saveRequests = [];
page.on('request', req => {
  if (req.url().includes('/v1/canvas/snapshots') && req.method() === 'POST') {
    saveRequests.push(JSON.parse(req.postData()));
  }
});

await canvas.fill('new content');
await page.waitForTimeout(1500); // 等待 debounce

expect(saveRequests.length).toBeGreaterThan(0);
saveRequests.forEach(req => {
  expect(req).toHaveProperty('version');
  expect(typeof req.version).toBe('number');
  expect(req.version).toBeGreaterThanOrEqual(0);
});

// version 在编辑后递增
const firstSave = saveRequests[0];
const secondSave = saveRequests[1];
expect(secondSave.version).toBeGreaterThan(firstSave.version);
```

### E2-S3

```typescript
// 模拟 409 冲突响应
await page.route('**/v1/canvas/snapshots', route => {
  route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({
    code: 'VERSION_CONFLICT',
    serverVersion: 5,
    serverContent: { steps: [] }
  })});
});

// 触发保存
await canvas.fill('local content');
await page.waitForTimeout(1500);

// ConflictDialog 显示
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();
await expect(dialog.getByText(/版本冲突/)).toBeVisible();

// 两个选项按钮存在
await expect(dialog.getByRole('button', { name: /保留本地/i })).toBeVisible();
await expect(dialog.getByRole('button', { name: /使用服务端/i })).toBeVisible();

// 点击「保留本地」→ 强制保存
await dialog.getByRole('button', { name: /保留本地/i }).click();
await expect(dialog).not.toBeVisible();
// 验证重新发送保存请求（携带 force: true）
const forceRequests = saveRequests.filter(r => r.force === true);
expect(forceRequests.length).toBeGreaterThan(0);

// 点击「使用服务端」→ 放弃本地
await canvas.fill('local content 2');
await page.waitForTimeout(1500);
await dialog.getByRole('button', { name: /使用服务端/i }).click();
await expect(dialog).not.toBeVisible();
// 验证 canvas 内容被服务端内容替换
await expect(canvas.textContent).not.toContain('local content 2');
```

## 技术规格

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/src/routes/canvas.ts` 或对应 snapshot handler | 修改 | 增加 version 乐观锁检查逻辑 |
| `frontend/src/hooks/useAutoSave.ts` | 修改 | 保存请求携带 version 字段 |
| `frontend/src/components/ConflictDialog.tsx` | 新增 | 冲突解决对话框组件 |
| `frontend/src/stores/canvasStore.ts` | 修改 | 处理冲突状态 |

### API 契约

```typescript
// POST /v1/canvas/snapshots
// Request Body
interface SnapshotRequest {
  canvasId: string;
  content: any;
  version: number;     // 本地 version
  force?: boolean;     // 可选，强制覆盖
}

// Response: 200 OK
interface SnapshotResponse {
  id: string;
  version: number;
  savedAt: string;
}

// Response: 409 Conflict
interface ConflictResponse {
  code: 'VERSION_CONFLICT';
  serverVersion: number;
  serverContent: any;
  savedAt: string;
}
```

### 约束

- 冲突时不得自动删除任何数据
- beacon 失败时需有 XHR fallback（见 NFR-2）
- ConflictDialog 必须无障碍（ARIA label）

## DoD

- [ ] 后端 `POST /v1/canvas/snapshots` 支持 version 字段并正确返回 409
- [ ] `useAutoSave` 携带 version 字段发送保存请求
- [ ] ConflictDialog 在 409 响应时显示，两个选项均可工作
- [ ] 版本冲突解决后版本号正确更新
- [ ] Playwright E2E 测试覆盖完整冲突流程
