# VibeX API 变更追踪系统 - 分析报告

**项目**: VibeX  
**分析日期**: 2026-03-06  
**分析目标**: API 变更追踪需求分析  
**验证命令**: `test -f docs/vibex-api-change-tracker/analysis.md`

---

## 1. 项目现状分析

### 1.1 技术栈概览

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| 后端框架 | Hono + Next.js | 使用 Hono 构建 API 路由 |
| 前端框架 | React 19 + Next.js 16 | - |
| 数据库 | SQLite (D1/Prisma) | - |
| API 文档 | OpenAPI 3.0.3 | 位于 `docs/api-contract.yaml` |
| CI/CD | GitHub Actions | 现有安全扫描工作流 |

### 1.2 现有 API 结构

```
vibex-backend/src/routes/
├── auth/           # 认证 (login, register, logout)
├── projects.ts     # 项目 CRUD
├── pages.ts        # 页面管理
├── messages.ts     # 消息列表
├── flows.ts        # 流程图数据
├── agents.ts       # Agent 管理
├── chat.ts         # 对话接口
└── ... (40+ 路由文件)
```

### 1.3 现有 API 文档状态

- **位置**: `docs/api-contract.yaml` (26926 bytes)
- **版本**: OpenAPI 3.0.3
- **状态**: 手动维护，存在前后端不一致 (见 API Contract 差异表)

---

## 2. OpenAPI 生成分析

### 2.1 现有方案评估

| 方案 | 优点 | 缺点 | 适用性 |
|-----|------|------|--------|
| 手动维护 yaml/json | 完全控制 | 不同步、难维护 | ❌ 不推荐 |
| Hono + @hono/zod-openapi | 类型安全、自动生成 | 需改造现有路由 | ✅ 推荐 |
| tsoa | 装饰器驱动 | 需增加 decorator | ⚠️ 需评估 |
| swagger-jsdoc | JSDoc 注释 | 需大量注释改造 | ⚠️ 复杂度高 |

### 2.2 推荐方案: Hono + Zod OpenAPI

**理由**:
1. Hono 已是项目后端框架
2. 可渐进式改造，无需重写现有路由
3. Zod 已在项目中用于请求验证
4. 支持自动生成 OpenAPI JSON/YAML

**集成方式**:
```typescript
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { createProjectSchema } from './schema';

const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: 'post',
    path: '/projects',
    tags: ['Projects'],
    summary: '创建项目',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createProjectSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: '项目创建成功',
        content: {
          'application/json': {
            schema: projectSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    // handler
  }
);

// 自动生成 OpenAPI 文档
app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    title: 'VibeX API',
    version: '1.0.0',
  },
});
```

### 2.3 迁移策略

| 阶段 | 任务 | 工作量 |
|-----|------|--------|
| Phase 1 | 安装 @hono/zod-openapi | 0.5d |
| Phase 2 | 创建共享 Schema 文件 | 1d |
| Phase 3 | 改造核心路由 (auth, projects) | 2d |
| Phase 4 | 改造其他路由 | 3d |
| Phase 5 | CI 集成自动生成 | 1d |

---

## 3. 变更检测分析

### 3.1 需求场景

1. **API 签名变更**: 路径、参数、响应结构变化
2. **字段类型变更**: 字段类型变化可能破坏前端
3. **字段增删**: 新增/删除字段
4. **枚举值变更**: 枚举值变化

### 3.2 检测方案

| 方案 | 原理 | 优点 | 缺点 |
|-----|------|------|------|
| JSON Schema Diff | 比较 OpenAPI schema | 精确 | 需标准化 schema |
| openapi-diff | 专用工具 | 功能完善 | 可能有误报 |
| 自定义脚本 | 解析 yaml + 语义比较 | 灵活 | 需开发 |

### 3.3 推荐方案: openapi-diff

**工具**: [openapi-diff](https://github.com/QuadStingray/openapi-diff)

**集成方式**:
```yaml
# .github/workflows/api-change-detect.yml
name: API Change Detection
on:
  pull_request:
    paths:
      - 'docs/api-contract.yaml'
      - 'openapi.json'

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run API Diff
        uses: Orpheus-007/openapi-diff@main
        with:
          base: ${{ github.event.inputs.base }}
          head: ${{ github.event.inputs.head }}
          fail-on-incompatible: true
          include-incompatible-breaking: true
          
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            // Post diff results as PR comment
```

### 3.4 变更类型分类

| 级别 | 定义 | 动作 |
|-----|------|------|
| Breaking | 不兼容变更 | 阻止合并 |
| Potentially Breaking | 可能不兼容 | 警告 |
| Non Breaking | 兼容变更 | 通过 |

---

## 4. CI 集成分析

### 4.1 现有 CI 状态

```
.github/workflows/
├── secrets-scan.yml    # 密钥扫描
└── security-audit.yml  # 依赖安全审计
```

### 4.2 推荐 CI Pipeline

```yaml
# .github/workflows/api-contract.yml
name: API Contract Validation

on:
  push:
    branches: [main]
    paths:
      - 'vibex-backend/src/routes/**'
  pull_request:
    paths:
      - 'vibex-backend/src/routes/**'

jobs:
  openapi-generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Dependencies
        run: |
          cd vibex-backend
          npm ci
          
      - name: Generate OpenAPI Spec
        run: npm run openapi:generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Check for Changes
        id: git-diff
        run: |
          if ! git diff --quiet openapi.json; then
            echo "changed=true" >> $GITHUB_OUTPUT
            git diff openapi.json > api-diff.txt
          fi
          
      - name: Upload Artifacts
        if: steps.git-diff.outputs.changed == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: api-diff
          path: api-diff.txt
          
      - name: Fail on Breaking Changes
        if: steps.git-diff.outputs.changed == 'true'
        run: |
          echo "❌ API Contract has changed. Review the diff above."
          exit 1
```

### 4.3 GitHub Actions 集成要点

| 触发条件 | 说明 |
|---------|------|
| push main | 更新基准 OpenAPI |
| PR | 检测变更并评论 |
| 定时 (可选) | 检测依赖 API 变更 |

---

## 5. 通知机制分析

### 5.1 通知需求

| 场景 | 通知对象 | 渠道 |
|-----|---------|------|
| Breaking Change | 所有开发者 | Slack/Email |
| 非 Breaking | API 消费者 | 内部通知 |
| 合并阻塞 | PR 作者 | GitHub Comment |

### 5.2 通知方案

```typescript
// lib/api-change-notifier.ts
interface APINotification {
  type: 'breaking' | 'warning' | 'info';
  changes: Change[];
  author: string;
  prUrl: string;
  timestamp: Date;
}

export async function notifyAPiChange(notification: APINotification): Promise<void> {
  const message = formatMessage(notification);
  
  // GitHub PR Comment (always)
  await githubClient.postComment(notification.prUrl, message);
  
  // Slack (for breaking changes)
  if (notification.type === 'breaking') {
    await slackClient.postMessage({
      channel: '#api-changes',
      text: message,
      blocks: formatSlackBlocks(notification)
    });
  }
  
  // Email (optional, for critical)
  if (notification.type === 'breaking') {
    await emailClient.send({
      to: 'dev-team@example.com',
      subject: `[API Breaking] ${notification.changes.length} changes detected`,
      body: message
    });
  }
}
```

### 5.3 通知格式示例

```
## 🚨 API Contract Change Detected

**PR**: #123 - Update Project API
**Author**: @developer
**Date**: 2026-03-06

### Breaking Changes (3)

| Path | Change | Impact |
|------|--------|--------|
| POST /api/projects | Request body: `description` changed from `string` to `string?` | 🔴 High |
| GET /api/projects/:id | Response: `createdAt` field removed | 🔴 High |
| PUT /api/projects/:id | Path param `id` now required | 🔴 High |

### Warnings (2)

| Path | Change | Impact |
|------|--------|--------|
| GET /api/projects | Response: new optional field `tags` added | 🟡 Medium |
```

---

## 6. 实施路线图

### Phase 1: OpenAPI 自动化 (Week 1)

| 任务 | 负责人 | 产出 |
|-----|-------|------|
| 安装 @hono/zod-openapi | Dev | 依赖就绪 |
| 创建 shared schemas | Dev | schema.ts |
| 改造核心路由 | Dev | 3 个路由支持 OpenAPI |
| 生成脚本 | Dev | npm run openapi:generate |

### Phase 2: 变更检测 (Week 2)

| 任务 | 负责人 | 产出 |
|-----|-------|------|
| 集成 openapi-diff | Dev | CI 工作流 |
| 配置变更规则 | Dev | .openapi-diff.yaml |
| PR 自动评论 | Dev | GitHub Action |

### Phase 3: 通知系统 (Week 3)

| 任务 | 负责人 | 产出 |
|-----|-------|------|
| Slack Webhook | Dev | 集成配置 |
| Email 服务 | Dev | 可选 |
| 通知模板 | Dev | 消息格式 |

### Phase 4: 持续优化 (Ongoing)

- 监控误报率
- 优化检测规则
- 扩展通知渠道

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 改造破坏现有功能 | 高 | 渐进式改造 + 测试覆盖 |
| 误报阻塞合并 | 中 | 细化变更检测规则 |
| 维护成本 | 中 | 自动化生成减少手动操作 |

---

## 8. 结论

### 推荐方案总结

| 模块 | 推荐方案 | 优先级 |
|-----|---------|--------|
| OpenAPI 生成 | Hono + @hono/zod-openapi | P0 |
| 变更检测 | openapi-diff | P0 |
| CI 集成 | GitHub Actions | P0 |
| 通知机制 | GitHub Comment + Slack | P1 |

### 下一步行动

1. **立即**: 安装 @hono/zod-openapi 并创建共享 Schema
2. **短期**: 改造核心 API 路由支持 OpenAPI 生成
3. **中期**: 集成 openapi-diff 到 CI Pipeline
4. **长期**: 完善通知机制和监控

---

*报告生成时间: 2026-03-06*
*分析工具: 本地代码审查*
