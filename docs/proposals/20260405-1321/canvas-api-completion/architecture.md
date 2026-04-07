# Architecture: Canvas API Completion

> **项目**: canvas-api-completion  
> **Architect**: Architect Agent  
> **日期**: 2026-04-05  
> **版本**: v1.0  
> **状态**: Proposed

---

## 1. 概述

### 1.1 问题陈述

前端 API 封装已完成 13 个端点定义，后端仅有 9/32 (28%) 端点实现，72% 缺失导致 Snapshot 功能和完整项目管理不可用。

### 1.2 技术目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| AC1 | API 覆盖率 28% → 100% | P0 |
| AC2 | Snapshot CRUD 功能可用 | P1 |
| AC3 | 所有端点测试通过 | P1 |

---

## 2. 系统架构

### 2.1 API 架构

```mermaid
flowchart TB
    subgraph Frontend["前端 API Client"]
        FC["canvasApi.ts<br/>13 个端点封装"]
    end

    subgraph Backend["后端 API Routes"]
        subgraph CRUD["CRUD Routes (E1)"]
            P["/api/projects"]
            C["/api/contexts"]
            F["/api/flows"]
            CM["/api/components"]
        end
        subgraph Snapshots["Snapshot Routes (E2)"]
            S["/api/snapshots"]
        end
        subgraph AI["AI Routes (E3)"]
            AI["/api/generate/*"]
        end
    end

    subgraph DB["Database Layer"]
        DB["Prisma / Drizzle ORM"]
    end

    FC --> |"HTTP"| P
    FC --> C
    FC --> F
    FC --> CM
    FC --> S
    FC --> AI

    P --> DB
    C --> DB
    F --> DB
    CM --> DB
    S --> DB
```

### 2.2 API 端点矩阵

| 资源 | Create | Read | Update | Delete | 状态 |
|-------|--------|-------|--------|--------|------|
| projects | POST / | GET /:id | PUT /:id | DELETE /:id | 缺失 |
| contexts | POST / | GET /:id | PUT /:id | DELETE /:id | 缺失 |
| flows | POST / | GET /:id | PUT /:id | DELETE /:id | 缺失 |
| components | POST / | GET /:id | PUT /:id | DELETE /:id | 缺失 |
| snapshots | POST / | GET /:id | PUT /:id | DELETE /:id | 缺失 |

---

## 3. 详细设计

### 3.1 E1: CRUD 端点实现

#### 3.1.1 Projects API

```typescript
// src/app/api/v1/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  }

  const projects = await db.project.findMany();
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await db.project.create({ data: body });
  return NextResponse.json(project, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await request.json();
  const project = await db.project.update({ where: { id }, data: body });
  return NextResponse.json(project);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

#### 3.1.2 Contexts/Flows/Components API

遵循与 Projects API 相同的模式，只是将 `project` 替换为对应的资源名称。

### 3.2 E2: Snapshot 端点

```typescript
// src/app/api/v1/snapshots/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const snapshots = await db.snapshot.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(snapshots);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const snapshot = await db.snapshot.create({
    data: {
      ...body,
      createdAt: new Date(),
    },
  });
  return NextResponse.json(snapshot, { status: 201 });
}
```

### 3.3 E3: AI 生成关联操作

```typescript
// src/app/api/v1/generate/contexts/route.ts
// 关联已生成的 contexts 到当前 project
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, contexts } = body;

  // 创建 contexts 并关联到 project
  const created = await db.$transaction(
    contexts.map((ctx: any) =>
      db.context.create({
        data: {
          ...ctx,
          projectId,
        },
      })
    )
  );

  return NextResponse.json({ success: true, created });
}
```

### 3.4 E4: 集成测试

```typescript
// src/tests/api/canvas-crud.test.ts
import { describe, it, expect } from 'vitest';

describe('Canvas API CRUD', () => {
  it('should create and retrieve project', async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Project' }),
    });
    expect(res.status).toBe(201);
    const project = await res.json();
    expect(project.id).toBeDefined();
  });

  it('should return 404 for non-existent project', async () => {
    const res = await fetch('/api/projects?id=non-existent');
    expect(res.status).toBe(404);
  });
});
```

---

## 4. API 错误处理

### 4.1 统一错误响应

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 错误处理中间件
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

---

## 5. 性能影响评估

| 指标 | 影响 | 说明 |
|------|------|------|
| 新增 CRUD 路由 | ~2KB | 极小 |
| 数据库查询 | ~10-50ms | 取决于数据量 |
| 事务操作 | ~20-100ms | Snapshot 批量创建 |
| **总计** | **< 200ms** | 无显著影响 |

---

## 6. 技术审查

### 6.1 PRD 覆盖检查

| PRD 目标 | 技术方案覆盖 | 缺口 |
|---------|------------|------|
| AC1: API 覆盖率 100% | ✅ 9 个 CRUD + 5 个 Snapshot | 无 |
| AC2: Snapshot CRUD 可用 | ✅ E2 Snapshot 端点 | 无 |
| AC3: 端点测试通过 | ✅ E4 集成测试 | 无 |

### 6.2 风险点

| 风险 | 等级 | 缓解 |
|------|------|------|
| 数据库 schema 未定义 | 🟠 中 | 需先定义 Prisma schema |
| 认证/授权未实现 | 🟠 中 | 先实现无权限版本 |
| 前端 API 调用未对齐 | 🟡 中 | 使用现有前端 API 封装 |

---

## 7. 验收标准映射

| Epic | Story | 验收标准 | 实现 |
|------|-------|----------|------|
| E1 | S1.1-S1.4 | `expect(status).toBe(200)` | CRUD routes |
| E2 | S2.1 | `expect(endpoints).toHaveLength(5)` | Snapshot routes |
| E3 | S3.1 | `expect(aiOps).toBeDefined()` | AI generate routes |
| E4 | S4.1 | `expect(e2e).toPass()` | Integration tests |

---

## 8. 实施计划

| Epic | 工时 | Sprint |
|------|------|--------|
| E1: CRUD 端点 | 6h | Sprint 1 |
| E2: Snapshot 端点 | 3h | Sprint 2 |
| E3: AI 生成关联 | 2h | Sprint 2 |
| E4: 集成测试 | 2h | Sprint 3 |

---

*本文档由 Architect Agent 生成 | 2026-04-05*
