# Epic 4: project-snapshot API 合约测试

**Epic ID**: E4
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P1
**工时**: 1h
**关联 Features**: F6
**关联 T-P1-2**: project-snapshot.ts TODO 修复无 API 合约测试

---

## 1. Story: E4-S1 — project-snapshot API 合约测试

### 上下文

dev/20260411 提案修复 `project-snapshot.ts` 中 5 个返回假数据的 TODO，改为查询真实数据库表。但 `/api/projects/:id/snapshots` 接口**没有合约测试**验证响应 schema。修复后 schema 可能变化，合约测试可提前发现问题。

### 测试文件位置

`vibex-fronted/tests/contract/project-snapshot.contract.spec.ts`

### 测试内容

#### 测试 1: GET /api/projects/:id/snapshots 返回有效快照数组

验证端点返回 200，响应为数组，每项包含必要字段。

```ts
test('GET /api/projects/:id/snapshots returns 200 with valid snapshot array', async ({
  request,
}) => {
  // 创建测试项目（如果有 setup hook）
  const projectId = 'test-project-id-for-contract';

  const response = await request.get(`/api/projects/${projectId}/snapshots`, {
    headers: {
      Authorization: `Bearer ${process.env.TEST_API_TOKEN || 'test-token'}`,
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});
```

#### 测试 2: 快照对象包含必需字段

验证响应 schema 的每个快照对象包含 `id`, `createdAt`, `data` 字段。

```ts
test('each snapshot object contains required fields', async ({ request }) => {
  const projectId = 'test-project-id-for-contract';
  const response = await request.get(`/api/projects/${projectId}/snapshots`);
  const body = await response.json();

  if (body.length === 0) {
    // 如果是空数组，跳过字段验证
    return;
  }

  for (const snapshot of body) {
    expect(snapshot).toHaveProperty('id');
    expect(snapshot).toHaveProperty('createdAt');
    expect(snapshot).toHaveProperty('data');

    // 验证字段类型
    expect(typeof snapshot.id).toBe('string');
    expect(snapshot.id.length).toBeGreaterThan(0);

    // createdAt 应为 ISO 8601 时间格式
    expect(new Date(snapshot.createdAt).toString()).not.toBe('Invalid Date');

    // data 应为 object（快照数据）
    expect(typeof snapshot.data).toBe('object');
  }
});
```

#### 测试 3: 快照数组按 createdAt 降序排列

验证快照按时间倒序返回（最新的在前）。

```ts
test('snapshots are sorted by createdAt in descending order', async ({ request }) => {
  const projectId = 'test-project-id-for-contract';
  const response = await request.get(`/api/projects/${projectId}/snapshots`);
  const body = await response.json();

  if (body.length < 2) {
    return; // 需要至少 2 个快照才能验证排序
  }

  for (let i = 0; i < body.length - 1; i++) {
    const current = new Date(body[i].createdAt);
    const next = new Date(body[i + 1].createdAt);
    expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
  }
});
```

#### 测试 4: 404 场景 — 项目不存在

```ts
test('GET /api/projects/:nonexistent-id/snapshots returns 404', async ({ request }) => {
  const response = await request.get('/api/projects/nonexistent-id/snapshots');
  // 根据实际 API 设计，可能是 404 或 200 + 空数组
  // 预期：404 Not Found 或 200 + []
  expect([200, 404]).toContain(response.status());
});
```

#### 测试 5: snapshot.data 包含必要的子字段（可选）

```ts
test('snapshot.data contains essential subfields', async ({ request }) => {
  const projectId = 'test-project-id-for-contract';
  const response = await request.get(`/api/projects/${projectId}/snapshots`);
  const body = await response.json();

  if (body.length === 0) return;

  const snapshot = body[0];
  // data 应包含实际快照内容（根据实际 schema 调整）
  // 以下为示例字段，实际需对照 project-snapshot.ts 实现
  expect(snapshot.data).toBeDefined();

  // 如果有 elements/canvas 数据，验证类型
  if ('elements' in snapshot.data) {
    expect(Array.isArray(snapshot.data.elements)).toBe(true);
  }
});
```

### API Endpoint 信息

| 项目 | 值 |
|------|-----|
| Method | GET |
| Path | `/api/projects/:id/snapshots` |
| Auth | Bearer token |
| Success Response | 200, `Snapshot[]` |
| Error Response | 404 (项目不存在) |

### 验收标准

```ts
// 验收 1: 测试文件存在
const specExists = existsSync('tests/contract/project-snapshot.contract.spec.ts');
expect(specExists).toBe(true);

// 验收 2: Playwright 能发现测试
const listResult = execSync(
  'npx playwright test project-snapshot.contract.spec.ts --list 2>&1',
  { cwd: 'vibex-fronted' }
).toString();
expect(listResult).not.toContain('0 tests');

// 验收 3: 测试在 CI 中通过（假设 API 已在 dev/20260411 修复）
const ciResult = execSync(
  'CI=true npx playwright test project-snapshot.contract.spec.ts --reporter=line 2>&1',
  { cwd: 'vibex-fronted', timeout: 60000 }
).toString();
expect(ciResult).toContain('passed');
```

### 依赖

- Backend API server 运行（可在 CI 中用 `pnpm run dev` 或独立 server）
- 测试 token/auth 配置（`TEST_API_TOKEN` env var）
- Playwright contract 测试配置正确（`tests/contract/` 在 `testMatch` 中）
- `project-snapshot.ts` 的 TODO 已在 dev/20260411 修复（否则返回假数据）
