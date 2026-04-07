# IMPLEMENTATION_PLAN: VibeX Analyst Proposals 2026-04-08

> **项目**: vibex-analyst-proposals-vibex-proposals-20260408  
> **作者**: architect agent  
> **日期**: 2026-04-08  
> **版本**: v1.0

---

## 1. 概述

本文档定义 5 个 Analyst 提案的完整实施计划，总工时 14h，分为 3 个 Sprint。

**目标受众**: Dev、Reviewer、Coord Agent  
**前置条件**: Hono 后端可访问、D1 数据库可用、Git 可用  
**成功标准**: 5 个提案全部落地，提案追踪机制正常运行

---

## 2. Sprint 总览

| Sprint | 周期 | 优先级 | 工时 | 主要交付 |
|--------|------|--------|------|----------|
| Sprint 1 | Day 1 | P0 | 6h | 提案追踪 + Snapshot CRUD |
| Sprint 2 | Day 2 | P1 | 4h | Changelog + Zustand Audit |
| Sprint 3 | Day 3 | P2 | 4h | Subagent Checkpoint |

---

## 3. Sprint 1: P0 修复（6h）

### 3.1 E1: 提案执行追踪（1h）

**文件**: `docs/proposals/TRACKING.md`（新建）

**内容格式**:
```markdown
# Proposal Tracking

## 活跃提案

| ID | 提案 | 优先级 | 状态 | 负责人 | 创建日期 | 更新日期 |
|----|------|--------|------|--------|----------|----------|
| A-P0-1 | 提案执行追踪 | P0 | proposed | — | 2026-04-08 | — |

## 状态说明
- proposed: 已提出，待评审
- in-progress: 实施中
- done: 已完成
- stale: 已废弃
- blocked: 阻塞

## 执行记录

### 2026-04-08
- A-P0-1: 创建提案追踪表
```

**执行步骤**:
1. 创建 `docs/proposals/` 目录
2. 创建 `TRACKING.md` 文件
3. 录入 2026-04-06 和 2026-04-07 全部提案
4. 设置初始状态为 `proposed`

**验收标准**:
- [x] `docs/proposals/TRACKING.md` 存在 ✅
- [x] 包含 2026-04-06 和 2026-04-07 全部提案（10 条） ✅
- [x] 每条提案有 `status` 和 `assignee` 字段 ✅

**执行人**: Dev

---

### 3.2 E2: Snapshot CRUD 端点（5h）

**目标文件**:
- `apps/backend/src/services/snapshotService.ts`（新建）
- `apps/backend/src/app/api/v1/canvas/snapshots/route.ts`（新建）
- `apps/backend/src/app/api/v1/canvas/snapshots/[id]/route.ts`（新建）
- `apps/backend/src/app/api/v1/canvas/snapshots/[id]/restore/route.ts`（新建）
- `apps/backend/src/app/api/v1/canvas/snapshots/latest/route.ts`（新建）

**3.2.1 T2.1: Prisma Schema 验证（0.5h）**

```bash
# 检查现有 schema
cat apps/backend/prisma/schema.prisma | grep -A 10 "CanvasSnapshot"

# 验证 schema 正确
npx prisma validate
```

**3.2.2 T2.2: SnapshotService 实现（1h）**

```typescript
// services/snapshotService.ts
import { Context } from 'hono';
import { getCuid } from '@/lib/cuid';

interface SnapshotRecord {
  id: string;
  projectId: string;
  name: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSnapshotInput {
  projectId: string;
  name: string;
  data: Record<string, unknown>;
}

export class SnapshotService {
  /**
   * 创建快照
   * @returns 新创建的快照 ID
   */
  static async create(
    env: CloudflareEnv,
    input: CreateSnapshotInput
  ): Promise<{ id: string; projectId: string; name: string; createdAt: string }> {
    const db = env.DB;
    const id = getCuid();
    const now = new Date().toISOString();
    
    await db
      .prepare(`
        INSERT INTO CanvasSnapshot (id, projectId, name, data, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(id, input.projectId, input.name, JSON.stringify(input.data), now, now)
      .run();

    return { id, projectId: input.projectId, name: input.name, createdAt: now };
  }

  /**
   * 列出项目的所有快照（时间倒序）
   */
  static async list(env: CloudflareEnv, projectId: string): Promise<SnapshotRecord[]> {
    const db = env.DB;
    const result = await db
      .prepare(`
        SELECT id, projectId, name, data, createdAt, updatedAt
        FROM CanvasSnapshot
        WHERE projectId = ?
        ORDER BY createdAt DESC
      `)
      .bind(projectId)
      .all();

    return result.results as SnapshotRecord[];
  }

  /**
   * 获取单个快照
   */
  static async get(env: CloudflareEnv, id: string): Promise<SnapshotRecord | null> {
    const db = env.DB;
    const result = await db
      .prepare('SELECT * FROM CanvasSnapshot WHERE id = ?')
      .bind(id)
      .first();

    return result as SnapshotRecord | null;
  }

  /**
   * 获取项目的最新快照
   */
  static async getLatest(env: CloudflareEnv, projectId: string): Promise<SnapshotRecord | null> {
    const db = env.DB;
    const result = await db
      .prepare(`
        SELECT * FROM CanvasSnapshot
        WHERE projectId = ?
        ORDER BY createdAt DESC
        LIMIT 1
      `)
      .bind(projectId)
      .first();

    return result as SnapshotRecord | null;
  }

  /**
   * 恢复快照
   * @returns 快照数据
   */
  static async restore(env: CloudflareEnv, id: string): Promise<{ success: boolean; data: string } | null> {
    const snapshot = await this.get(env, id);
    if (!snapshot) return null;

    return { success: true, data: snapshot.data };
  }

  /**
   * 删除快照
   */
  static async delete(env: CloudflareEnv, id: string): Promise<boolean> {
    const db = env.DB;
    const result = await db
      .prepare('DELETE FROM CanvasSnapshot WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }
}
```

**3.2.3 T2.3: 6 端点实现（2h）**

```typescript
// app/api/v1/canvas/snapshots/route.ts
import { Hono } from 'hono';
import { SnapshotService } from '@/services/snapshotService';
import { z } from 'zod';

const createSnapshotSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  data: z.record(z.unknown()),
});

const snapshots = new Hono<{ Bindings: CloudflareEnv }>();

// OPTIONS - CORS preflight
snapshots.options('/', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.body(null, 204);
});

// POST /snapshots - Create
snapshots.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createSnapshotSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error }, 400);
  }

  try {
    const result = await SnapshotService.create(c.env, parsed.data);
    return c.json(result, 201);
  } catch (err) {
    console.error('[snapshots/create]', err);
    return c.json({ error: 'Failed to create snapshot' }, 500);
  }
});

// GET /snapshots - List
snapshots.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  
  if (!projectId) {
    return c.json({ error: 'projectId is required' }, 400);
  }

  try {
    const snapshots = await SnapshotService.list(c.env, projectId);
    return c.json({ snapshots });
  } catch (err) {
    console.error('[snapshots/list]', err);
    return c.json({ error: 'Failed to list snapshots' }, 500);
  }
});

export default snapshots;
```

```typescript
// app/api/v1/canvas/snapshots/[id]/route.ts
import { Hono } from 'hono';
import { SnapshotService } from '@/services/snapshotService';

const snapshot = new Hono<{ Bindings: CloudflareEnv }>();

// GET /snapshots/:id
snapshot.get('/', async (c) => {
  const id = c.req.param('id');
  
  try {
    const result = await SnapshotService.get(c.env, id);
    if (!result) {
      return c.json({ error: 'Snapshot not found' }, 404);
    }
    return c.json(result);
  } catch (err) {
    console.error('[snapshots/get]', err);
    return c.json({ error: 'Failed to get snapshot' }, 500);
  }
});

// DELETE /snapshots/:id
snapshot.delete('/', async (c) => {
  const id = c.req.param('id');
  
  try {
    const deleted = await SnapshotService.delete(c.env, id);
    if (!deleted) {
      return c.json({ error: 'Snapshot not found' }, 404);
    }
    return c.body(null, 204);
  } catch (err) {
    console.error('[snapshots/delete]', err);
    return c.json({ error: 'Failed to delete snapshot' }, 500);
  }
});

export default snapshot;
```

```typescript
// app/api/v1/canvas/snapshots/[id]/restore/route.ts
import { Hono } from 'hono';
import { SnapshotService } from '@/services/snapshotService';

const restore = new Hono<{ Bindings: CloudflareEnv }>();

// POST /snapshots/:id/restore
restore.post('/', async (c) => {
  const id = c.req.param('id');
  
  try {
    const result = await SnapshotService.restore(c.env, id);
    if (!result) {
      return c.json({ error: 'Snapshot not found' }, 404);
    }
    return c.json({ success: true, snapshotId: id, data: result.data });
  } catch (err) {
    console.error('[snapshots/restore]', err);
    return c.json({ error: 'Failed to restore snapshot' }, 500);
  }
});

export default restore;
```

```typescript
// app/api/v1/canvas/snapshots/latest/route.ts
import { Hono } from 'hono';
import { SnapshotService } from '@/services/snapshotService';

const latest = new Hono<{ Bindings: CloudflareEnv }>();

// GET /snapshots/latest?projectId=x
latest.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  
  if (!projectId) {
    return c.json({ error: 'projectId is required' }, 400);
  }

  try {
    const result = await SnapshotService.getLatest(c.env, projectId);
    if (!result) {
      return c.json({ error: 'No snapshots found' }, 404);
    }
    return c.json(result);
  } catch (err) {
    console.error('[snapshots/latest]', err);
    return c.json({ error: 'Failed to get latest snapshot' }, 500);
  }
});

export default latest;
```

**3.2.4 T2.4: CORS OPTIONS（0.5h）**

在 `gateway.ts` 中添加（如果尚未存在）:

```typescript
// Snapshot 端点 OPTIONS
protected_.options('/canvas/snapshots/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});
```

**3.2.5 T2.5: Jest 测试（1h）**

```typescript
// __tests__/snapshotService.test.ts
import { SnapshotService } from '@/services/snapshotService';

describe('SnapshotService', () => {
  const mockEnv = {
    DB: {
      prepare: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a snapshot and returns id', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: jest.fn().mockReturnValue({
          run: jest.fn().mockResolvedValue({ success: true }),
        }),
      });

      const result = await SnapshotService.create(mockEnv, {
        projectId: 'proj-123',
        name: 'Test Snapshot',
        data: { nodes: [], edges: [] },
      });

      expect(result.id).toMatch(/^cm/);
      expect(result.projectId).toBe('proj-123');
      expect(result.name).toBe('Test Snapshot');
    });
  });

  describe('list', () => {
    it('returns snapshots in descending order', async () => {
      const mockSnapshots = [
        { id: 'snap-2', projectId: 'proj-123', name: 'Snap 2', data: '{}', createdAt: '2026-04-08T02:00:00Z', updatedAt: '2026-04-08T02:00:00Z' },
        { id: 'snap-1', projectId: 'proj-123', name: 'Snap 1', data: '{}', createdAt: '2026-04-08T01:00:00Z', updatedAt: '2026-04-08T01:00:00Z' },
      ];

      mockEnv.DB.prepare.mockReturnValue({
        bind: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue({ results: mockSnapshots }),
        }),
      });

      const result = await SnapshotService.list(mockEnv, 'proj-123');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('snap-2');
    });
  });

  describe('getLatest', () => {
    it('returns the most recent snapshot', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue({
            id: 'snap-1',
            projectId: 'proj-123',
            name: 'Latest',
            data: '{}',
            createdAt: '2026-04-08T01:00:00Z',
          }),
        }),
      });

      const result = await SnapshotService.getLatest(mockEnv, 'proj-123');
      expect(result?.id).toBe('snap-1');
    });
  });

  describe('delete', () => {
    it('deletes and returns true', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: jest.fn().mockReturnValue({
          run: jest.fn().mockResolvedValue({ success: true }),
        }),
      });

      const result = await SnapshotService.delete(mockEnv, 'snap-123');
      expect(result).toBe(true);
    });
  });
});
```

**验收标准**:
- [ ] `POST /api/v1/canvas/snapshots` 返回 201
- [ ] `GET /api/v1/canvas/snapshots?projectId=x` 返回数组
- [ ] `GET /api/v1/canvas/snapshots/:id` 返回快照
- [ ] `POST /api/v1/canvas/snapshots/:id/restore` 返回数据
- [ ] `GET /api/v1/canvas/snapshots/latest?projectId=x` 返回最新
- [ ] `DELETE /api/v1/canvas/snapshots/:id` 返回 204
- [ ] `curl -X OPTIONS /api/v1/canvas/snapshots` 返回 204
- [ ] `pnpm test --testPathPattern="snapshot"` 通过

**执行人**: Dev

---

## 4. Sprint 2: P1 改进（4h）

### 4.1 E3: Changelog 补录 + 规范（1h）

**4.1.1 T3.1: 补录 Changelog（0.5h）**

```bash
# 获取 2026-04-06 和 2026-04-07 的 commits
git log --since='2026-04-06' --until='2026-04-08' --oneline

# 获取每个 commit 的 Epic 标签
git log --since='2026-04-06' --until='2026-04-08' --format='%h %s %E'
```

**4.1.2 T3.2: 更新 CLAUDE.md（0.5h）**

在 `CLAUDE.md` 中添加:

```markdown
## Changelog 规范

**强制规则**: 每完成一个 Epic 必须更新 `CHANGELOG.md`。

**更新时机**: Epic 审查通过后、PR 合并前。

**格式**:
```markdown
### Added (EPIC-NAME E#: Story 描述) — YYYY-MM-DD
- **E# Story**: 具体变更
- **提交**: \`COMMIT_HASH\`
```

**禁止**: 
- ❌ PR 合并后忘记更新 Changelog
- ❌ Changelog 与实际 commit 不符
```

**验收标准**:
- [ ] `CHANGELOG.md` 包含 2026-04-06 和 2026-04-07 全部 Epic
- [ ] `CLAUDE.md` 包含 Changelog 规范

**执行人**: Dev

---

### 4.2 E4: Zustand Audit Phase1（3h）

**4.2.1 T4.1: 编写 stores/audit.md（2h）**

```bash
# 列出所有 stores
find apps/frontend/src/stores -name "*.ts" | xargs -I {} basename {} .ts | sort

find apps/frontend/src/lib/canvas/stores -name "*.ts" | xargs -I {} basename {} .ts | sort
```

**stores/audit.md 模板**:
```markdown
# Zustand Store Audit

## 目录结构

### /src/stores/ (全局状态)
| Store | 状态字段 | 用途 |
|-------|---------|------|
| designStore | nodes, edges, selectedNodeIds | 画布节点管理 |
| previewStore | schema, syncEnabled | 预览状态 |

### /lib/canvas/stores/ (Canvas 专用)
| Store | 状态字段 | 用途 |
|-------|---------|------|
| useDesignFlowStore | nodes, edges | 流程设计 |
| useComponentStore | componentNodes, selectedNodeIds | 组件管理 |

## 重叠分析

| 状态域 | /src/stores/ | /lib/canvas/stores/ | 重叠字段 | 推荐处理 |
|--------|-------------|-------------------|----------|----------|
| 节点选择 | designStore.selectedNodeIds | useComponentStore.selectedNodeIds | selectedNodeIds | alias |
| 流程数据 | designStore.nodes | useDesignFlowStore.nodes | nodes | alias |

## 迁移计划

### Phase 1 (当前): 分析 + 别名
- [x] stores/audit.md 识别重叠
- [ ] alias.ts 向后兼容别名

### Phase 2: Read-only Wrapper
- 旧 stores 改为从 canvas/stores 读取

### Phase 3: 移除旧 stores
- 删除 /src/stores/ 中的重复定义
```

**4.2.2 T4.2: 创建 alias.ts（1h）**

```typescript
// apps/frontend/src/lib/canvas/stores/alias.ts
/**
 * Zustand Store Aliases — 向后兼容层
 * 
 * Phase 1: 向后兼容别名，避免大量修改现有代码
 * 未来 Phase 2/3 将逐步迁移并移除别名
 */

// Canvas 专用 stores
export {
  useDesignFlowStore as useFlowStore,
  useDesignFlowStore as useDesignFlowStoreAlias,
} from './designStore';

export {
  useComponentStore as useComponentStoreAlias,
  useComponentStore as useCanvasComponentStore,
} from './componentStore';

export {
  useCanvasPreviewStore as usePreviewStoreAlias,
} from './canvasPreviewStore';

// 如果 designStore 是新的规范 store
// export { useDesignStore as useDesignStore } from './designStore';

// 如果 canvasStore 是旧的
export {
  useDesignCanvasStore as useCanvasStore,
} from './designCanvasStore';
```

**验收标准**:
- [ ] `stores/audit.md` 存在且完整
- [ ] `alias.ts` TypeScript 编译通过
- [ ] `pnpm build` 无新增错误

**执行人**: Dev

---

## 5. Sprint 3: P2 优化（4h）

### 5.1 E5: Subagent Checkpoint（4h）

**5.1.1 T5.1: checkpoint.sh 脚本（2h）**

```bash
#!/bin/bash
# checkpoint.sh — Subagent Checkpoint Manager
# 用法: checkpoint.sh <task_id> <phase> [metadata]

set -e

TASK_ID="${1:-}"
PHASE="${2:-unknown}"
METADATA="${3:-}"
CHECKPOINT_DIR="${CHECKPOINT_DIR:-/root/.openclaw/checkpoints}"
TIMESTAMP=$(date +%s)
DATE=$(date -Iseconds)

if [ -z "$TASK_ID" ]; then
  echo "Usage: checkpoint.sh <task_id> <phase> [metadata]"
  exit 1
fi

mkdir -p "$CHECKPOINT_DIR"

CHECKPOINT_FILE="$CHECKPOINT_DIR/${TASK_ID}.json"

# 写入 checkpoint
cat > "$CHECKPOINT_FILE" << EOF
{
  "taskId": "$TASK_ID",
  "phase": "$PHASE",
  "timestamp": $TIMESTAMP,
  "date": "$DATE",
  "metadata": "$METADATA",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "workingDir": "$(pwd)"
}
EOF

echo "[CHECKPOINT] Saved: $TASK_ID @ $PHASE ($DATE)"
echo "File: $CHECKPOINT_FILE"

# 验证写入
if [ -f "$CHECKPOINT_FILE" ]; then
  echo "[CHECKPOINT] Verified: $(cat $CHECKPOINT_FILE | head -1)..."
else
  echo "[ERROR] Checkpoint file not created!"
  exit 1
fi
```

**5.1.2 T5.2: WIP Commit 规范（1h）**

在 Agent 协作规范中添加:

```markdown
## Subagent WIP Commit 规范

**触发条件**: 子代理运行时间 > 15 分钟

**WIP Commit 格式**:
```bash
git add -A
git commit -m "WIP: $AGENT_NAME $TASK_ID checkpoint $(date +%H%M)"
```

**Squash 规则**:
- 任务完成后自动 squash 所有 WIP commits
- 使用 `git rebase -i HEAD~N` 合并
- 最终 commit message 使用规范格式
```

**5.1.3 T5.3: 超时恢复验证（1h）**

```bash
#!/bin/bash
# restore_checkpoint.sh — 从 checkpoint 恢复任务
# 用法: restore_checkpoint.sh <task_id>

set -e

TASK_ID="${1:-}"
CHECKPOINT_DIR="${CHECKPOINT_DIR:-/root/.openclaw/checkpoints}"

if [ -z "$TASK_ID" ]; then
  echo "Usage: restore_checkpoint.sh <task_id>"
  exit 1
fi

CHECKPOINT_FILE="$CHECKPOINT_DIR/${TASK_ID}.json"

if [ ! -f "$CHECKPOINT_FILE" ]; then
  echo "[ERROR] No checkpoint found for task: $TASK_ID"
  exit 1
fi

echo "[RESTORE] Found checkpoint:"
cat "$CHECKPOINT_FILE"

# 解析 checkpoint
PHASE=$(cat "$CHECKPOINT_FILE" | grep -o '"phase": "[^"]*"' | cut -d'"' -f4)
GIT_COMMIT=$(cat "$CHECKPOINT_FILE" | grep -o '"gitCommit": "[^"]*"' | cut -d'"' -f4)
WORKING_DIR=$(cat "$CHECKPOINT_FILE" | grep -o '"workingDir": "[^"]*"' | cut -d'"' -f4)

echo "[RESTORE] Phase: $PHASE"
echo "[RESTORE] Git commit: $GIT_COMMIT"
echo "[RESTORE] Working dir: $WORKING_DIR"

# 恢复 git 状态
if [ "$GIT_COMMIT" != "unknown" ]; then
  cd "$WORKING_DIR"
  git checkout "$GIT_COMMIT" 2>/dev/null || echo "[WARN] Could not checkout commit"
fi

echo "[RESTORE] Done. Resume from phase: $PHASE"
```

**验收标准**:
- [ ] `checkpoint.sh` 可执行且正常保存 checkpoint
- [ ] 模拟 30s 超时后，`/root/.openclaw/checkpoints/$task_id.json` 存在
- [ ] `restore_checkpoint.sh` 可从 checkpoint 恢复
- [ ] WIP commits 在任务完成后被 squash

**执行人**: Dev / Coord

---

## 6. 依赖关系图

```
E1 (提案追踪)
    ↓
E2 (Snapshot CRUD)
    ↓ (独立)
E3 (Changelog)
    ↓ (独立)
E4 (Zustand Audit)
    ↓ (独立)
E5 (Subagent Checkpoint)
```

---

## 7. 验收标准总表

| Task | 验收标准 | 测试方法 |
|------|----------|----------|
| E1 | TRACKING.md 存在且完整（10条提案） | ✅ 文件检查 |
| E2-T2.2 | SnapshotService 编译通过 | tsc --noEmit |
| E2-T2.3 | 6 端点可调用 | curl 测试 |
| E2-T2.4 | OPTIONS 返回 204 | curl -X OPTIONS |
| E2-T2.5 | Jest 测试通过 | pnpm test |
| E3-T3.1 | CHANGELOG 完整 | git log 对比 |
| E3-T3.2 | CLAUDE.md 包含规范 | grep |
| E4-T4.1 | stores/audit.md 存在 | 文件检查 |
| E4-T4.2 | alias.ts 编译通过 | tsc --noEmit |
| E5-T5.1 | checkpoint.sh 可执行 | 脚本测试 |
| E5-T5.2 | WIP commits squash | git log |
| E5-T5.3 | 恢复测试通过 | 模拟超时 |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
