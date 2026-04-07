# SPEC-08: POST /api/ui-nodes/generate

> **UI 节点图生成 API** — 根据流程图生成 UI 结构

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/ui-nodes/generate` |
| **所属模块** | `UINode` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

基于已生成的业务流程图，流式或非流式生成 UI 节点图（页面、表单、列表等）。

---

## 接口定义

**方法**: `POST`  
**路径**: `/api/ui-nodes/generate`  
**认证**: `Required`  
**Content-Type**: `application/json`

### Request Body

```typescript
interface GenerateUINodesRequest {
  projectId?: string;
  flowId: string;           // required
  requirement: string;     // required
  userId: string;           // required
  language?: 'zh' | 'en';
  flowNodes?: FlowNode[];   // optional, 覆盖从 DB 读取
}
```

### Response 200 (非流式)

```typescript
interface GenerateUINodesResponse {
  success: true;
  data: {
    uiNodes: UINode[];
    generationTime: number;
  };
}

interface UINode {
  id: string;
  name: string;             // e.g. "登录页"
  nodeType: UINodeType;
  description?: string;
  linkedFlowNodeId?: string;
  position: { x: number; y: number };
  children: UINode[];
  annotations: UINodeAnnotation[];
  checked: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'generated' | 'failed';
}

type UINodeType = 'page' | 'form' | 'list' | 'detail' | 'header' | 'footer' | 'modal' | 'navigation' | 'card';

interface UINodeAnnotation {
  id: string;
  text: string;
  source: 'user_input' | 'ai_suggestion';
  timestamp: string;
  applied: boolean;
}
```

---

## 示例

```bash
curl -X POST "https://api.vibex.top/api/ui-nodes/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "projectId": "proj_abc",
    "flowId": "flow_xyz",
    "requirement": "用户可以登录、浏览商品、下单、支付",
    "userId": "user_123"
  }'
```

---

## AI Prompt

```typescript
const UI_NODES_PROMPT = `你是一个 UI 结构规划专家。

业务流程节点:
{flow_nodes_json}

用户需求:
{requirement}

请基于以上流程节点，生成 UI 节点图结构。

要求：
1. 每个流程节点对应一个或多个 UI 页面/组件
2. 页面类型: page(页面), form(表单), list(列表), detail(详情), header, footer, modal, navigation, card
3. 页面之间有层级关系 (children)
4. 每个节点包含名称、类型、描述
5. 估算组件复杂度

输出格式 (JSON):
{
  "nodes": [
    {
      "name": "登录页",
      "nodeType": "page",
      "description": "用户登录入口",
      "children": [
        { "name": "登录表单", "nodeType": "form", "description": "用户名密码输入" }
      ]
    }
  ]
}`;
```

---

## 测试用例

```typescript
describe('POST /api/ui-nodes/generate', () => {
  beforeEach(async () => {
    await setupProjectWithFlow();
  });

  it('should generate ui nodes from flow', async () => {
    const res = await api.post('/api/ui-nodes/generate', {
      flowId: 'flow_1',
      requirement: '用户登录',
      userId: 'u1',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.uiNodes.length).toBeGreaterThan(0);
  });

  it('should link ui nodes to flow nodes', async () => {
    const res = await api.post('/api/ui-nodes/generate', {
      flowId: 'flow_1',
      requirement: '登录',
      userId: 'u1',
    });
    const pageNode = res.data.data.uiNodes.find(n => n.nodeType === 'page');
    expect(pageNode.linkedFlowNodeId).toBeDefined();
  });

  it('should save ui nodes to DB', async () => {
    await api.post('/api/ui-nodes/generate', { flowId: 'flow_1', requirement: '登录', userId: 'u1' });
    const nodes = await db.uINode.findMany({ where: { project: { userId: 'u1' } } });
    expect(nodes.length).toBeGreaterThan(0);
  });
});
```

---

## 验证命令

```bash
curl -s -X POST "https://api.vibex.top/api/ui-nodes/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"flowId":"flow_xyz","requirement":"登录","userId":"u1"}' | \
  jq '{count: (.data.uiNodes | length), pages: [.data.uiNodes[] | select(.nodeType=="page") | .name]}'
```

---

## 关联 Specs

- **前置**: `SPEC-02-flow-generate.md`
- **关联**: `SPEC-04-step-state.md`

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
