# SPEC-03: GET /api/projects — 完整快照 API

> **项目完整快照** — 一键拉取项目所有数据

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `GET /api/projects?id=&include=snapshot` |
| **所属模块** | `Project` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

一键拉取项目所有数据（domains、flow、uiNodes、stepState、history）。支持版本指定。**所有项目操作的核心数据源。**

---

## 接口定义

### 请求

**方法**: `GET`  
**路径**: `/api/projects`  
**认证**: `Required`

#### Query Parameters

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 项目 ID |
| `include` | `string` | 是 | 固定值: `snapshot` |
| `version` | `number` | 否 | 指定版本号，不传取最新 |

---

## 响应

### 200 OK

```typescript
interface GetProjectSnapshotResponse {
  success: true;
  data: ProjectSnapshot;
}

interface ProjectSnapshot {
  // 身份
  project: {
    id: string;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'converted' | 'archived';
    userId: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    isTemplate: boolean;
    parentDraftId?: string;
  };

  // 步骤状态
  stepState: {
    currentStep: 1 | 2 | 3;
    version: number;
    lastModified: string;
    lastModifiedBy: string;
    step1?: Step1Data | null;
    step2?: Step2Data | null;
    step3?: Step3Data | null;
  };

  // 业务领域
  domains: (BusinessDomain & { features: Feature[] })[];

  // 业务流程
  flow?: FlowData;

  // UI 节点
  uiNodes: UINode[];

  // 变更历史
  history: ChangeEntry[];

  // 元数据
  snapshotMeta: {
    totalDomains: number;
    totalFeatures: number;
    totalNodes: number;
    totalUINodes: number;
    checkedFeaturesCount: number;
    lastModified: string;
    historyCount: number;
  };
}

interface Step1Data {
  domainIds: string[];
  flowId?: string;
  uiNodeIds?: string[];
  checkedDomainIds: string[];
  checkedFeatureIds: Record<string, string[]>;
  generationTime: number;
  interruptedAt?: string;
  interruptedDomainId?: string;
  flowType: 'core_only' | 'core_with_supporting' | 'full';
}

interface Step2Data {
  uiNodeIds: string[];
  annotations: Record<string, UINodeAnnotation[]>;
  naturalLanguageInputs: string[];
}

interface Step3Data {
  status: 'pending' | 'queued' | 'generating' | 'done' | 'failed';
  queueId?: string;
  progress?: number;
  currentPage?: string;
  generatedPages: string[];
  failedPages: string[];
}

interface ChangeEntry {
  id: string;
  version: number;
  timestamp: string;
  source: 'user' | 'ai' | 'system' | 'rollback';
  action: 'create' | 'update' | 'delete' | 'rollback' | 'merge';
  field: string;
  before: unknown;
  after: unknown;
  userId?: string;
}

interface UINodeAnnotation {
  id: string;
  text: string;
  source: 'user_input' | 'ai_suggestion';
  timestamp: string;
  applied: boolean;
}

interface UINode {
  id: string;
  name: string;
  nodeType: 'page' | 'form' | 'list' | 'detail' | 'header' | 'footer' | 'modal' | 'navigation' | 'card';
  description?: string;
  linkedFlowNodeId?: string;
  children: UINode[];
  annotations: UINodeAnnotation[];
  positionX?: number;
  positionY?: number;
  checked: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'generated' | 'failed';
}
```

### 错误响应

| HTTP Status | Code | 说明 |
|-------------|------|------|
| `400` | `SNAPSHOT_NOT_FOUND` | 缺少 `include=snapshot` |
| `400` | `VERSION_NOT_FOUND` | 指定版本不存在 |
| `403` | `FORBIDDEN` | 无权访问 |
| `404` | `NOT_FOUND` | 项目不存在 |

---

## 示例

### curl 示例

```bash
# 获取完整快照
curl -X GET "https://api.vibex.top/api/projects?id=proj_abc&include=snapshot" \
  -H "Authorization: Bearer <token>"

# 获取指定版本快照
curl -X GET "https://api.vibex.top/api/projects?id=proj_abc&include=snapshot&version=5" \
  -H "Authorization: Bearer <token>"
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj_abc",
      "name": "我的电商项目",
      "status": "draft",
      "version": 7
    },
    "stepState": {
      "currentStep": 2,
      "version": 7,
      "step1": { "domainIds": ["bd_1", "bd_2"] },
      "step2": { "uiNodeIds": ["ui_1"] }
    },
    "domains": [
      {
        "id": "bd_1",
        "name": "用户管理",
        "domainType": "core",
        "features": [{ "id": "f1", "name": "登录", "checked": true }]
      }
    ],
    "flow": { "nodes": [], "edges": [] },
    "uiNodes": [{ "id": "ui_1", "name": "登录页", "nodeType": "page" }],
    "history": [
      { "version": 7, "source": "ai", "field": "step1.domains", "action": "create" }
    ],
    "snapshotMeta": {
      "totalDomains": 3,
      "totalFeatures": 12,
      "totalNodes": 8,
      "totalUINodes": 5,
      "historyCount": 47
    }
  }
}
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| 缺少 `include=snapshot` | `?id=proj_abc` | `400` + `SNAPSHOT_NOT_FOUND` |
| 缺少 `id` | `?include=snapshot` | `400` + `VALIDATION_ERROR` |
| 项目不存在 | `id=not_exist` | `404` + `NOT_FOUND` |
| 版本不存在 | `id=proj&version=999` | `404` + `VERSION_NOT_FOUND` + 可用版本列表 |
| 越权访问 | 其他用户的项目 | `403` |

---

## 测试用例

```typescript
describe('GET /api/projects (snapshot)', () => {
  it('should return complete snapshot', async () => {
    const res = await api.get('/api/projects?id=proj_abc&include=snapshot');
    expect(res.status).toBe(200);
    expect(res.data.data.project).toBeDefined();
    expect(res.data.data.domains).toBeInstanceOf(Array);
    expect(res.data.data.flow).toBeDefined();
    expect(res.data.data.stepState).toBeDefined();
    expect(res.data.data.history).toBeInstanceOf(Array);
    expect(res.data.data.snapshotMeta).toBeDefined();
  });

  it('should return 400 without include=snapshot', async () => {
    const res = await api.get('/api/projects?id=proj_abc');
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('SNAPSHOT_NOT_FOUND');
  });

  it('should return specific version', async () => {
    const res = await api.get('/api/projects?id=proj_abc&include=snapshot&version=3');
    expect(res.status).toBe(200);
    expect(res.data.data.project.version).toBe(3);
  });

  it('should return 404 for non-existent version', async () => {
    const res = await api.get('/api/projects?id=proj_abc&include=snapshot&version=999');
    expect(res.status).toBe(404);
    expect(res.data.code).toBe('VERSION_NOT_FOUND');
  });

  it('should return 403 for other user project', async () => {
    const res = await api.get('/api/projects?id=proj_other&include=snapshot');
    expect(res.status).toBe(403);
  });
});
```

---

## 验证命令

```bash
# 1. 完整快照
curl -s "https://api.vibex.top/api/projects?id=proj_abc&include=snapshot" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '{project: .data.project.id, domains: (.data.domains | length), nodes: (.data.flow.nodes | length), uiNodes: (.data.uiNodes | length), history: (.data.history | length)}'

# 2. 元数据校验
curl ... | jq '.data.snapshotMeta'
# Expected: { totalDomains, totalFeatures, totalNodes, totalUINodes, historyCount }

# 3. 历史分页验证
curl ... | jq '.data.history | length'
# Should be <= 50 (limit)

# 4. 版本校验
curl ... | jq '.data.project.version == .data.stepState.version'
# Should be true
```

---

## 关联 Specs

- **核心**: 所有其他 Spec 的数据都汇总到此
- **关联**: `SPEC-05-project-convert.md` (草稿转正式)
- **关联**: `SPEC-06-project-clone.md` (克隆)
- **关联**: `SPEC-07-project-rollback.md` (回滚)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
