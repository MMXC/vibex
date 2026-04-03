# SPEC-05: POST /api/projects/convert

> **草稿转正式项目** — 游客登录后关联数据

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/projects/convert` |
| **所属模块** | `Project` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

游客登录后，将 sessionId 的草稿项目转为正式用户项目，所有数据（domains、flow、uiNodes、stepState）一并转移。

---

## 接口定义

### 请求

**方法**: `POST`  
**路径**: `/api/projects/convert`  
**认证**: `Required`  
**Content-Type**: `application/json`

#### Request Body

```typescript
interface ConvertProjectRequest {
  draftId: string;     // required, 草稿项目 ID (sessionId as userId)
  userId: string;       // required, 真实 userId (from JWT)
  name?: string;        // optional, 覆盖草稿项目名称
}
```

---

## 响应

### 200 OK

```typescript
interface ConvertProjectResponse {
  success: true;
  data: {
    project: Project;
    draftId: string;
    convertedAt: string;  // ISO 8601
  };
}
```

### 错误

| HTTP Status | Code | 说明 |
|-------------|------|------|
| `400` | `VALIDATION_ERROR` | draftId 非 sessionId 格式 |
| `404` | `NOT_FOUND` | 草稿不存在 |
| `403` | `FORBIDDEN` | userId 与 JWT 不匹配 |
| `409` | `CONFLICT` | 草稿已被转换 |

---

## 示例

```bash
curl -X POST "https://api.vibex.top/api/projects/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "draftId": "proj_guest_abc123",
    "userId": "user_real_456",
    "name": "我的电商项目"
  }'
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| draftId 不存在 | 伪造 ID | `404` |
| draftId 非 sessionId | 传入普通 userId 的 project | `400` |
| 已转换 | 再次转换同一草稿 | `409` + `CONFLICT` |
| JWT 不匹配 | 伪造 userId | `403` |

---

## DB Transaction

```typescript
// 原子性转换
async function convertDraft(draftId: string, userId: string, name?: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. 验证草稿
    const draft = await tx.project.findUnique({ where: { id: draftId } });
    if (!draft) throw new ApiError('NOT_FOUND');
    if (!draft.userId.startsWith('sess_')) throw new ApiError('VALIDATION_ERROR', 'Not a draft');
    if (draft.status === 'converted') throw new ApiError('CONFLICT', 'Already converted');

    // 2. 创建正式项目
    const project = await tx.project.create({
      data: {
        name: name || draft.name,
        description: draft.description,
        userId,
        parentDraftId: draftId,
      },
    });

    // 3. 转移所有关联数据
    await tx.businessDomain.updateMany({ where: { projectId: draftId }, data: { projectId: project.id } });
    await tx.flowData.updateMany({ where: { projectId: draftId }, data: { projectId: project.id } });
    await tx.uINode.updateMany({ where: { projectId: draftId }, data: { projectId: project.id } });
    await tx.stepState.updateMany({ where: { projectId: draftId }, data: { projectId: project.id } });

    // 4. 标记草稿已转换
    await tx.project.update({
      where: { id: draftId },
      data: { status: 'converted', convertedTo: project.id, deletedAt: new Date() },
    });

    return project;
  });
}
```

---

## 测试用例

```typescript
describe('POST /api/projects/convert', () => {
  beforeEach(async () => {
    // 创建草稿
    await db.project.create({ data: { id: 'draft_1', name: '草稿', userId: 'sess_abc' } });
  });

  it('should convert draft to official project', async () => {
    const res = await api.post('/api/projects/convert', {
      draftId: 'draft_1',
      userId: 'user_1',
      name: '正式项目',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.project.userId).toBe('user_1');
    expect(res.data.data.project.name).toBe('正式项目');
  });

  it('should transfer all related data', async () => {
    // 创建关联数据
    await db.businessDomain.create({ data: { projectId: 'draft_1', name: '测试域' } });
    await db.uINode.create({ data: { projectId: 'draft_1', name: '登录页' } });

    await api.post('/api/projects/convert', { draftId: 'draft_1', userId: 'user_1' });

    // 查询转换后的数据
    const domains = await db.businessDomain.findMany({ where: { project: { userId: 'user_1' } } });
    expect(domains.length).toBeGreaterThan(0);
  });

  it('should mark draft as converted', async () => {
    await api.post('/api/projects/convert', { draftId: 'draft_1', userId: 'user_1' });
    const draft = await db.project.findUnique({ where: { id: 'draft_1' } });
    expect(draft.status).toBe('converted');
  });

  it('should return 409 on double convert', async () => {
    await api.post('/api/projects/convert', { draftId: 'draft_1', userId: 'user_1' });
    const res = await api.post('/api/projects/convert', { draftId: 'draft_1', userId: 'user_1' });
    expect(res.status).toBe(409);
    expect(res.data.code).toBe('CONFLICT');
  });

  it('should return 403 for non-draft project', async () => {
    await db.project.create({ data: { id: 'normal_1', name: '普通', userId: 'user_1' } });
    const res = await api.post('/api/projects/convert', { draftId: 'normal_1', userId: 'user_1' });
    expect(res.status).toBe(400);
  });
});
```

---

## 验证命令

```bash
# 1. 转换后数据完整性
curl -s -X POST "https://api.vibex.top/api/projects/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"draftId":"draft_1","userId":"user_1"}' | \
  jq '.data.project.id'

# 2. 验证草稿状态
curl -s "https://api.vibex.top/api/projects?id=draft_1" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.project.status'
# Expected: "converted"

# 3. 验证数据转移
curl -s "https://api.vibex.top/api/projects?id=$(NEW_PROJ_ID)&include=snapshot" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.domains | length'
# Expected: > 0
```

---

## 关联 Specs

- **前置**: `SPEC-03-project-snapshot.md`
- **被依赖**: 游客登录流程

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
