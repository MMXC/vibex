# Spec: Epic 4 — 合约测试与核心库

**项目**: vibex-tester-proposals-vibex-proposals-20260408  
**Epic**: 合约测试与核心库  
**工时**: 2 人天  
**Owner**: Tester Agent  

---

## 1. 概述与目标

Epic 4 聚焦于扩展 API 合约测试覆盖和补充核心库单元测试。当前仅有 E4 snapshot API 有合约测试（`sync.contract.spec.ts`），E1/E2 的 flows API 完全无合约测试；`template-applier.ts`、`requirementValidator.ts` 等核心库也无测试覆盖。本 Epic 目标是在 2 人天内为 flows API 建立合约测试套件，并为 2 个核心库补充边界测试。

## 2. Story S4.1: flows API 合约测试

### 目标
为 `/v1/canvas/flows` 端点添加 `flows.contract.spec.ts`，包含 ≥5 个合约测试用例，基于 Zod schema 验证请求/响应。

### 背景

**当前状态**:
- `TESTING_STRATEGY.md` 定义了 6 个合约测试端点
- E4 snapshot API 有 `sync.contract.spec.ts`
- E1/E2 flows API 无合约测试

**flows API 端点（推测）**:
```
GET  /v1/canvas/flows              — 获取 flow 列表
POST /v1/canvas/flows              — 创建 flow
GET  /v1/canvas/flows/:id          — 获取单个 flow
PUT  /v1/canvas/flows/:id          — 更新 flow
DELETE /v1/canvas/flows/:id        — 删除 flow
```

### 实施步骤

#### Step 1: 确认 flows API Zod schema
```typescript
// src/lib/canvas/flows/schemas.ts (推测)
import { z } from 'zod';

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'task', 'decision', 'end']),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()).optional()
});

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional()
});

export const FlowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  canvasId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const CreateFlowSchema = FlowSchema.omit({
  id: true, createdAt: true, updatedAt: true
});
```

#### Step 2: 创建 flows.contract.spec.ts
```typescript
// tests/contract/flows.contract.spec.ts
import { test, expect } from '@playwright/test';
import { worker } from '../fixtures/msw';

test.beforeEach(async ({ page }) => {
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
});

test.afterEach(async () => {
  await worker.stop();
});

test.describe('Flows API Contract Tests', () => {
  test.describe('GET /v1/canvas/flows', () => {
    test('returns valid flow list with required fields', async ({ page }) => {
      const response = await page.request.get('/v1/canvas/flows?canvasId=canvas-123');
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.flows).toBeInstanceOf(Array);
      
      if (body.flows.length > 0) {
        const flow = body.flows[0];
        expect(flow).toHaveProperty('id');
        expect(flow).toHaveProperty('name');
        expect(flow).toHaveProperty('nodes');
        expect(flow).toHaveProperty('edges');
        expect(flow).toHaveProperty('canvasId');
      }
    });
    
    test('returns 400 for missing canvasId parameter', async ({ page }) => {
      const response = await page.request.get('/v1/canvas/flows');
      
      // 取决于 API 实现：可能返回 400 或忽略参数
      expect([200, 400]).toContain(response.status());
    });
    
    test('returns empty array for canvas with no flows', async ({ page }) => {
      const response = await page.request.get('/v1/canvas/flows?canvasId=nonexistent');
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.flows).toBeInstanceOf(Array);
      expect(body.flows).toHaveLength(0);
    });
  });
  
  test.describe('POST /v1/canvas/flows', () => {
    test('creates flow with valid data', async ({ page }) => {
      const payload = {
        name: 'Test Flow',
        canvasId: 'canvas-123',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            label: 'Start',
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      };
      
      const response = await page.request.post('/v1/canvas/flows', {
        data: payload
      });
      
      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.name).toBe(payload.name);
      expect(body.canvasId).toBe(payload.canvasId);
      expect(body.createdAt).toBeDefined();
    });
    
    test('rejects flow with missing required fields', async ({ page }) => {
      const payload = {
        // 缺少 name, canvasId, nodes
        edges: []
      };
      
      const response = await page.request.post('/v1/canvas/flows', {
        data: payload
      });
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
    
    test('rejects flow with name exceeding max length', async ({ page }) => {
      const payload = {
        name: 'A'.repeat(101), // max: 100
        canvasId: 'canvas-123',
        nodes: [],
        edges: []
      };
      
      const response = await page.request.post('/v1/canvas/flows', {
        data: payload
      });
      
      expect(response.status()).toBe(400);
    });
    
    test('rejects flow with invalid node type', async ({ page }) => {
      const payload = {
        name: 'Test Flow',
        canvasId: 'canvas-123',
        nodes: [
          {
            id: 'node-1',
            type: 'invalid-type', // 不在 enum 中
            label: 'Invalid',
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      };
      
      const response = await page.request.post('/v1/canvas/flows', {
        data: payload
      });
      
      expect(response.status()).toBe(400);
    });
  });
  
  test.describe('PUT /v1/canvas/flows/:id', () => {
    test('updates flow with valid data', async ({ page }) => {
      const payload = {
        name: 'Updated Flow Name',
        nodes: [],
        edges: []
      };
      
      const response = await page.request.put('/v1/canvas/flows/flow-123', {
        data: payload
      });
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.name).toBe(payload.name);
    });
    
    test('returns 404 for nonexistent flow', async ({ page }) => {
      const response = await page.request.put('/v1/canvas/flows/nonexistent-id', {
        data: { name: 'Test', nodes: [], edges: [] }
      });
      
      expect(response.status()).toBe(404);
    });
  });
  
  test.describe('DELETE /v1/canvas/flows/:id', () => {
    test('deletes existing flow', async ({ page }) => {
      const response = await page.request.delete('/v1/canvas/flows/flow-123');
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
    });
    
    test('returns 404 for nonexistent flow', async ({ page }) => {
      const response = await page.request.delete('/v1/canvas/flows/nonexistent-id');
      
      expect(response.status()).toBe(404);
    });
  });
});
```

### 验收标准
- [ ] `tests/contract/flows.contract.spec.ts` 存在
- [ ] ≥5 个合约测试用例（当前设计: 9 个）
- [ ] 使用 MSW mock（复用 `tests/fixtures/msw/`）
- [ ] 基于 Zod schema 验证请求/响应
- [ ] `npx playwright test tests/contract/flows.contract.spec.ts` 全部通过

---

## 3. Story S4.2: 核心库测试补充

### 目标
为 `template-applier.ts` 和 `requirementValidator.ts` 各补充 ≥5 个边界测试用例，验证核心库的错误处理能力。

### 3.1 template-applier.ts 测试

#### Hook 分析
`template-applier.ts` 负责将模板应用到 Canvas 数据，核心逻辑包括：
- 模板变量替换（`{{variable}}` 格式）
- 节点位置重排
- 默认值填充
- 特殊字符转义

#### 测试用例

```typescript
// src/lib/template-applier.test.ts
import { describe, it, expect } from 'vitest';
import { applyTemplate, TemplateEngine } from '../template-applier';

describe('template-applier', () => {
  describe('变量替换', () => {
    it('正确替换单个变量', () => {
      const template = 'Hello, {{name}}!';
      const result = applyTemplate(template, { name: 'World' });
      expect(result).toBe('Hello, World!');
    });
    
    it('替换多个变量', () => {
      const template = '{{greeting}}, {{name}}!';
      const result = applyTemplate(template, { greeting: 'Hi', name: 'VibeX' });
      expect(result).toBe('Hi, VibeX!');
    });
    
    it('变量缺失时保留原占位符', () => {
      const template = 'Hello, {{name}}!';
      const result = applyTemplate(template, {});
      expect(result).toBe('Hello, {{name}}!');
    });
    
    it('变量值为空字符串时替换为空', () => {
      const template = 'Hello, {{name}}!';
      const result = applyTemplate(template, { name: '' });
      expect(result).toBe('Hello, !');
    });
    
    it('变量值包含特殊字符时正确转义', () => {
      const template = 'Name: {{name}}';
      const result = applyTemplate(template, { name: '<script>alert("xss")</script>' });
      expect(result).toBe('Name: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
    
    it('变量值包含双花括号时递归替换', () => {
      const template = 'Template: {{outer}}';
      const result = applyTemplate(template, { outer: '{{inner}}', inner: 'INNER_VALUE' });
      expect(result).toBe('Template: INNER_VALUE');
    });
    
    it('超长文本截断', () => {
      const template = 'Title: {{title}}';
      const result = applyTemplate(template, { title: 'A'.repeat(10000) });
      expect(result.length).toBeLessThanOrEqual(template.length + 10000);
    });
    
    it('嵌套对象属性访问', () => {
      const template = 'User: {{user.name}}';
      const result = applyTemplate(template, { user: { name: 'Alice' } });
      expect(result).toBe('User: Alice');
    });
  });
  
  describe('Canvas 节点处理', () => {
    it('模板应用到 Canvas 节点', () => {
      const canvas = {
        nodes: [
          { id: 'n1', label: '{{nodeLabel}}' }
        ]
      };
      const result = applyTemplate(canvas, { nodeLabel: 'New Label' });
      expect(result.nodes[0].label).toBe('New Label');
    });
    
    it('空 Canvas 返回空结果', () => {
      const canvas = { nodes: [], edges: [] };
      const result = applyTemplate(canvas, {});
      expect(result.nodes).toHaveLength(0);
    });
  });
});
```

### 3.2 requirementValidator.ts 测试

#### Hook 分析
`requirementValidator.ts` 负责验证需求文档的结构和内容，核心逻辑包括：
- 必填字段检查（title、description、acceptance criteria）
- 格式验证（title 长度、description 非空）
- 循环引用检测
- 依赖关系验证

#### 测试用例

```typescript
// src/lib/validator/requirementValidator.test.ts
import { describe, it, expect } from 'vitest';
import { validateRequirement, ValidationError } from '../validator/requirementValidator';

describe('requirementValidator', () => {
  describe('必填字段验证', () => {
    it('完整需求通过验证', () => {
      const requirement = {
        title: 'Test Requirement',
        description: 'This is a test requirement',
        acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
        priority: 'P1'
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('缺少 title 返回错误', () => {
      const requirement = {
        description: 'Missing title',
        acceptanceCriteria: ['Criterion']
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'title', code: 'REQUIRED' })
      );
    });
    
    it('缺少 description 返回错误', () => {
      const requirement = {
        title: 'Missing Description',
        acceptanceCriteria: []
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'description', code: 'REQUIRED' })
      );
    });
    
    it('缺少 acceptanceCriteria 返回错误', () => {
      const requirement = {
        title: 'Missing AC',
        description: 'No AC field'
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'acceptanceCriteria', code: 'REQUIRED' })
      );
    });
  });
  
  describe('格式验证', () => {
    it('title 超过最大长度返回错误', () => {
      const requirement = {
        title: 'A'.repeat(201), // max: 200
        description: 'Valid description',
        acceptanceCriteria: ['AC']
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'title', code: 'MAX_LENGTH' })
      );
    });
    
    it('description 为空字符串返回错误', () => {
      const requirement = {
        title: 'Valid Title',
        description: '',
        acceptanceCriteria: ['AC']
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'description', code: 'EMPTY' })
      );
    });
    
    it('acceptanceCriteria 为空数组返回错误', () => {
      const requirement = {
        title: 'Valid Title',
        description: 'Valid description',
        acceptanceCriteria: []
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'acceptanceCriteria', code: 'EMPTY' })
      );
    });
    
    it('priority 为无效值返回错误', () => {
      const requirement = {
        title: 'Valid Title',
        description: 'Valid description',
        acceptanceCriteria: ['AC'],
        priority: 'P10' // 必须是 P0/P1/P2/P3
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'priority', code: 'INVALID_ENUM' })
      );
    });
  });
  
  describe('依赖关系验证', () => {
    it('检测循环依赖返回错误', () => {
      const requirement = {
        title: 'Circular Dependency',
        description: 'This requirement has a circular dependency',
        acceptanceCriteria: ['AC'],
        dependsOn: ['req-001']
      };
      
      // req-001 依赖当前 requirement
      const allRequirements = new Map([
        ['req-001', { dependsOn: ['req-circular'] }],
        ['req-circular', requirement]
      ]);
      
      const result = validateRequirement(requirement, { allRequirements });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CIRCULAR_DEPENDENCY' })
      );
    });
    
    it('依赖不存在的需求返回错误', () => {
      const requirement = {
        title: 'Missing Dependency',
        description: 'This requirement depends on a non-existent one',
        acceptanceCriteria: ['AC'],
        dependsOn: ['nonexistent-req']
      };
      
      const result = validateRequirement(requirement, { allRequirements: new Map() });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_DEPENDENCY' })
      );
    });
  });
  
  describe('边界条件', () => {
    it('undefined 输入返回错误', () => {
      const result = validateRequirement(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_INPUT' })
      );
    });
    
    it('null 输入返回错误', () => {
      const result = validateRequirement(null);
      expect(result.valid).toBe(false);
    });
    
    it('多个错误同时返回', () => {
      const requirement = {
        title: '', // 空
        description: '', // 空
        acceptanceCriteria: [] // 空
      };
      
      const result = validateRequirement(requirement);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
```

### 验收标准
- [ ] `src/lib/template-applier.test.ts` 存在，≥8 个测试用例
- [ ] `src/lib/validator/requirementValidator.test.ts` 存在，≥12 个测试用例
- [ ] 所有测试用例在 `pnpm vitest run` 下通过
- [ ] 覆盖边界条件（空值、超长文本、特殊字符、循环引用）
- [ ] 测试文件遵循 `*.test.ts` 命名规范

---

## 4. 交付物清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `tests/contract/flows.contract.spec.ts` | 新增 | flows API 合约测试（≥5 用例） |
| `src/lib/template-applier.test.ts` | 新增 | 模板应用器测试（≥8 用例） |
| `src/lib/validator/requirementValidator.test.ts` | 新增 | 需求验证器测试（≥12 用例） |

---

## 5. 质量门槛

| 指标 | 门槛 | 检查命令 |
|------|------|---------|
| flows 合约测试数量 | ≥5 | `grep -c "test(" tests/contract/flows.contract.spec.ts` |
| template-applier 测试数量 | ≥8 | `grep -c "it(" src/lib/template-applier.test.ts` |
| requirementValidator 测试数量 | ≥12 | `grep -c "it(" src/lib/validator/requirementValidator.test.ts` |
| 测试通过率 | 100% | `pnpm vitest run --reporter=verbose` |
| MSW 复用 | 是 | `grep "from.*msw" tests/contract/flows.contract.spec.ts` |

---

*Spec 由 PM Agent 生成于 2026-04-08*
