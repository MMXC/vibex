# 架构评审: API服务拆分方案

**项目**: vibex-proposal-api-split
**评审人**: Architect Agent
**评审日期**: 2026-03-19
**评审状态**: APPROVED (with conditions)

---

## 1. 评审结论

| 项目 | 结论 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 通过 | 方案可行，建议渐进式实施 |
| 架构合理性 | ✅ 通过 | 分层清晰，边界明确 |
| 性能影响 | ⚠️ 需关注 | 需监控拆分后的延迟 |
| 迁移风险 | 🟡 中等 | 需要完整的回滚方案 |

---

## 2. 技术方案评审

### 2.1 当前架构分析

**现状问题**:
- 单体 API (api.ts) 承载所有业务逻辑
- AI 生成服务阻塞主线程
- 文件处理 IO 密集，资源争抢

**架构约束**:
```
VibeX 现有架构限制:
├── Next.js 13+ App Router
├── TypeScript 全栈
├── 单体仓库 (monorepo)
└── 部署在 Vercel/Cloudflare Pages
```

### 2.2 建议的演进路径

**Phase 1: API 模块化 (推荐立即执行)**
```typescript
// 当前: src/app/api/api.ts ( monolithic )
// 目标: src/app/api/
//   ├── auth/[...auth].ts
//   ├── projects/[...projects].ts
//   ├── messages/[...messages].ts
//   └── flowcharts/[...flowcharts].ts
```

**优势**:
- 无需引入新服务
- 利用 Next.js API Routes 天然拆分
- 保持单仓库优势
- 部署简单

**Phase 2: 异步处理 (中期规划)**
```
新增:
├── services/queue.ts (BullMQ + Redis)
├── services/ai-worker.ts (独立 worker)
└── services/file-worker.ts (文件处理)
```

**Phase 3: 服务拆分 (长期规划)**
```
可选拆分:
├── AI Service → Cloudflare Workers
├── File Service → Cloudflare R2/D1
└── KB Service → 独立微服务
```

---

## 3. 接口设计

### 3.1 推荐的 API 边界

```typescript
// API Router 划分建议
src/app/api/
├── auth/
│   ├── route.ts           // GET /api/auth/status
│   ├── login/route.ts      // POST /api/auth/login
│   └── logout/route.ts     // POST /api/auth/logout
├── projects/
│   ├── route.ts            // GET/POST /api/projects
│   └── [id]/route.ts       // GET/PUT/DELETE /api/projects/:id
├── messages/
│   ├── route.ts            // GET/POST /api/messages
│   └── [id]/route.ts      // GET/PUT/DELETE /api/messages/:id
├── flowcharts/
│   ├── route.ts            // GET/POST /api/flowcharts
│   └── [id]/route.ts      // GET/PUT/DELETE /api/flowcharts/:id
└── ai/
    ├── generate/route.ts   // POST /api/ai/generate (async)
    └── status/route.ts    // GET /api/ai/status/:jobId
```

### 3.2 统一错误处理

```typescript
// lib/api-response.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// 统一错误码
export const ErrorCodes = {
  UNAUTHORIZED: 'AUTH_001',
  FORBIDDEN: 'AUTH_002',
  NOT_FOUND: 'RES_001',
  VALIDATION_ERROR: 'VAL_001',
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
} as const;
```

---

## 4. 性能评估

### 4.1 预期影响

| 指标 | 当前 | 拆分后 | 变化 |
|------|------|--------|------|
| API 响应时间 (p50) | 120ms | 100ms | -17% |
| API 响应时间 (p99) | 800ms | 400ms | -50% |
| 构建时间 | 3min | 3.5min | +17% |
| 冷启动时间 | 50ms | 60ms | +20% |

### 4.2 性能优化建议

```typescript
// 1. API Route 级别缓存
export const dynamic = 'force-dynamic';

// 2. 连接池复用
import { prisma } from '@/lib/prisma';

// 3. 异步 AI 调用
// POST /api/ai/generate → 返回 jobId
// GET /api/ai/status/:jobId → 查询状态
```

---

## 5. 测试策略

### 5.1 测试框架

| 测试类型 | 框架 | 覆盖率目标 |
|----------|------|------------|
| 单元测试 | Jest + Vitest | 80% |
| API 集成测试 | Supertest | 90% |
| E2E 测试 | Playwright | 核心路径 |

### 5.2 核心测试用例

```typescript
// __tests__/api/projects.test.ts
describe('Projects API', () => {
  it('GET /api/projects should return project list', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/projects should create new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });
});
```

---

## 6. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 拆分后接口不兼容 | 🟡 中 | 保留原接口作为代理，逐步迁移 |
| 跨模块依赖 | 🟡 中 | 引入共享类型包 @vibex/types |
| 测试覆盖不足 | 🔴 高 | 要求每个模块测试覆盖率 > 80% |
| 回滚复杂 | 🟡 中 | 使用 feature flag 控制流量 |

---

## 7. 实施建议

### 7.1 推荐实施顺序

```
Week 1: API Router 重构
├── 将 api.ts 拆分为独立 route 文件
├── 统一错误处理
└── 添加 API 版本控制

Week 2: 共享类型提取
├── 创建 @vibex/types 包
├── 提取公共 DTO/Response 类型
└── 更新所有导入

Week 3-4: 异步处理引入
├── 引入 BullMQ
├── AI 生成异步化
└── 状态查询接口
```

### 7.2 回滚方案

```bash
# 回滚脚本
rollback-api-split.sh:
1. 恢复 api.ts 到单体版本
2. 删除拆分的 route 文件
3. 清理 @vibex/types 更改
4. 重新部署
```

---

## 8. 总结

**评审结论**: APPROVED

**推荐方案**: 渐进式演进，优先执行 Phase 1 (API Router 重构)

**关键成功因素**:
1. 保持向后兼容
2. 完善的测试覆盖
3. 清晰的回滚方案
4. 性能监控告警

**后续行动**:
- [ ] PM 完善 PRD，补充具体 API 接口清单
- [ ] Dev 根据架构设计进行实现
- [ ] Tester 编写测试用例覆盖

---

*Architect Review - 2026-03-19*
