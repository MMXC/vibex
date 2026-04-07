# PRD: vibex-step-context-fix-20260326

## Step Context 多节点展示修复

---

## 1. 执行摘要

### 背景
用户在使用 AI 分析复杂需求时，后端 AI 已生成多个限界上下文（如"用户管理"、"商品管理"、"订单管理"），但画布上只显示一个节点，且节点名称硬编码为"AI 分析上下文"。问题根源在于后端 SSE 事件未传递 boundedContexts 数组，前端类型定义缺失，前端 Store 只创建单一节点。

### 目标
修复 step_context 事件链路，实现：
1. 后端传递 boundedContexts 数组
2. 前端展示多个上下文节点，名称为真实 AI 生成名称
3. 保留降级兼容（无 boundedContexts 时显示单节点）

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 多节点展示成功率 | 100%（boundedContexts 有数据时） |
| 降级兼容性 | 100%（无 boundedContexts 时不报错） |
| 节点名称准确率 | ≥ 95%（与 AI 生成名称一致） |
| 实施工时 | ≤ 30 分钟（方案 A） |

---

## 2. 功能需求

### F1: 后端 SSE 事件修复

#### F1.1 step_context 事件补充 boundedContexts
- **文件**: `vibex-backend/src/app/api/v1/analyze/stream/route.ts`
- **修改**: 在 `step_context` SSE 事件中添加 `boundedContexts` 数组字段
- **数据结构**:
  ```typescript
  boundedContexts?: Array<{
    id: string;
    name: string;
    description: string;
    type: string; // 'core' | 'supporting' | 'generic'
  }>
  ```
- **验收标准**:
  ```typescript
  // 端到端验证
  const event = parseSSELine(line);
  expect(event.type === 'step_context');
  if (boundedContexts?.length > 0) {
    expect(Array.isArray(event.boundedContexts)).toBe(true);
    expect(event.boundedContexts[0]).toHaveProperty('id');
    expect(event.boundedContexts[0]).toHaveProperty('name');
    expect(event.boundedContexts[0]).toHaveProperty('description');
  }
  ```

#### F1.2 空数组保护
- 当 AI 未返回 boundedContexts 时，不发送该字段（向后兼容）
- **验收标准**:
  ```typescript
  // AI 返回空结果时，SSE 事件不含 boundedContexts
  expect(event.boundedContexts).toBeUndefined();
  ```

---

### F2: 前端类型定义更新

#### F2.1 StepContextEvent 接口扩展
- **文件**: `vibex-fronted/src/lib/canvas/api/dddApi.ts`
- **修改**: `StepContextEvent` 接口增加 `boundedContexts` 字段
- **验收标准**:
  ```typescript
  // 编译时验证
  const event: StepContextEvent = {
    type: 'step_context',
    content: '...',
    confidence: 0.8,
    boundedContexts: [
      { id: '1', name: '用户管理', description: '...', type: 'core' }
    ]
  };
  expect(event.boundedContexts![0].name).toBe('用户管理');
  ```

#### F2.2 onStepContext 回调签名更新
- **文件**: `vibex-fronted/src/lib/canvas/api/dddApi.ts`
- **修改**: 回调函数签名增加 `boundedContexts` 参数
- **验收标准**:
  ```typescript
  // 类型检查通过，无编译错误
  type StepContextCallback = (
    content: string,
    _mermaidCode: string | undefined,
    confidence: number | undefined,
    boundedContexts?: Array<{ id: string; name: string; description: string; type: string }>
  ) => void;
  ```

---

### F3: 前端 Store 多节点创建逻辑

#### F3.1 循环创建节点
- **文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`
- **修改**: `onStepContext` 回调中循环调用 `addContextNode`，每个 boundedContext 创建一个节点
- **回退逻辑**: 当 `boundedContexts` 为空或未定义时，保留原有单节点逻辑（"AI 分析上下文"）
- **验收标准**:
  ```typescript
  // 多节点场景
  const boundedContexts = [
    { name: '用户管理', description: '处理注册登录', type: 'core' },
    { name: '商品管理', description: '处理商品浏览', type: 'core' },
  ];
  // 模拟调用
  onStepContext('分析完成', undefined, 0.8, boundedContexts);
  // 验证：应创建 2 个节点
  const nodes = getCreatedNodes();
  expect(nodes.length).toBe(2);
  expect(nodes[0].name).toBe('用户管理');
  expect(nodes[1].name).toBe('商品管理');

  // 降级场景
  onStepContext('分析完成', undefined, 0.8, undefined);
  const nodes2 = getCreatedNodes();
  expect(nodes2.length).toBe(1);
  expect(nodes2[0].name).toBe('AI 分析上下文');
  ```

#### F3.2 节点数量限制
- 限制最大节点数为 10 个（防止性能问题）
- **验收标准**:
  ```typescript
  const manyContexts = Array.from({ length: 15 }, (_, i) => ({
    name: `Context${i}`, description: '...', type: 'core'
  }));
  onStepContext('...', undefined, 0.8, manyContexts);
  const nodes = getCreatedNodes();
  expect(nodes.length).toBe(10); // 最多 10 个
  ```

#### F3.3 节点名称截断
- 节点名称最长 30 字符，超出部分截断
- **验收标准**:
  ```typescript
  const longNameCtx = { name: '这是一个非常非常非常长的上下文名称', description: '...', type: 'core' };
  onStepContext('...', undefined, 0.8, [longNameCtx]);
  const node = getCreatedNodes()[0];
  expect(node.name.length).toBeLessThanOrEqual(30);
  expect(node.name.endsWith('...')).toBe(true);
  ```

#### F3.4 节点类型映射
- 将 AI 返回的 type 字符串映射为合法的节点类型
- **验收标准**:
  ```typescript
  const ctxCore = { name: 'C1', description: '...', type: 'core' };
  const ctxSupport = { name: 'C2', description: '...', type: 'supporting' };
  const ctxGeneric = { name: 'C3', description: '...', type: 'generic' };
  const ctxUnknown = { name: 'C4', description: '...', type: 'unknown' };
  onStepContext('...', undefined, 0.8, [ctxCore, ctxSupport, ctxGeneric, ctxUnknown]);
  const nodes = getCreatedNodes();
  expect(nodes[0].type).toBe('core');
  expect(nodes[1].type).toBe('supporting');
  expect(nodes[2].type).toBe('generic');
  expect(nodes[3].type).toBe('generic'); // 未知类型默认 generic
  ```

---

### F4: 端到端验收测试

#### F4.1 复杂需求多节点测试
- **输入**: "开发一个电商平台，包含用户注册登录、商品浏览下单、支付物流等功能"
- **预期输出**: 画布显示 3+ 个节点，名称如"用户管理"、"商品管理"、"订单管理"、"支付管理"
- **验收标准**:
  ```typescript
  // 端到端测试
  await submitRequirement('开发一个电商平台...');
  await waitForNodes(5000);
  const nodes = getCanvasNodes();
  expect(nodes.length).toBeGreaterThanOrEqual(3);
  const names = nodes.map(n => n.name);
  expect(names.some(n => n.includes('用户'))).toBe(true);
  expect(names.some(n => n.includes('商品'))).toBe(true);
  expect(names.some(n => n.includes('订单'))).toBe(true);
  ```

#### F4.2 简单需求单节点降级测试
- **输入**: "做一个博客系统"
- **预期输出**: 画布显示 1 个节点（回退到"AI 分析上下文"）
- **验收标准**:
  ```typescript
  await submitRequirement('做一个博客系统');
  await waitForNodes(5000);
  const nodes = getCanvasNodes();
  expect(nodes.length).toBe(1);
  ```

---

## 3. Epic 拆分

### Epic 1: 后端 SSE 事件修复（P0）
**Story**: S1.1 后端在 step_context 事件中补充 boundedContexts 数组

**验收**: SSE 事件包含 boundedContexts 字段（当 AI 有数据时）

---

### Epic 2: 前端类型与回调更新（P0）
**Stories**:
- S2.1 更新 StepContextEvent 接口，增加 boundedContexts 字段
- S2.2 更新 onStepContext 回调签名，增加 boundedContexts 参数

**验收**: TypeScript 编译通过，类型检查无错误

---

### Epic 3: 前端 Store 多节点逻辑（P0）
**Stories**:
- S3.1 实现循环调用 addContextNode 创建多个节点
- S3.2 实现降级逻辑（无 boundedContexts 时保留单节点）
- S3.3 实现节点数量限制（最多 10 个）
- S3.4 实现节点名称截断（最长 30 字符）
- S3.5 实现 type 字符串到节点类型的映射

**验收**: 所有 expect() 断言通过

---

### Epic 4: 端到端验收测试（P0）
**Story**: S4.1 编写并执行端到端测试（多节点 + 降级场景）

**验收**: E2E 测试 100% 通过

---

## 4. UI/UX 流程

```
用户提交需求（"开发一个电商平台..."）
        ↓
后端 AI 分析，生成 boundedContexts 数组
        ↓
后端发送 SSE step_context 事件（含 boundedContexts）
        ↓
前端接收事件，解析 boundedContexts
        ↓
前端 Store 循环调用 addContextNode
        ↓
画布展示多个节点（用户管理 / 商品管理 / 订单管理 / ...）
```

---

## 5. 非功能需求

| NFR | 要求 |
|-----|------|
| 性能 | 节点创建 < 100ms/节点 |
| 兼容性 | 后端无 boundedContexts 时不报错 |
| 可测试性 | 每个 Story 有 expect() 格式验收标准 |

---

## 6. 验收标准总览

| 优先级 | 验收条件 | 验证方式 |
|--------|---------|---------|
| P0 | 后端 SSE 事件含 boundedContexts | SSE 解析测试 |
| P0 | 前端类型定义通过编译 | TypeScript 编译 |
| P0 | 多节点场景：3+ 节点展示 | E2E 测试 |
| P0 | 降级场景：单节点正常显示 | E2E 测试 |
| P0 | 节点数量 ≤ 10 | 单元测试 |
| P0 | 节点名称 ≤ 30 字符 | 单元测试 |
| P0 | type 映射正确 | 单元测试 |

---

## 7. DoD

**Epic 完成的充要条件**:
1. ✅ 代码修改已提交（git commit）
2. ✅ TypeScript 编译无错误
3. ✅ 所有单元测试通过
4. ✅ E2E 测试通过（多节点 + 降级）
5. ✅ task_manager 状态已更新

---

## 8. 依赖项

| 文件 | 位置 | 修改内容 |
|------|------|---------|
| `route.ts` | vibex-backend/.../analyze/stream/ | SSE 事件字段 |
| `dddApi.ts` | vibex-fronted/src/lib/canvas/api/ | 类型定义 + 回调签名 |
| `canvasStore.ts` | vibex-fronted/src/lib/canvas/ | 多节点创建逻辑 |

---

## 9. Out of Scope

- 修改 AI prompt 以生成更多/更少上下文
- 节点拖拽、连线等交互增强
- 上下文节点的编辑功能
- 性能基准测试（大规模节点 > 100 个场景）
