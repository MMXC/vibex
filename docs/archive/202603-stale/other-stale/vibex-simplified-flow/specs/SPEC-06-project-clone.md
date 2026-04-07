# SPEC-06: POST /api/projects/clone

> **克隆项目 / 模板创建** — 从模板或草稿复制

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/projects/clone` |
| **所属模块** | `Project` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

将任意草稿或模板项目完整复制为新草稿。支持：游客克隆草稿、用户从模板市场克隆、创建新模板。

---

## 接口定义

**方法**: `POST`  
**路径**: `/api/projects/clone`  
**认证**: `Required`  
**Content-Type**: `application/json`

### Request Body

```typescript
interface CloneProjectRequest {
  sourceId: string;       // required, 源项目 ID
  userId: string;          // required, 所有者 userId
  sessionId?: string;     // optional, 游客 sessionId
  name?: string;          // optional, 新项目名称
  asTemplate?: boolean;   // optional, 标记为模板
}
```

### Response 200

```typescript
interface CloneProjectResponse {
  success: true;
  data: {
    project: Project;
    snapshot: ProjectSnapshot;  // 克隆的完整数据
    clonedAt: string;
    clonedFrom: {
      sourceId: string;
      sourceName: string;
      sourceVersion: number;
    };
  };
}
```

---

## 示例

```bash
# 从模板克隆
curl -X POST "https://api.vibex.top/api/projects/clone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sourceId": "proj_template_ecommerce",
    "userId": "user_123",
    "name": "我的电商项目",
    "asTemplate": false
  }'

# 游客从草稿克隆
curl -X POST "https://api.vibex.top/api/projects/clone" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: sess_xyz" \
  -d '{
    "sourceId": "proj_abc",
    "sessionId": "sess_xyz",
    "name": "我的新草稿"
  }'
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| sourceId 不存在 | 伪造 ID | `404` |
| 越权克隆 | 其他用户的私有项目 | `403` |
| asTemplate 但未登录 | `asTemplate: true` + sessionId | `403` + `TEMPLATE_REQUIRE_LOGIN` |
| 无 sessionId 也无 userId | — | `401` |

---

## DB Implementation

```typescript
async function cloneProject(req: CloneProjectRequest) {
  return await prisma.$transaction(async (tx) => {
    const source = await tx.project.findUnique({ where: { id: req.sourceId } });
    if (!source) throw new ApiError('NOT_FOUND');
    if (!canAccess(source, req.userId, req.sessionId)) throw new ApiError('FORBIDDEN');
    if (req.asTemplate && req.sessionId) throw new ApiError('TEMPLATE_REQUIRE_LOGIN');

    // 创建新项目
    const newProject = await tx.project.create({
      data: {
        name: req.name || `${source.name} (副本)`,
        userId: req.userId || req.sessionId!,
        status: 'draft',
        isTemplate: req.asTemplate || false,
        clonedFrom: req.sourceId,
      },
    });

    // 复制所有关联数据 (cuid 生成新 ID)
    const domains = await tx.businessDomain.findMany({ where: { projectId: req.sourceId } });
    const flow = await tx.flowData.findFirst({ where: { projectId: req.sourceId } });
    const uiNodes = await tx.uINode.findMany({ where: { projectId: req.sourceId } });
    const stepState = await tx.stepState.findUnique({ where: { projectId: req.sourceId } });

    if (domains.length) {
      await tx.businessDomain.createMany({
        data: domains.map(d => ({ ...d, id: cuid(), projectId: newProject.id })),
      });
    }
    if (flow) {
      await tx.flowData.create({ data: { ...flow, id: cuid(), projectId: newProject.id } });
    }
    if (uiNodes.length) {
      await tx.uINode.createMany({
        data: uiNodes.map(n => ({ ...n, id: cuid(), projectId: newProject.id })),
      });
    }
    if (stepState) {
      await tx.stepState.create({ data: { ...stepState, id: cuid(), projectId: newProject.id } });
    }

    return newProject;
  });
}
```

---

## 测试用例

```typescript
describe('POST /api/projects/clone', () => {
  it('should clone all data', async () => {
    // Setup: create project with domains, flow, uiNodes
    const sourceId = await setupProjectWithData();

    const res = await api.post('/api/projects/clone', {
      sourceId,
      userId: 'user_1',
      name: '克隆项目',
    });

    expect(res.status).toBe(200);
    const newId = res.data.data.project.id;
    expect(newId).not.toBe(sourceId);

    const snapshot = await api.get(`/api/projects?id=${newId}&include=snapshot`);
    expect(snapshot.data.data.domains.length).toBeGreaterThan(0);
    expect(snapshot.data.data.flow).toBeDefined();
  });

  it('should create independent copy (not reference)', async () => {
    const sourceId = await setupProjectWithData();
    const res = await api.post('/api/projects/clone', { sourceId, userId: 'user_1' });
    const newId = res.data.data.project.id;

    // 修改新项目
    await api.put(`/api/business-domain?id=${new_domain_id}`, { name: '修改后的名称' });

    // 源项目不变
    const sourceSnapshot = await api.get(`/api/projects?id=${sourceId}&include=snapshot`);
    expect(sourceSnapshot.data.data.domains[0].name).not.toBe('修改后的名称');
  });

  it('should return 403 when cloning private project', async () => {
    const res = await api.post('/api/projects/clone', {
      sourceId: 'private_project_other_user',
      userId: 'user_1',
    });
    expect(res.status).toBe(403);
  });
});
```

---

## 验证命令

```bash
# 1. 克隆完整性
NEW_ID=$(curl -s -X POST "https://api.vibex.top/api/projects/clone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sourceId":"proj_abc","userId":"user_1"}' | jq '.data.project.id')

curl -s "https://api.vibex.top/api/projects?id=$NEW_ID&include=snapshot" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '{domains: (.data.domains | length), nodes: (.data.flow.nodes | length), uiNodes: (.data.uiNodes | length)}'

# 2. 验证独立性 (修改新项目不影响源)
# Step 1: 克隆
# Step 2: 修改新项目的 domain name
# Step 3: 查询源项目 domain name 不变
```

---

## 关联 Specs

- **关联**: `SPEC-03-project-snapshot.md`
- **关联**: `SPEC-09-templates.md` (模板市场)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
