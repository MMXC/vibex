# SPEC-07: POST /api/projects — 回滚版本

> **版本回滚 (Copy-on-Write)** — 恢复到任意历史版本

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/projects?id=&action=rollback&version=` |
| **所属模块** | `Project` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

Copy-on-Write 回滚：不覆盖历史，创建一个新版本，内容恢复到指定历史版本。

---

## 接口定义

**方法**: `POST`  
**路径**: `/api/projects`  
**认证**: `Required`

#### Query Parameters

| 参数 | 值 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 项目 ID |
| `action` | `rollback` | 是 | 固定值 |
| `version` | `number` | 是 | 目标版本号 |

#### Request Body

```typescript
interface RollbackRequest {
  reason?: string;  // optional, 回滚原因 (记录到 changeLog)
}
```

### Response 200

```typescript
interface RollbackResponse {
  success: true;
  data: {
    project: Project;
    snapshot: ProjectSnapshot;  // 回滚后的快照
    rolledBackFrom: number;
    rolledBackTo: number;
    createdVersion: number;     // 新版本号 = rolledBackTo + 1
    rollbackedAt: string;
  };
}
```

### 错误

| HTTP Status | Code | 说明 |
|-------------|------|------|
| `400` | `VALIDATION_ERROR` | version 无效或缺失 |
| `400` | `ALREADY_AT_VERSION` | 已是目标版本 |
| `404` | `VERSION_NOT_FOUND` | 版本不存在 |
| `403` | `FORBIDDEN` | 无权操作 |

---

## 示例

```bash
# 回滚到版本 5
curl -X POST "https://api.vibex.top/api/projects?id=proj_abc&action=rollback&version=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "reason": "误操作恢复" }'
```

---

## 实现逻辑

```typescript
async function rollback(projectId: string, targetVersion: number, reason?: string) {
  return await prisma.$transaction(async (tx) => {
    const currentState = await tx.stepState.findUnique({ where: { projectId } });
    const currentVersion = currentState?.version || 0;

    if (targetVersion >= currentVersion) throw new ApiError('ALREADY_AT_VERSION');

    // 获取目标版本的历史数据
    const targetData = await getHistoricalState(tx, projectId, targetVersion);
    if (!targetData) throw new ApiError('VERSION_NOT_FOUND');

    // 创建新版本 (Copy-on-Write)
    const newVersion = currentVersion + 1;
    await tx.stepState.update({
      where: { projectId },
      data: {
        version: newVersion,
        lastModifiedBy: getCurrentUserId(),
        ...targetData,
        changeLog: {
          push: {
            id: cuid(),
            version: newVersion,
            timestamp: new Date().toISOString(),
            source: 'system',
            action: 'rollback',
            field: 'all',
            before: currentVersion,
            after: { targetVersion, newVersion },
            userId: getCurrentUserId(),
            metadata: { reason },
          },
        },
      },
    });

    return { rolledBackFrom: currentVersion, rolledBackTo: targetVersion, createdVersion: newVersion };
  });
}
```

---

## 测试用例

```typescript
describe('POST /api/projects (rollback)', () => {
  beforeEach(async () => {
    await saveStepState('proj_1', { version: 1, domains: [] });
    await saveStepState('proj_1', { version: 2, domains: [d1] });
    await saveStepState('proj_1', { version: 3, domains: [d1, d2] });
  });

  it('should rollback to target version', async () => {
    const res = await api.post('/api/projects?id=proj_1&action=rollback&version=2', {
      reason: 'test',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.rolledBackFrom).toBe(3);
    expect(res.data.data.createdVersion).toBe(4);
    expect(res.data.data.snapshot.stepState.version).toBe(4);
  });

  it('should not modify history (copy-on-write)', async () => {
    await api.post('/api/projects?id=proj_1&action=rollback&version=2', {});
    // 历史数据仍然完整
    const history = await api.get('/api/projects?id=proj_1&include=history');
    expect(history.data.data.entries.length).toBeGreaterThan(3);
  });

  it('should return 400 when already at target version', async () => {
    const res = await api.post('/api/projects?id=proj_1&action=rollback&version=4');
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('ALREADY_AT_VERSION');
  });

  it('should return 404 for non-existent version', async () => {
    const res = await api.post('/api/projects?id=proj_1&action=rollback&version=999');
    expect(res.status).toBe(404);
    expect(res.data.code).toBe('VERSION_NOT_FOUND');
  });
});
```

---

## 验证命令

```bash
# 回滚到版本 3
curl -s -X POST "https://api.vibex.top/api/projects?id=proj_abc&action=rollback&version=3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason":"test"}' | \
  jq '{from: .data.rolledBackFrom, to: .data.rolledBackTo, newVersion: .data.createdVersion}'

# 验证历史完整性
curl -s "https://api.vibex.top/api/projects?id=proj_abc&include=history" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '[.data.entries[] | {version, action}]'
```

---

## 关联 Specs

- **依赖**: `SPEC-03-project-snapshot.md`
- **关联**: `SPEC-04-step-state.md`

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
