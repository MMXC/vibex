# SPEC-01: POST /api/business-domain/generate

> **业务领域流式生成 API** — 简化流程 Step 1-A

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/business-domain/generate` |
| **所属模块** | `BusinessDomain` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |
| **最后更新** | `2026-03-23` |

---

## 功能说明

流式生成业务领域（核心域/支撑域/通用域），AI 思考过程实时可见，用户可随时中断并重新发起。

---

## 接口定义

### 请求

**方法**: `POST`  
**路径**: `/api/business-domain/generate`  
**认证**: `Required`  
**Content-Type**: `application/json`  
**流式**: `SSE (Server-Sent Events)`

#### Request Body

```typescript
interface GenerateDomainsRequest {
  requirement: string;      // required, 用户需求原文, max 5000 chars
  projectId?: string;      // optional, 关联项目 ID
  userId: string;           // required, userId (from JWT) or sessionId
  language?: 'zh' | 'en';  // optional, default 'zh'
  // 断点续传（可选）
  continueFrom?: {
    lastDomainId: string;      // 上次最后一个 domain ID
    existingDomainIds: string[]; // 已存在的 domain IDs (跳过这些)
  };
}
```

---

## 响应

### 流式 SSE Events

```
event: start
data: { "type": "start", "requirement": "...", "timestamp": "..." }

event: thinking
data: { "type": "thinking", "content": "分析核心业务领域...", "domainIndex": 0 }

event: domain
data: { "type": "domain", "domain": { "id": "bd_001", "name": "用户管理", "domainType": "core", "features": [...] }, "index": 1, "total": 3 }

event: domain
data: { "type": "domain", "domain": { "id": "bd_002", "name": "商品管理", "domainType": "supporting", ... }, "index": 2, "total": 3 }

event: done
data: { "type": "done", "domains": [...], "generationTime": 3240, "savedAt": "..." }

event: error
data: { "type": "error", "error": "...", "code": "GENERATION_ERROR" }

event: aborted
data: { "type": "aborted", "reason": "user_interrupt", "savedDomains": ["bd_001"] }
```

### Domain 实体定义

```typescript
interface BusinessDomain {
  id: string;
  name: string;            // e.g. "用户管理"
  domainType: 'core' | 'supporting' | 'generic';
  features: Feature[];
  description?: string;
  nodeIds?: string[];
  order: number;
}

interface Feature {
  id: string;
  name: string;            // e.g. "用户注册"
  description?: string;
  priority: 'low' | 'medium' | 'high';
  checked: boolean;       // default false
}
```

---

## 示例

### curl 示例

```bash
curl -X POST "https://api.vibex.top/api/business-domain/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "requirement": "用户可以注册账号、浏览商品、下单、支付",
    "projectId": "proj_abc123",
    "userId": "user_123",
    "language": "zh"
  }' \
  --no-buffer
```

### 断点续传示例

```bash
# 上次生成到第 2 个 domain 后中断，这次继续
curl -X POST "https://api.vibex.top/api/business-domain/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "requirement": "用户可以注册账号、浏览商品、下单、支付",
    "userId": "user_123",
    "continueFrom": {
      "lastDomainId": "bd_002",
      "existingDomainIds": ["bd_001", "bd_002"]
    }
  }'
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| requirement 为空 | `requirement: ""` | `400` + `{ error: "requirement is required" }` |
| requirement 超长 | `requirement: "x".repeat(5001)` | `400` + `{ error: "requirement too long (max 5000)" }` |
| userId 与 JWT 不匹配 | 伪造 userId | `403` |
| AI 服务不可用 | — | SSE: `error` event |
| 用户中断 | `AbortController.abort()` | SSE: `aborted` event |
| 断点续传但 domain 已存在 | `existingDomainIds` 包含不存在的 ID | `400` |

---

## AI Prompt

```typescript
const DOMAIN_GENERATION_PROMPT = `你是一个专业的业务领域分析师。

用户需求: {requirement}

请分析并输出以下 JSON 格式的业务领域列表：

要求：
1. 识别核心域（直接提供用户价值的业务）
2. 识别支撑域（为核心域提供支撑的业务）
3. 识别通用域（跨项目复用的能力）
4. 每个领域包含 2-5 个功能项
5. 所有术语使用业务语言，避免 DDD 术语

输出格式（JSON array）:
[
  {
    "name": "领域名称",
    "domainType": "core|supporting|generic",
    "description": "领域描述",
    "features": [
      { "name": "功能名称", "priority": "high|medium|low", "description": "功能描述" }
    ]
  }
]

请直接输出 JSON，不要有其他内容。`;
```

---

## 数据结构（存储到 DB）

**表**: `BusinessDomain`  
**字段映射**:

| DB Field | API Field |
|----------|-----------|
| `id` | `id` (cuid, auto) |
| `projectId` | `projectId` |
| `name` | `name` |
| `domainType` | `domainType` |
| `features` | `features` (JSON) |
| `description` | `description` |
| `order` | `index` (从 1 开始) |

---

## 测试用例

### 单元测试

```typescript
describe('POST /api/business-domain/generate', () => {
  it('should return 400 when requirement is missing', async () => {
    const res = await api.post('/api/business-domain/generate', { userId: 'u1' });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('VALIDATION_ERROR');
    expect(res.data.error).toContain('requirement');
  });

  it('should return 400 when requirement exceeds 5000 chars', async () => {
    const res = await api.post('/api/business-domain/generate', {
      requirement: 'x'.repeat(5001),
      userId: 'u1',
    });
    expect(res.status).toBe(400);
  });

  it('should stream domain events in order', async () => {
    const events = [];
    const stream = await api.postStream('/api/business-domain/generate', {
      requirement: '用户登录系统',
      userId: 'u1',
    });
    for await (const event of stream) {
      events.push(event.type);
    }
    expect(events).toContain('start');
    expect(events).toContain('thinking');
    expect(events).toContain('domain');
    expect(events).toContain('done');
  });

  it('should save domains to DB on done event', async () => {
    await api.post('/api/business-domain/generate', { requirement: '登录系统', userId: 'u1' });
    const domains = await db.businessDomain.findMany({ where: { userId: 'u1' } });
    expect(domains.length).toBeGreaterThan(0);
  });

  it('should return aborted event on interrupt', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    const events = [];
    const stream = await api.postStream('/api/business-domain/generate', {
      requirement: '登录系统',
      userId: 'u1',
    }, { signal: controller.signal });
    for await (const event of stream) {
      events.push(event.type);
      if (event.type === 'aborted') break;
    }
    expect(events).toContain('aborted');
  });
});
```

### 边界测试

```typescript
describe('Boundary conditions', () => {
  it('should skip existing domains in continueFrom', async () => {
    // Pre-create domain
    await db.businessDomain.create({ data: { id: 'bd_existing', name: '已有领域', userId: 'u1' } });
    const events = await collectStream('/api/business-domain/generate', {
      requirement: '登录系统',
      userId: 'u1',
      continueFrom: { lastDomainId: 'bd_existing', existingDomainIds: ['bd_existing'] },
    });
    const domainEvents = events.filter(e => e.type === 'domain');
    // 不应包含已存在的 domain
    expect(domainEvents.every(e => e.domain.id !== 'bd_existing')).toBe(true);
  });
});
```

---

## 验证命令

```bash
# 1. 基本流式测试
curl -s -X POST "https://api.vibex.top/api/business-domain/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"requirement":"用户登录和下单","userId":"user_test"}' | \
  jq -c 'select(.type) | .type'

# 2. 验证 domains 保存到 DB
curl ... | jq '.domains[].name'

# 3. 验证无 DDD 术语
curl ... | jq '.domains[] | keys' | grep -i "bounded\|aggregate\|domain-event"
# Expected: empty

# 4. 验证边界: requirement 超长
curl -s -X POST ... -d '{"requirement":"'"$(printf 'a%.0s' {1..5001})"'","userId":"u1"}' | jq '.code'
# Expected: VALIDATION_ERROR

# 5. 验证断点续传
curl -s -X POST ... \
  -d '{"requirement":"登录","userId":"u1","continueFrom":{"lastDomainId":"bd_1","existingDomainIds":["bd_1"]}}' | \
  jq '[.domains[].id] | index("bd_1")'
# Expected: null (bd_1 should not appear)
```

---

## 前端集成

```typescript
// useDomainGeneration.ts
function useDomainGeneration() {
  const [domains, setDomains] = useState<BusinessDomain[]>([]);
  const [thinking, setThinking] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const generate = async (requirement: string, projectId?: string) => {
    // 1. 中断之前的请求
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // 2. 重置状态
    setDomains([]);
    setStatus('generating');

    // 3. 流式请求
    const res = await fetch('/api/business-domain/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement, projectId, userId: getUserId() }),
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6));

        switch (event.type) {
          case 'thinking': setThinking(event.content); break;
          case 'domain': setDomains(prev => [...prev, event.domain]); break;
          case 'done': setStatus('done'); break;
          case 'error': setStatus('error'); break;
          case 'aborted': setStatus('idle'); break;
        }
      }
    }
  };

  const abort = () => abortRef.current?.abort();

  return { domains, thinking, status, generate, abort };
}
```

---

## 关联 Specs

- **依赖**: `SPEC-template.md` (通用模板)
- **关联**: `SPEC-02-flow-generate.md` (Step 1-B)
- **关联**: `SPEC-04-step-state.md` (Autosave)
- **被依赖**: `SPEC-03-project-snapshot.md` (完整快照)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
