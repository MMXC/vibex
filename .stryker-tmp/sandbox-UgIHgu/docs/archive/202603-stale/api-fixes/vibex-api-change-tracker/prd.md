# VibeX API 变更追踪系统 - 产品需求文档 (PRD)

**项目**: VibeX  
**版本**: 1.0  
**状态**: Draft  
**创建日期**: 2026-03-06  
**验证命令**: `test -f docs/vibex-api-change-tracker/prd.md`

---

## 1. 概述

### 1.1 目标

构建一个自动化 API 变更追踪系统，实现：
- OpenAPI 规范自动生成
- API 变更实时检测
- CI/CD 无缝集成
- 多渠道变更通知

### 1.2 背景

当前 VibeX 项目存在以下问题：
- API 文档 (`docs/api-contract.yaml`) 手动维护，与实际实现不同步
- 前后端开发者常因 API 变更未及时通知导致集成问题
- 缺乏 Breaking Change 检测机制

### 1.3 成功指标

| 指标 | 目标值 |
|-----|--------|
| OpenAPI 文档生成自动化率 | 100% |
| Breaking Change 检测准确率 | >95% |
| 变更通知送达率 | 100% |
| CI Pipeline 构建时间 | <5 min |

---

## 2. 功能需求

### 2.1 OpenAPI 自动生成

#### 2.1.1 技术方案

采用 **Hono + @hono/zod-openapi** 方案：

- 利用现有 Hono 框架
- 使用 Zod 定义 Schema（项目已集成）
- 自动生成 OpenAPI 3.0 JSON/YAML

#### 2.1.2 核心功能

| 功能 | 描述 | 优先级 |
|-----|------|--------|
| Schema 定义 | 创建共享的 Zod Schema 文件 | P0 |
| 路由改造 | 将现有路由迁移到 OpenAPI 路由 | P0 |
| 生成脚本 | `npm run openapi:generate` 命令 | P0 |
| 输出格式 | 支持 JSON 和 YAML 格式 | P1 |

#### 2.1.3 迁移计划

```
Phase 1: 基础设施 (0.5d)
  - 安装 @hono/zod-openapi
  - 创建项目结构

Phase 2: 共享 Schema (1d)
  - 定义 auth schemas
  - 定义 projects schemas
  - 定义通用 schemas (Pagination, Error)

Phase 3: 核心路由改造 (2d)
  - /routes/auth/*
  - /routes/projects.ts
  - /routes/pages.ts

Phase 4: 扩展改造 (3d)
  - 其他 40+ 路由文件
```

#### 2.1.4 数据模型

```typescript
// 共享 Schema 示例
const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const ProjectListSchema = z.object({
  data: z.array(ProjectSchema),
  pagination: PaginationSchema,
});
```

---

### 2.2 API 变更检测

#### 2.2.1 检测范围

| 变更类型 | 检测能力 | 严重程度 |
|---------|---------|---------|
| 路径变更 | 新增/删除/修改路径 | Breaking |
| HTTP 方法变更 | GET→POST 等 | Breaking |
| 请求参数变更 | 必填/可选/类型/枚举 | Breaking/Warning |
| 请求体变更 | 字段增删/类型变化 | Breaking/Warning |
| 响应结构变更 | 字段增删/类型变化 | Breaking/Warning |
| 响应状态码变更 | 新增/删除状态码 | Warning |

#### 2.2.2 变更级别定义

| 级别 | 定义 | 处理方式 |
|-----|------|---------|
| 🔴 Breaking | 不兼容变更，可能破坏现有客户端 | 阻止 PR 合并 |
| 🟡 Potentially Breaking | 可能不兼容，需人工确认 | 警告但允许合并 |
| 🟢 Non Breaking | 兼容变更 | 自动通过 |

#### 2.2.3 检测工具

使用 [openapi-diff](https://github.com/QuadStingray/openapi-diff)：

```yaml
# .openapi-diff.yaml
source:
  file: openapi.json
  type: json
target:
  file: docs/api-contract.yaml
  type: yaml

rules:
  breaking:
    - request-parameters
    - response-structure
    - enum-values
  warnings:
    - new-optional-field
    - new-endpoint
```

#### 2.2.4 检测流程

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│  PR 创建    │───▶│  生成 OpenAPI   │───▶│  Diff 检测  │
└─────────────┘    └─────────────────┘    └──────────────┘
                                              │
                     ┌────────────────────────┘
                     ▼
              ┌──────────────┐
              │  变更分类    │
              └──────────────┘
           ┌────────┴────────┐
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │ Breaking?   │   │  通知团队   │
    └─────────────┘   └─────────────┘
    (阻止/警告)
```

---

### 2.3 CI 集成

#### 2.3.1 工作流设计

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
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Dependencies
        run: cd vibex-backend && npm ci
          
      - name: Generate OpenAPI Spec
        run: cd vibex-backend && npm run openapi:generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Compare with Base
        run: |
          # 比较新旧版本
          npx openapi-diff@latest \
            --fail-on-incompatible \
            --include-incompatible-breaking \
            openapi.json docs/api-contract.yaml || true
          
      - name: Upload Diff Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: api-diff-report
          path: api-diff-report.json
```

#### 2.3.2 触发条件

| 事件 | 路径过滤 | 行为 |
|-----|---------|------|
| push main | routes/** | 更新基准文档 |
| PR (opened/synchronize) | routes/** | 检测变更并评论 |
| 定时 cron | - | 可选：检测外部依赖变更 |

#### 2.3.3 PR 评论模板

```markdown
## 📋 API Change Report

**PR**: #123 - Update Project API
**Author**: @developer
**Branch**: feature/update-project

### 🔴 Breaking Changes (3)

| Path | Change | Impact |
|------|--------|--------|
| POST /api/projects | `description` changed from `string` to `string?` | High |
| GET /api/projects/:id | `createdAt` field removed | High |
| PUT /api/projects/:id | Path param `id` now required | High |

### 🟡 Warnings (2)

| Path | Change | Impact |
|------|--------|--------|
| GET /api/projects | New optional field `tags` added | Medium |

### ✅ Non-Breaking (1)

| Path | Change |
|------|--------|
| GET /api/projects | New endpoint |

---
⚠️ **This PR contains breaking changes. Please review before merging.**
```

---

### 2.4 通知机制

#### 2.4.1 通知渠道

| 渠道 | 触发条件 | 接收人 |
|-----|---------|-------|
| GitHub PR Comment | 始终 | PR 作者、审查者 |
| Slack | Breaking Change | #dev-team |
| Email (可选) | Breaking Change | 开发者列表 |

#### 2.4.2 通知内容结构

```typescript
interface APINotification {
  // 基本信息
  type: 'breaking' | 'warning' | 'info';
  prNumber: number;
  prTitle: string;
  prUrl: string;
  author: string;
  branch: string;
  
  // 变更详情
  changes: {
    path: string;
    method: string;
    changeType: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }[];
  
  // 时间信息
  timestamp: string;
  baseCommit: string;
  headCommit: string;
}
```

#### 2.4.3 通知格式示例

**GitHub Comment:**

```
## 🚨 API Breaking Changes Detected

**Please review before merging!**

### Summary
- 🔴 Breaking: 3 changes
- 🟡 Warnings: 2 changes  
- ✅ Non-breaking: 1 change

### Breaking Changes

| API | Change | Impact |
|-----|--------|--------|
| `POST /projects` | `description` is now optional | May affect existing clients |
| `GET /projects/:id` | `createdAt` removed | Breaking for clients using this field |
```

**Slack Message:**

```
🚨 *API Breaking Changes Detected*

*PR*: #123 - Update Project API
*Author*: @developer
*Branch*: feature/update-project

*Breaking Changes (3)*:
• POST /api/projects - description now optional
• GET /api/projects/:id - createdAt removed  
• PUT /api/projects/:id - id now required

<View on GitHub> | <View Full Report>
```

#### 2.4.4 通知服务实现

```typescript
// lib/api-change-notifier.ts
export class APINotificationService {
  private github: GitHubClient;
  private slack: SlackClient;
  private email: EmailClient;

  async notify(notification: APINotification): Promise<void> {
    // 1. GitHub PR Comment (always)
    await this.github.postComment(
      notification.prUrl,
      this.formatPRComment(notification)
    );

    // 2. Slack (breaking changes only)
    if (notification.type === 'breaking') {
      await this.slack.send({
        channel: '#dev-team',
        message: this.formatSlackMessage(notification),
      });
    }

    // 3. Email (optional, critical)
    if (notification.type === 'breaking') {
      await this.email.send({
        to: 'dev-team@company.com',
        subject: `[API Breaking] ${notification.prTitle}`,
        body: this.formatEmail(notification),
      });
    }
  }
}
```

---

## 3. 非功能需求

### 3.1 性能

| 指标 | 要求 |
|-----|------|
| OpenAPI 生成时间 | <30s |
| 变更检测时间 | <10s |
| CI Pipeline 总时间 | <5min |

### 3.2 可维护性

- Schema 集中管理，便于复用
- 配置外部化（规则、阈值）
- 日志详细，便于排查

### 3.3 可扩展性

- 支持自定义通知渠道
- 支持自定义变更检测规则
- 支持多版本 API 管理

---

## 4. 技术架构

### 4.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      VibeX API Change Tracker               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Hono API   │───▶│  Zod Schema   │───▶│   OpenAPI    │ │
│  │   Routes     │    │   Library     │    │   Generator  │ │
│  └──────────────┘    └──────────────┘    └──────┬───────┘ │
│                                                  │          │
│                                                  ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │    GitHub    │◀───│   openapi-    │◀───│   Current    │ │
│  │  PR Comment  │    │    diff       │    │  Spec (YAML) │ │
│  └──────┬───────┘    └──────────────┘    └──────────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │    Slack     │    │    Email     │                       │
│  │  Notifier    │    │   Notifier   │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 目录结构

```
vibex-backend/
├── src/
│   ├── routes/
│   │   ├── auth/
│   │   ├── projects.ts
│   │   └── ...
│   ├── schemas/           # 新增: 共享 Schema
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── common.ts
│   └── lib/
│       ├── openapi.ts     # 新增: OpenAPI 生成
│       └── notifier.ts   # 新增: 通知服务
├── openapi.json          # 新增: 生成的文件
└── package.json

.github/
└── workflows/
    └── api-contract.yml  # 新增: CI 工作流
```

---

## 5. 实施计划

### 5.1 迭代规划

| 迭代 | 时间 | 任务 | 产出 |
|-----|------|------|------|
| Sprint 1 | Week 1 | 基础设施 + Schema | @hono/zod-openapi 集成 |
| Sprint 2 | Week 2 | 核心路由改造 | auth, projects, pages 支持 OpenAPI |
| Sprint 3 | Week 3 | CI 集成 | api-contract.yml 工作流 |
| Sprint 4 | Week 4 | 通知系统 | GitHub Comment + Slack |

### 5.2 里程碑

| 里程碑 | 完成标准 |
|-------|---------|
| M1: 基础设施 | `npm run openapi:generate` 可执行 |
| M2: 核心路由 | 核心 API 可生成 OpenAPI |
| M3: CI 就绪 | PR 自动触发变更检测 |
| M4: 完整功能 | 通知自动发送 |

---

## 6. 验收标准

### 6.1 功能验收

| 功能 | 验收条件 |
|-----|---------|
| OpenAPI 生成 | `npm run openapi:generate` 成功生成 openapi.json |
| 变更检测 | 模拟 Breaking Change，CI 正确阻止合并 |
| PR 评论 | PR 页面显示完整变更报告 |
| Slack 通知 | Breaking Change 发送至 #dev-team |

### 6.2 验证命令

```bash
# 验证 PRD 文件存在
test -f docs/vibex-api-change-tracker/prd.md

# 验证 OpenAPI 生成
cd vibex-backend && npm run openapi:generate

# 验证变更检测
npx openapi-diff openapi.json docs/api-contract.yaml
```

---

## 7. 风险与依赖

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 路由改造破坏现有功能 | 高 | 渐进式改造 + 测试覆盖 |
| openapi-diff 误报 | 中 | 细化检测规则 + 白名单 |
| Schema 维护成本 | 中 | 集中管理 + 文档 |

### 7.2 外部依赖

| 依赖 | 版本 | 用途 |
|-----|------|------|
| @hono/zod-openapi | ^0.3.0 | OpenAPI 生成 |
| openapi-diff | ^2.0.0 | 变更检测 |
| GitHub Actions | - | CI/CD |
| Slack Webhook | - | 通知 |

---

## 8. 附录

### 8.1 相关文档

- [分析报告](./analysis.md)
- [现有 API 契约](../../api-contract.yaml)
- [架构文档](../../architecture.md)

### 8.2 参考资料

- [Hono Zod OpenAPI 文档](https://hono.dev/examples/zod-openapi)
- [openapi-diff GitHub](https://github.com/QuadStingray/openapi-diff)
- [GitHub Actions 最佳实践](https://docs.github.com/en/actions/learn-github-actions)

---

*文档版本: 1.0*  
*最后更新: 2026-03-06*  
*作者: Agent (Dev)*
