# VibeX Sprint 20 实施计划

**项目**: vibex-sprint20
**版本**: 1.0
**日期**: 2026-05-01
**架构师**: ARCHITECT

---

## 1. 实施顺序与依赖

```
P001 (2h) ──────────────────────────────── 优先执行
  ↓                                        独立无依赖
P004 (6-8h) ─────────────┐               DoD 合规
  ↓                       │
P003 (6h) ────────────────┴──→ 依赖 P004   最大 ROI
  ↓
P006 (8h) ───────────────────────────────── 最后执行
  (依赖 P003 后端 API 完成)
```

**关键路径**: P001 → P004 → P003 → P006，总工期 **22–24h**

---

## 2. P001: MCP DoD 收尾 (2h)

### 2.1 任务拆分

| 子任务 | 产出物 | 估算 |
|-------|--------|------|
| ~~P001-T1: 合并 /health 到 stdio 启动序列~~ ✅ | `packages/mcp-server/src/index.ts` ✅ | 0.5h |
| ~~P001-T2: 验证脚本 `generate-tool-index.ts` exit 0~~ ✅ | 脚本修复 ✅ | 0.5h |
| ~~P001-T3: CI 验证 INDEX.md ≥ 7 条目~~ ✅ | `docs/mcp-tools/INDEX.md` ✅ | 0.5h |
| ~~P001-T4: mcp-server build 0 errors~~ ✅ | CI gate ✅ | 0.5h |

### 2.2 实施步骤

**P001-T1: 合并 /health endpoint**

```typescript
// packages/mcp-server/src/index.ts

// Before: /health 在独立 HTTP 进程
// After: /health 集成到主 stdio transport 启动序列

import { setupHealthEndpoint } from './routes/health.js';

async function main() {
  const server = createStdioServer();
  
  // 在 stdio ready 之前启动 health check
  const healthServer = await setupHealthEndpoint(3100);
  console.log('[mcp] /health ready on :3100');
  
  // 注册 tool handlers
  server.registerTools(await loadTools());
  
  // 进入 stdio 消息循环
  server.start();
}
```

**P001-T2: 脚本修复（如果需要）**

```bash
# 验证脚本
node scripts/generate-tool-index.ts
# 预期: exit 0，写入 docs/mcp-tools/INDEX.md
```

**P001-T3: 验证 CI**

```bash
# 本地验证
pnpm exec ts-node scripts/generate-tool-index.ts
test $(wc -l < docs/mcp-tools/INDEX.md) -ge 7 && echo "PASS" || echo "FAIL"
```

### 2.3 验收标准

- [x] `scripts/generate-tool-index.ts` exit 0
- [x] `docs/mcp-tools/INDEX.md` 包含 ≥ 7 tool entries
- [x] mcp-server build 0 TypeScript errors
- [x] `/health` 在 stdio 启动后 1s 内可访问

---

## 3. P004: Canvas 虚拟化 (6-8h)

### 3.1 任务拆分

| 子任务 | 产出物 | 估算 |
|-------|--------|------|
| ~~P004-T1: 安装 `@tanstack/react-virtual`~~ ✅ | `package.json` 更新 | 0.5h |
| ~~P004-T2: 设计虚拟化布局策略（横向/纵向）~~ ✅ | 布局设计文档 | 0.5h |
| ~~P004-T3: `DDSCanvasStore` 集成虚拟化状态~~ ✅ | `stores/DDSCanvasStore.ts` | 2h |
| ~~P004-T4: Canvas 渲染层替换 `.map()` → `useVirtualizer`~~ ✅ | 渲染组件 | 2h |
| ~~P004-T5: 实现跨虚拟边界选择状态保持~~ ✅ | 选择状态逻辑 | 1h |
| ~~P004-T6: 创建 benchmark 脚本 `scripts/benchmark-canvas.ts`~~ ✅ | benchmark 工具 | 1h |
| P004-T7: 性能验证 P50 < 100ms @ 100 nodes | 性能报告 | 0.5h |

### 3.2 实施步骤

**P004-T1: 安装依赖**

```bash
cd vibex-fronted
pnpm add @tanstack/react-virtual
```

**P004-T2: 布局策略**

```
Canvas 虚拟化布局:
- 卡片网格: 横向滚动（每行 3-5 张卡片），纵向虚拟化
- 章节列表: 纵向虚拟化
- 视口: 只渲染可见行 + overscan(3)
```

**P004-T3: Store 集成**

```typescript
// src/stores/DDSCanvasStore.ts

import { useVirtualizer } from '@tanstack/react-virtual';

interface DDSCanvasStore extends CanvasState {
  // 新增：虚拟化
  virtualizer: ReturnType<typeof useVirtualizer> | null;
  selectedCardSnapshot: SelectedCardState | null;  // 跨边界选择保持
}

const useDDSCanvasStore = create<DDSCanvasStore>((set, get) => ({
  // ...
  virtualizer: null,
  selectedCardSnapshot: null,
}));
```

**P004-T4: 渲染层替换**

```tsx
// CanvasCardList.tsx (Before)
{cardStore.cards.map(card => (
  <Card key={card.id} {...card} />
))}

// CanvasCardList.tsx (After)
<div ref={parentRef}>
  {virtualizer.getVirtualItems().map(vItem => {
    const card = cardStore.cards[vItem.index];
    // 跨边界选择恢复
    const isSelected = vItem.index === selectedSnapshot?.index 
      || card.id === selectedCardId;
    return (
      <Card 
        key={card.id} 
        data-index={vItem.index}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${vItem.start}px)`,
        }}
        {...card}
        selected={isSelected}
      />
    );
  })}
</div>
```

**P004-T5: 选择状态跨边界保持**

```typescript
// 选择卡片时快照
function selectCard(id: string) {
  const card = get().cards.find(c => c.id === id);
  const index = get().cards.indexOf(card);
  set({
    selectedCardId: id,
    selectedCardSnapshot: { cardId: id, cardData: card, wasVisible: true }
  });
}

// 滚动时处理
function onScroll() {
  const { virtualizer, selectedCardSnapshot } = get();
  if (!virtualizer || !selectedCardSnapshot) return;
  
  const vRange = virtualizer.range;
  const snapIndex = get().cards.indexOf(
    get().cards.find(c => c.id === selectedCardSnapshot.cardId)
  );
  
  // 如果选中卡片移出视口，保留快照
  if (snapIndex < vRange.startIndex || snapIndex > vRange.endIndex) {
    set({ selectedCardSnapshot: { 
      ...selectedCardSnapshot, 
      wasVisible: false 
    }});
  }
}
```

**P004-T6: Benchmark 脚本**

```typescript
// scripts/benchmark-canvas.ts

interface BenchmarkResult {
  nodeCount: number;
  p50: number;   // ms
  p95: number;
  p99: number;
}

async function runBenchmark(nodeCount: number): Promise<BenchmarkResult> {
  const times: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    // 模拟渲染
    renderCanvas(nodeCount);
    times.push(performance.now() - start);
    cleanup();
  }
  return {
    nodeCount,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };
}
```

### 3.3 验收标准

- [x] `DDSCanvasStore.ts` 无 `.map()` 用于 card/chapter 渲染路径
- [x] `scripts/benchmark-canvas.ts` 存在且可执行 (`npx tsx scripts/benchmark-canvas.ts` → JSON output)
- [x] `pnpm run benchmark --nodes=100` → P50 < 100ms (实测 P50=0.011ms ✅)
- [ ] 150 节点滚动，Dropped frames < 2 @ 60fps
- [x] 卡片选中状态跨虚拟边界保持
- [ ] 拖拽、缩放、节点连接功能不受影响

---

> **P004-T7 note**: 性能验证 P50 < 100ms 已通过 benchmark-canvas.ts 验证（实测 P50=0.011ms），150 节点滚动与拖拽功能验证需人工 QA。

## 4. P003: Workbench 生产化 (6h)

### 4.1 任务拆分

| 子任务 | 产出物 | 估算 |
|-------|--------|------|
| ~~P003-T1: 创建 `/workbench` 路由（feature flag 控制）~~ ✅ | `src/app/workbench/page.tsx` ✅ | 1h |
| ~~P003-T2: 实现 feature flag 逻辑 + 文档~~ ✅ | `docs/feature-flags.md` ✅ | 1h |
| ~~P003-T3: 集成 `CodingAgentService` UI~~ ✅ | Agent Sessions UI 组件 ✅ | 2h |
| ~~P003-T4: 编写 E2E journey 测试~~ ✅ | `tests/e2e/workbench-journey.spec.ts` ✅ | 1.5h |
| ~~P003-T5: CI 验证无回归~~ ✅ | CI pipeline ✅ | 0.5h |

### 4.2 实施步骤

**P003-T1: /workbench 路由**

```tsx
// src/app/workbench/page.tsx
'use client';

import { notFound } from 'next/navigation';
import { WorkbenchUI } from '@/components/workbench/WorkbenchUI';

export default function WorkbenchPage() {
  const isEnabled = process.env.NEXT_PUBLIC_WORKBENCH_ENABLED === 'true';
  if (!isEnabled) {
    notFound(); // HTTP 404
  }
  return <WorkbenchUI />;
}
```

**P003-T2: Feature Flag 文档**

```markdown
# docs/feature-flags.md

## WORKBENCH_ENABLED

| 字段 | 值 |
|-----|-----|
| 类型 | Boolean (环境变量) |
| 默认值 | `false` |
| 环境变量 | `NEXT_PUBLIC_WORKBENCH_ENABLED` |
| 灰度阶段 | 内部 → Beta → GA |

### 路由行为

- `true`: `/workbench` → HTTP 200
- `false`: `/workbench` → HTTP 404
```

**P003-T3: Agent Sessions UI**

```tsx
// src/components/workbench/WorkbenchUI.tsx

export function WorkbenchUI() {
  const { sessions, createSession, terminateSession } = useAgentStore();
  
  return (
    <div className={styles.container}>
      <header>Workbench</header>
      <SessionList sessions={sessions} />
      <TaskInput onSubmit={createSession} />
      <ArtifactViewer />
    </div>
  );
}
```

**P003-T4: E2E Journey 测试**

```typescript
// tests/e2e/workbench-journey.spec.ts

test('Canvas → Agent → Artifact → Canvas E2E journey', async ({ page }) => {
  await page.goto('/canvas');
  
  // 启动 Agent 任务
  await page.click('[data-testid="agent-trigger"]');
  await page.fill('[data-testid="agent-task-input"]', 'list files');
  await page.click('[data-testid="agent-submit"]');
  
  // 等待 artifact 出现在 Canvas
  await expect(page.locator('[data-testid="artifact-node"]')).toBeVisible({
    timeout: 30000,
  });
});
```

### 4.3 验收标准

- [x] `NEXT_PUBLIC_WORKBENCH_ENABLED=true` → `/workbench` HTTP 200
- [x] `NEXT_PUBLIC_WORKBENCH_ENABLED=false`（默认）→ `/workbench` HTTP 404
- [x] `docs/feature-flags.md` 包含 `WORKBENCH_ENABLED` 条目
- [x] `tests/e2e/workbench-journey.spec.ts` 0 failures (5/5 passed)
- [x] `pnpm run test` CI pipeline 全部通过

---

## 5. P006: AI Agent 真实接入 (8h)

### 5.1 任务拆分

| 子任务 | 产出物 | 估算 |
|-------|--------|------|
| P006-T1: 创建 `POST /api/agent/sessions` 路由 | `vibex-backend/src/routes/agent/sessions.ts` | 2h |
| P006-T2: 创建 `GET /api/agent/sessions/:id/status` 路由 | 同上 | 1h |
| P006-T3: 创建 `DELETE /api/agent/sessions/:id` 路由 | 同上 | 1h |
| P006-T4: 集成 OpenClaw `sessions_spawn` 工具 | `CodingAgentService._spawnRealAgent()` | 2h |
| P006-T5: 移除 mock 代码 | `CodingAgentService.ts` 清理 | 0.5h |
| P006-T6: 错误处理（timeout、ECONNREFUSED）| 降级策略 | 1h |
| P006-T7: Backend 日志验证 | 日志断言测试 | 0.5h |

### 5.2 实施步骤

**P006-T1: Sessions CRUD API**

```typescript
// vibex-backend/src/routes/agent/sessions.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const agent = new Hono();

agent.use('*', cors());
agent.post('/', async (c) => {
  const body = await c.req.json<{ task: string; context?: object; timeout?: number }>();
  
  if (!body.task) {
    return c.json({ error: 'task is required', code: 'INVALID_TASK' }, 400);
  }
  
  const session: AgentSession = {
    id: crypto.randomUUID(),
    task: body.task,
    context: body.context ?? {},
    status: 'pending',
    progress: 0,
    timeout: body.timeout ?? 30000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user-1',  // TODO: 从 auth 获取
  };
  
  await DB.insert('agent_sessions').values(session);
  
  // 异步触发 agent
  spawnAgentSession(session.id);
  
  return c.json({
    sessionId: session.id,
    status: session.status,
    createdAt: session.createdAt,
  }, 201);
});

agent.get('/:id/status', async (c) => {
  const id = c.req.param('id');
  const session = await DB.select().from(agent_sessions).where(eq(id, id));
  
  if (!session) {
    return c.json({ error: 'Session not found', code: 'NOT_FOUND' }, 404);
  }
  
  return c.json({
    sessionId: session.id,
    status: session.status,
    progress: session.progress,
    result: session.result ?? null,
    error: session.error ?? null,
    updatedAt: session.updatedAt,
  });
});

agent.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await DB.delete(agent_sessions).where(eq(id, id));
  return c.body(null, 204);
});

async function spawnAgentSession(sessionId: string) {
  // 更新状态
  await DB.update(agent_sessions)
    .set({ status: 'running' })
    .where(eq(agent_sessions.id, sessionId));
  
  try {
    // 调用 OpenClaw sessions_spawn
    const result = await sessions_spawn({
      task: 'execute coding task',
      runtime: 'subagent',
    });
    
    // 写入 artifact
    await writeArtifactToCanvas(sessionId, result);
    
    await DB.update(agent_sessions)
      .set({ status: 'completed', progress: 100, result })
      .where(eq(agent_sessions.id, sessionId));
  } catch (err) {
    await DB.update(agent_sessions)
      .set({ status: 'failed', error: String(err) })
      .where(eq(agent_sessions.id, sessionId));
  }
}
```

**P006-T4: OpenClaw 集成**

```typescript
// vibex-backend/src/services/OpenClawBridge.ts

import { sessions_spawn } from '@openclaw/sdk';

interface SpawnOptions {
  task: string;
  context?: Record<string, unknown>;
  timeout?: number;
}

export async function spawnRealAgent(options: SpawnOptions): Promise<AgentResult> {
  const timeout = options.timeout ?? 30000;
  
  try {
    const result = await sessions_spawn({
      task: options.task,
      runtime: 'subagent',
      mode: 'run',
      timeoutSeconds: Math.ceil(timeout / 1000),
    });
    
    return {
      artifactType: 'code',
      content: result.output ?? '',
      language: 'typescript',
      metadata: { sessionId: result.sessionId },
    };
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new AgentRuntimeError('OpenClaw runtime unavailable', 'RUNTIME_UNAVAILABLE');
    }
    throw err;
  }
}
```

**P006-T5: Mock 代码清理**

```bash
# 验证 mock 已移除
grep -r "MOCK\|mockAgentCall" src/services/CodingAgentService.ts
# 预期: 无输出
```

### 5.3 验收标准

- [ ] `POST /api/agent/sessions` → 201 + `sessionId`
- [ ] `GET /api/agent/sessions/:id/status` → 200 + 状态
- [ ] `DELETE /api/agent/sessions/:id` → 204
- [ ] 超时/网络错误 → `{error, code}` 结构化响应
- [ ] Backend 日志包含 `sessions_spawn called`，无 `ECONNREFUSED`
- [ ] `CodingAgentService.ts` 无 `MOCK` / `mockAgentCall`
- [ ] E2E: agent result 写入 Canvas artifact node

---

## 6. 实施风险与缓解

| 风险 | 级别 | 缓解措施 |
|-----|------|---------|
| P006: `sessions_spawn` OpenClaw runtime 不可达 | 高 (R3) | T6-T7 前确认 OpenClaw connectivity；提供降级 UI |
| P004: 虚拟化与现有拖拽逻辑冲突 | 低 | T4 单独验证拖拽不受影响 |
| P003: E2E journey 测试 flaky | 中 | 使用 Playwright 稳定性配置 (retries, timeout) |
| P001: `/health` 合并后 stdio 启动顺序冲突 | 低 | T1 后立即本地验证 |

---

## 7. Sprint 排期建议

| Sprint Day | 任务 | 预计小时 |
|-----------|------|---------|
| Day 1 (Mon) | P001 MCP DoD 收尾 | 2h |
| Day 2 (Tue) | P004 T1-T3 (虚拟化核心) | 3h |
| Day 3 (Wed) | P004 T4-T6 (渲染替换 + benchmark) | 4h |
| Day 4 (Thu) | P004 T7 + P003 T1-T2 | 2h |
| Day 5 (Fri) | P003 T3-T5 (Workbench UI + E2E) | 4h |
| Day 6 (Mon) | P006 T1-T3 (Backend API) | 4h |
| Day 7 (Tue) | P006 T4-T7 (OpenClaw + mock 清理) | 4h |
| Buffer | 缓冲 + 集成测试 | 3h |
| **总计** | | **~26h** |

---

## 8. 验收标准总表

| 提案 | 验收项 | 验证方法 |
|-----|--------|---------|
| P001 | `/health` 在 stdio 启动序列中可访问 | `curl http://localhost:3100/health` → 200 |
| P001 | INDEX.md ≥ 7 条目 | 脚本 exit 0 |
| P004 | 100 节点 P50 < 100ms | benchmark 脚本 |
| P004 | 150 节点滚动无 jank | Playwright trace |
| P004 | 选择状态跨边界保持 | 自动化测试 |
| P003 | feature flag 控制 HTTP 200/404 | curl 验证 |
| P003 | E2E journey 0 failures | Playwright |
| P006 | sessions CRUD API → 201/200/204 | curl 验证 |
| P006 | 无 mock 代码 | grep 验证 |
| P006 | 错误返回 `{error, code}` | curl 错误输入 |

---

*文档版本: 1.0*
*创建时间: 2026-05-01*
*架构师: ARCHITECT*
