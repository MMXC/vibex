# Architect Analysis — 2026-04-11

**Agent**: architect
**项目**: vibex-architect-proposals-vibex-proposals-20260411
**产出**: docs/vibex-architect-proposals-vibex-proposals-20260411/analysis.md

---

## 1. 业务场景分析

### 1.1 项目定位
VibeX 是 AI 驱动的 DDD 产品建模平台，核心能力：
```
对话式需求输入 → AI 领域建模 → 可视化流程图 + 原型页面 → 协作编辑
```

### 1.2 技术栈现状
| 层级 | 技术 | 状态 |
|------|------|------|
| 前端 | Next.js 15 (App Router) + Zustand + TanStack Query | 活跃开发 |
| 后端 | Cloudflare Workers + Next.js API Routes + Hono Gateway | 双框架并行 |
| 数据库 | Cloudflare D1 (SQLite) + Prisma | 已部署 |
| AI | MiniMax API (流式 SSE) | 核心能力 |
| 协作 | WebSocket (ConnectionPool + MessageRouter) | 新增功能 |
| 类型共享 | `packages/types` (@vibex/types) | 未启用 |
| MCP | @modelcontextprotocol/sdk 0.5.0 | 初始集成 |

### 1.3 关键业务风险

| 风险 | 描述 | 影响 |
|------|------|------|
| API 版本分裂 | v0/v1 双路由维护，contract 测试加倍 | P0 — 开发效率 |
| 连接泄露 | WebSocket 无连接数上限，生产环境可能 OOM | P0 — 服务稳定性 |
| 类型孤岛 | packages/types 无法被消费，Schema drift 持续 | P1 — 类型安全 |
| 路由冲突 | Hono + Next.js 双路由系统，中间件行为不一致 | P1 — 认证安全 |
| 压缩失真 | 上下文压缩质量无评估，AI 输出质量不可控 | P2 — 产品体验 |
| 提示词注入 | 代码模式用字符串匹配，eval 等关键词存在误判 | P2 — 安全 |
| MCP 监控盲区 | MCP Server 无健康检查，故障不可感知 | P2 — 可靠性 |

---

## 2. 技术方案选项（≥2 个）

### 2.1 API v0/v1 双路由治理（A-P0-1）

#### 方案一：渐进式废弃 v0（推荐）

```
Phase 1: 标记 v0 为 deprecated（添加 Deprecation header）
Phase 2: 新功能仅在 v1 实现
Phase 3: 监控 v0 使用率，降至 <5% 后移除
```

**优点**: 低风险平滑迁移，不影响现有用户
**缺点**: 过渡期需维护两套，需要监控基础设施
**工时**: 4h

#### 方案二：立即合并 v0 → v1

```
保留 v1，删除 v0 对应文件
统一所有前端调用到 v1 前缀
```

**优点**: 立即消除重复，降低维护成本
**缺点**: 可能破坏已有用户/集成方，Breaking change
**工时**: 8h（含回归测试）

#### 方案三：API Gateway 统一入口

```
反向代理层统一路由规则：
  /api/* → v1 (新实现)
  /api/v1/* → v1
废弃代码库中的 v0 文件
```

**优点**: 从架构层面统一，无需修改业务代码
**缺点**: 需要额外的网关层配置
**工时**: 6h

---

### 2.2 WebSocket ConnectionPool 连接治理（A-P0-2）

#### 方案一：添加连接限制 + 心跳机制（推荐）

```typescript
// connectionPool.ts
interface PoolConfig {
  maxConnections: number;    // 默认 1000
  heartbeatInterval: number;  // 默认 30s
  connectionTimeout: number;  // 默认 5min 无活动 → 关闭
}

// 添加健康检查端点
GET /api/ws/health → { activeConnections, maxConnections, uptime }
```

**优点**: 防止资源耗尽，支持监控
**缺点**: 需要测试边界情况
**工时**: 6h（含集成测试）

#### 方案二：迁移到 Cloudflare Durable Objects

```
使用 Durable Objects 管理连接状态
天然支持边缘分布和状态同步
```

**优点**: Cloudflare 原生方案，可扩展性强
**缺点**: Durable Objects 定价模型，需重构现有逻辑
**工时**: 12h

#### 方案三：简化协作方案，移除自建 WebSocket

```
改用 Cloudflare Pusher / Ably 等托管实时服务
前端订阅 channel，后端通过 webhook 推送
```

**优点**: 无运维负担，专注业务
**缺点**: 额外 SaaS 成本，延迟略高
**工时**: 8h

---

### 2.3 `packages/types` 集成（A-P1-1）

#### 方案一：在 workspace 内部启用类型共享（推荐）

```yaml
# packages/types/package.json 新增
"exports": {
  ".": "./dist/index.js"
}

# vibex-backend/package.json 新增依赖
"@vibex/types": "workspace:*"

# 在 API routes 中使用
import { type CanvasGenerateRequest } from '@vibex/types/schemas/canvas';
```

**优点**: 无需发布 npm，workspace 内直接共享
**缺点**: 需要 build packages/types 到 dist/
**工时**: 3h

#### 方案二：发布到私有 npm registry

```
pnpm -r publish --access public --registry https://npm.vibex.top
```

**优点**: 正式版本控制，可跨项目复用
**缺点**: 需要维护私有 registry，增加发布流程
**工时**: 5h

---

### 2.4 Hono + Next.js 双路由系统收敛（A-P1-2）

#### 方案一：全面迁移到 Next.js App Router（推荐）

```
保留 src/app/api/ 路由（Hono 风格）
废弃 src/routes/ 中的 Hono 路由文件
统一 auth middleware 到 Next.js middleware
```

**优点**: 单一技术栈，降低认知负担
**缺点**: Hono 特性（如快速中间件链）需手动实现
**工时**: 8h

#### 方案二：Hono Gateway 作为主入口

```
Hono 路由为主，Next.js routes 降级为 fallback
整合 auth、rate-limit 到 Hono middleware
```

**优点**: Hono 性能更好，路由定义更清晰
**缺点**: 需要迁移所有 Next.js routes 到 Hono
**工时**: 16h

#### 方案三：明确边界，分层治理

```
Hono: 外部 API 网关（auth、rate-limit、CORS）
Next.js: 内部业务 API
严格禁止两套系统访问相同资源
```

**优点**: 渐进式，无需大规模重构
**缺点**: 两套系统共存，长期技术债
**工时**: 4h（仅清理）

---

### 2.5 Context CompressionEngine 质量保障（A-P2-1）

#### 方案一：引入压缩质量评分（推荐）

```typescript
// 在 CompressionEngine 中添加
interface CompressionReport {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  keyConceptsPreserved: string[];  // 通过 NER 提取关键领域概念
  qualityScore: number;            // 0-100
}

// 触发条件：qualityScore < 70 时降级到 full context
```

**优点**: 可观测压缩质量，阈值可调
**缺点**: 增加 LLM 调用（质量评估）
**工时**: 5h

#### 方案二：分层压缩策略

```
Level 1 (preserve-all): < 50 messages → 不压缩
Level 2 (smart): 50-200 messages → ImportanceScorer 过滤
Level 3 (aggressive): > 200 messages → 强制摘要 + 保留最近 50
```

**优点**: 简单有效，逻辑清晰
**缺点**: 固定阈值可能不适配所有场景
**工时**: 3h

---

### 2.6 Prompts 安全加固（A-P2-2）

#### 方案一：AST 解析替代字符串匹配（推荐）

```typescript
// 替换 code-review.ts 中的正则匹配
import { parse } from '@babel/parser';

function analyzeCodeSecurity(code: string): SecurityReport {
  const ast = parse(code, { sourceType: 'module' });
  return traverse(ast, {
    CallExpression: (path) => {
      if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'eval') {
        report.unsafeEval.push(getSource(path.node));
      }
    }
  });
}
```

**优点**: 精确识别，无误判
**缺点**: 增加 @babel/parser 依赖
**工时**: 4h

#### 方案二：沙箱执行 + 输出校验

```
在临时隔离环境中执行代码片段
检查执行结果是否包含恶意模式
```

**优点**: 深度安全，不依赖静态分析
**缺点**: 性能开销大，需要额外基础设施
**工时**: 8h

---

### 2.7 MCP Server 可观测性（A-P2-3）

#### 方案一：添加健康检查 + structured logging（推荐）

```typescript
// MCP server 添加
app.get('/health', () => ({
  status: 'ok',
  version: process.env.MCP_VERSION,
  connectedClients: connectionPool.size,
  uptime: process.uptime()
}));

// 统一日志格式（JSON structured）
logger.info('tool_called', { tool: name, duration: ms, success: true });
```

**优点**: 最小改动，最大可观测性提升
**缺点**: 需要日志聚合基础设施
**工时**: 3h

#### 方案二：集成到主系统健康检查

```
在 vibex-backend 健康检查端点中添加 MCP 状态
MCP 作为独立服务，但状态汇报给主系统
```

**优点**: 统一监控入口
**缺点**: 耦合增加
**工时**: 5h

---

## 3. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| API v0 迁移导致 Breaking Change | 中 | 高 | 方案一渐进废弃，设置观察期 |
| WebSocket 连接泄露 OOM | 低 | 极高 | 方案一添加限制 + 监控 |
| packages/types 引入循环依赖 | 低 | 中 | 先在小模块试点 |
| Hono/Next.js 路由迁移破坏 Auth | 高 | 高 | 方案三分层，暂不移除 |
| 压缩质量下降影响 AI 输出 | 中 | 中 | A/B 测试 + 用户反馈 |
| 提示词 AST 解析误判合法代码 | 低 | 低 | 保留 fallback 到规则匹配 |

---

## 4. 验收标准

### A-P0-1
- [ ] v0 路由返回 `Deprecation` header
- [ ] v1 路由覆盖所有 v0 端点
- [ ] Contract test 仅在 v1 上运行

### A-P0-2
- [ ] `maxConnections` 配置生效，超限时返回 503
- [ ] 死连接 5min 内自动关闭
- [ ] `/api/ws/health` 端点返回连接统计

### A-P1-1
- [ ] `vibex-backend` import `@vibex/types` 成功编译
- [ ] `vibex-fronted` import `@vibex/types` 成功编译
- [ ] 移除手写的重复类型定义

### A-P1-2
- [ ] `src/routes/` 目录迁移完毕，文件数减少 ≥50%
- [ ] Auth middleware 在两套系统中行为一致（通过集成测试验证）

### A-P2-1
- [ ] `CompressionEngine` 输出包含 `qualityScore`
- [ ] qualityScore < 70 时触发全量上下文

### A-P2-2
- [ ] `eval`/`new Function` 检测误报率 < 1%（通过测试集验证）
- [ ] AST 解析性能 < 50ms/文件

### A-P2-3
- [ ] MCP Server `/health` 端点可访问
- [ ] Structured log 输出到标准输出

---

## 5. 工时估算汇总

| 提案 | 推荐方案 | 工时 | 依赖 |
|------|---------|------|------|
| A-P0-1 | 方案一（渐进废弃） | 4h | 无 |
| A-P0-2 | 方案一（连接限制） | 6h | 无 |
| A-P1-1 | 方案一（workspace 共享） | 3h | 无 |
| A-P1-2 | 方案三（分层治理） | 4h | 无 |
| A-P2-1 | 方案一（质量评分） | 5h | 无 |
| A-P2-2 | 方案一（AST 解析） | 4h | 无 |
| A-P2-3 | 方案一（健康检查） | 3h | 无 |
| **合计** | | **29h** | |
