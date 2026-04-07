# Epic 4: Execution & Indexing

**Project**: vibex-dev-security-20260410
**Epic ID**: E4
**Stories**: ST-07, ST-08
**Priority**: P2
**Estimated Effort**: 1.5h

---

## 1. Overview

完成两个 P2 功能点：
1. **ST-07**: `flow-execution.ts` 中 4 处 `TODO` 替换为实际执行逻辑
2. **ST-08**: 为 `clarificationId` 添加数据库索引，消除全表扫描

---

## 2. Story ST-07: Implement Flow Execution

### 2.1 Problem

`lib/prompts/flow-execution.ts` 中有 4 处 `TODO` 标记，Prompt 模板描述了执行逻辑但代码为空：

```typescript
// lib/prompts/flow-execution.ts:792
case 'llm':
  // TODO: 实现 LLM step 执行
  break;

// lib/prompts/flow-execution.ts:813
case 'code':
  // TODO: 实现代码执行
  break;

// lib/prompts/flow-execution.ts:847
case 'wait':
  // TODO: 实现等待 step
  break;

// lib/prompts/flow-execution.ts:869
// TODO: 实现结果聚合
```

用户触发 Flow 执行时静默返回 `{ success: true, data: null }`。

### 2.2 Solution

```typescript
// lib/prompts/flow-execution.ts — 修复后

case 'llm': {
  // 使用 LLM service 执行 step
  const llmService = new LLMService(this.env);
  const result = await llmService.chat([
    { role: 'user', content: step.prompt }
  ]);
  return {
    stepId: step.id,
    status: 'completed',
    output: result.content,
    timestamp: Date.now(),
  };
}

case 'code': {
  // 在沙箱中执行代码
  const sandboxResult = await executeInSandbox(step.code, step.timeout ?? 5000);
  return {
    stepId: step.id,
    status: sandboxResult.success ? 'completed' : 'failed',
    output: sandboxResult.stdout,
    error: sandboxResult.stderr,
    timestamp: Date.now(),
  };
}

case 'wait': {
  // 等待指定时间
  await new Promise(resolve => setTimeout(resolve, step.duration ?? 1000));
  return {
    stepId: step.id,
    status: 'completed',
    output: `Waited ${step.duration ?? 1000}ms`,
    timestamp: Date.now(),
  };
}

// 结果聚合
const aggregated = {
  success: steps.every(s => s.status === 'completed'),
  steps: completedSteps,
  summary: generateSummary(completedSteps),
};
```

### 2.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/lib/prompts/flow-execution.ts` | 替换 4 处 TODO 为实际逻辑 |
| `vibex-backend/src/__tests__/lib/flow-execution.test.ts` | 新增 3 场景测试（LLM/wait/failure） |

### 2.4 Acceptance Tests

```typescript
describe('Flow Execution', () => {
  it('should return non-null step outputs for llm step', async () => {
    const flow = createTestFlow([{ type: 'llm', prompt: 'Hello world' }]);
    const result = await executeFlow(flow);
    expect(result.success).toBe(true);
    expect(result.data?.steps[0].output).not.toBeNull();
    expect(result.data?.steps[0].output).not.toBeUndefined();
  });

  it('should return non-null output for wait step', async () => {
    const flow = createTestFlow([{ type: 'wait', duration: 100 }]);
    const result = await executeFlow(flow);
    expect(result.data?.steps[0].status).toBe('completed');
  });

  it('should not silently fail — return error info', async () => {
    const flow = createTestFlow([{ type: 'code', code: 'throw new Error("test")' }]);
    const result = await executeFlow(flow);
    expect(result.success).toBe(false);
    expect(result.data?.steps[0].error).toBeDefined();
  });
});
```

### 2.5 Rollback

```bash
git checkout HEAD~1 -- src/lib/prompts/flow-execution.ts
```

---

## 3. Story ST-08: Add clarificationId Index

### 3.1 Problem

`clarification route` 中有 TODO 注释指出 `clarificationId` 查询需要索引优化：

```typescript
// app/api/clarifications/[clarificationId]/route.ts:53
// TODO: 需要索引 clarificationId 查询
const result = await db.query(
  'SELECT * FROM Clarification WHERE clarificationId = ?',
  [clarificationId]
); // 全表扫描，数据量大时性能退化
```

### 3.2 Solution

```sql
-- migrations/YYYYMMDDHHMMSS_add_clarification_indexes.sql
-- 在 Entity 表上添加 clarificationId 索引
CREATE INDEX IF NOT EXISTS idx_entity_clarification_id ON Entity(clarificationId);

-- 在 Clarification 表上添加 entityId 索引（反向查询）
CREATE INDEX IF NOT EXISTS idx_clarification_entity_id ON Clarification(entityId);
```

```bash
# 应用迁移
$ cd vibex-backend
$ pnpm exec prisma migrate dev --name add_clarification_indexes
```

### 3.3 Files

| File | Change |
|------|--------|
| `vibex-backend/prisma/migrations/YYYYMMDDHHMMSS_add_clarification_indexes/migration.sql` | 新增索引 |
| `vibex-backend/prisma/schema.prisma` | 确认 Clarification 和 Entity 模型定义 |

### 3.4 Acceptance Tests

```typescript
it('should use index for clarificationId query', async () => {
  const plan = await db.explain(
    'SELECT * FROM Entity WHERE clarificationId = ?',
    ['test-clarification-id']
  );
  expect(plan).toContain('USING INDEX idx_entity_clarification_id');
  expect(plan).not.toContain('SCAN TABLE');
});
```

### 3.5 Rollback

```bash
# 移除索引
$ sqlite3 .prisma/client/dev.db "DROP INDEX idx_entity_clarification_id"
$ sqlite3 .prisma/client/dev.db "DROP INDEX idx_clarification_entity_id"
```
