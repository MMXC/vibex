# SPEC-02: POST /api/flow/generate

> **业务流程流式生成 API** — 简化流程 Step 1-B

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/flow/generate` |
| **所属模块** | `Flow` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |
| **最后更新** | `2026-03-23` |

---

## 功能说明

基于已保存的 BusinessDomain，流式生成业务流程图（ReactFlow 格式）。支持 Feature 过滤：只生成勾选领域的流程。

---

## 接口定义

### 请求

**方法**: `POST`  
**路径**: `/api/flow/generate`  
**认证**: `Required`  
**Content-Type**: `application/json`  
**流式**: `SSE`

#### Request Body

```typescript
interface GenerateFlowRequest {
  projectId?: string;        // optional
  domainIds: string[];       // required, 用户勾选要生成流程的 domain IDs
  requirement: string;       // required, 原始需求（用于 prompt 增强）
  userId: string;            // required
  language?: 'zh' | 'en';  // default 'zh'
  flowType?: 'core_only' | 'core_with_supporting' | 'full'; // default 'core_only'
}
```

---

## 响应

### 流式 SSE Events

```
event: start
data: { "type": "start", "domainCount": 3, "requirement": "...", "timestamp": "..." }

event: thinking
data: { "type": "thinking", "content": "根据已分析的核心域：用户管理、商品管理，构建业务流程..." }

event: node
data: { "type": "node", "node": { "id": "n1", "name": "用户登录", "type": "process", "position": { "x": 100, "y": 200 }, "domainId": "bd_001" }, "domainId": "bd_001" }

event: edge
data: { "type": "edge", "edge": { "id": "e1", "source": "n1", "target": "n2", "label": "登录成功" } }

event: node
data: { "type": "node", "node": { "id": "n2", "name": "商品浏览", "type": "process", "domainId": "bd_002" }, "domainId": "bd_002" }

event: done
data: { "type": "done", "flow": { "id": "flow_abc", "name": "业务流程", "nodes": [...], "edges": [...] }, "generationTime": 2100, "savedAt": "..." }

event: error
data: { "type": "error", "error": "...", "code": "GENERATION_ERROR" }
```

### FlowData 实体定义

```typescript
interface FlowData {
  id: string;
  name?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface FlowNode {
  id: string;
  name: string;
  type: 'start' | 'end' | 'process' | 'decision';
  domainId?: string;         // 关联的 BusinessDomain ID
  position: { x: number; y: number };
  description?: string;
  checked: boolean;
  editable: boolean;          // 用户是否可编辑
}

interface FlowEdge {
  id: string;
  source: string;             // source node ID
  target: string;             // target node ID
  label?: string;
  animated: boolean;
  checked: boolean;
}
```

---

## 示例

### curl 示例

```bash
# 基于勾选的 domains 生成流程
curl -X POST "https://api.vibex.top/api/flow/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "projectId": "proj_abc",
    "domainIds": ["bd_001", "bd_002"],
    "requirement": "用户可以登录、浏览商品、下单、支付",
    "userId": "user_123",
    "flowType": "core_only"
  }' --no-buffer
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| domainIds 为空 | `domainIds: []` | `400` + `{ error: "domainIds required" }` |
| domainId 不存在 | `domainIds: ["bd_not_exist"]` | `404` |
| domainId 越权 | 其他用户的 domainId | `403` |
| requirement 为空 | `requirement: ""` | `400` |
| AI 超时 | — | SSE: `error` event + `GENERATION_ERROR` |

---

## AI Prompt

```typescript
const FLOW_GENERATION_PROMPT = `你是一个业务流程建模专家。

业务领域（已分析）:
{domains_json}

用户原始需求:
{requirement}

请基于以上业务领域，生成业务流程图。

要求：
1. 每个领域生成对应的流程节点
2. 节点类型: start(开始), end(结束), process(处理), decision(判断)
3. 用边连接节点，表示流程走向
4. 在边上标注条件或结果
5. 节点名称使用业务语言（如"处理订单"而非"OrderService.process"）

输出格式（JSON）:
{
  "nodes": [
    { "id": "n1", "name": "节点名称", "type": "start|process|decision|end", "domainId": "bd_xxx", "position": { "x": 0, "y": 0 } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "label": "条件/结果" }
  ]
}

请直接输出 JSON。`;
```

---

## 测试用例

```typescript
describe('POST /api/flow/generate', () => {
  it('should return 400 when domainIds is empty', async () => {
    const res = await api.post('/api/flow/generate', {
      domainIds: [],
      requirement: '登录系统',
      userId: 'u1',
    });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('VALIDATION_ERROR');
  });

  it('should only generate flow for checked domains', async () => {
    const events = [];
    const stream = await api.postStream('/api/flow/generate', {
      domainIds: ['bd_001'], // only core domain
      requirement: '登录系统',
      userId: 'u1',
    });
    for await (const event of stream) {
      if (event.type === 'node') {
        events.push(event);
      }
    }
    // 所有 nodes 应属于 bd_001
    expect(events.every(e => e.node.domainId === 'bd_001')).toBe(true);
  });

  it('should save flow to DB on done', async () => {
    await api.post('/api/flow/generate', {
      domainIds: ['bd_001'],
      requirement: '登录',
      userId: 'u1',
    });
    const flow = await db.flowData.findFirst({ where: { project: { userId: 'u1' } } });
    expect(flow).not.toBeNull();
    expect(flow.nodes).toBeDefined();
    expect(flow.edges).toBeDefined();
  });

  it('should return 403 when domainId belongs to other user', async () => {
    const res = await api.post('/api/flow/generate', {
      domainIds: ['bd_other_user'],
      requirement: '登录',
      userId: 'u1',
    });
    expect(res.status).toBe(403);
  });
});
```

---

## 验证命令

```bash
# 1. 验证流式输出
curl -s -X POST "https://api.vibex.top/api/flow/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"domainIds":["bd_001"],"requirement":"登录","userId":"u1"}' | \
  jq -c 'select(.type) | .type'

# 2. 验证节点和边的关系
curl -s -X POST ... | jq '[.edges[].source] | unique | length'
# 应与 nodes 数量一致

# 3. 验证 Flow 保存
curl -s -X POST ... > /dev/null && \
  curl -s "https://api.vibex.top/api/flow?projectId=proj_abc" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.nodes | length'
```

---

## 关联 Specs

- **前置**: `SPEC-01-business-domain-generate.md`
- **关联**: `SPEC-04-step-state.md` (Autosave)
- **关联**: `SPEC-09-flow-crud.md` (节点编辑)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
