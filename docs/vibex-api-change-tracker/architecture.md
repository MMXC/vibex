# VibeX API 变更追踪系统 - 架构设计文档

**项目**: VibeX  
**版本**: 1.0  
**状态**: 架构设计  
**创建时间**: 2026-03-06

---

## 1. 系统概述

### 1.1 目标

VibeX API 变更追踪系统旨在自动化检测和追踪后端 API 的变更，确保前端开发者能够及时了解 API 变更情况，防止 Breaking Changes 影响生产环境。

### 1.2 核心功能

| 功能 | 描述 |
|-----|------|
| OpenAPI 自动生成 | 从代码自动生成 OpenAPI 3.0 规范文档 |
| 变更检测 | 使用 openapi-diff 检测 API 变更 |
| CI/CD 集成 | 在 PR 中自动运行变更检测 |
| 变更通知 | 检测到 Breaking Changes 时通知相关人 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD Pipeline                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌┐  │
│  │──────────────  Push/   │───▶│ OpenAPI      │───▶│  Change     │───▶│  Notification │  │
│  │  PR      │    │ Generation   │    │  Detection  │    │  System       │  │
│  └──────────┘    └──────────────┘    └─────────────┘    └──────────────┘  │
│                        │                    │                   │            │
│                        ▼                    ▼                   ▼            │
│                 ┌─────────────┐      ┌─────────────┐     ┌─────────────┐  │
│                 │ openapi/    │      │ openapi-    │     │ GitHub PR    │  │
│                 │ current.yaml│      │ diff        │     │ Comment      │  │
│                 └─────────────┘      └─────────────┘     │ Slack        │  │
│                            │                   │           │ Email        │  │
│                            ▼                   ▼           └─────────────┘  │
│                     ┌─────────────┐      ┌─────────────┐                      │
│                     │ baseline    │      │ change-     │                      │
│                     │ .yaml       │      │ report.md   │                      │
│                     └─────────────┘      └─────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 组件架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VibeX API Change Tracker                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                         API Layer (Hono)                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │              @hono/zod-openapi Integration                     │   │  │
│  │  │  • Route definitions with OpenAPI metadata                     │   │  │
│  │  │  • Zod schemas for request/response validation                 │   │  │
│  │  │  • Automatic OpenAPI JSON/YAML generation                       │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      Core Services                                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │  │
│  │  │ OpenAPIGen     │  │ ChangeDetector │  │ NotificationService   │   │  │
│  │  │ Service        │  │ Service        │  │                        │   │  │
│  │  │                │  │                │  │ • GitHub Comment     │   │  │
│  │  │ • Parse routes │  │ • Load specs   │  │ • Slack Webhook       │   │  │
│  │  │ • Generate doc │  │ • Diff specs   │  │ • Email (optional)    │   │  │
│  │  │ • Version mgmt │  │ • Classify     │  │                        │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       Storage Layer                                   │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │  │
│  │  │ File Storage   │  │ Git Storage    │  │ Report Storage         │   │  │
│  │  │                │  │                │  │                        │   │  │
│  │  │ • openapi/    │  │ • Git history │  │ • reports/             │   │  │
│  │  │   versions/   │  │ • Branch diff │  │   change-reports/      │   │  │
│  │  │ • baseline.yaml│ │                │  │                        │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 模块设计

### 3.1 OpenAPI 生成模块

#### 职责
- 解析现有 Hono 路由定义
- 生成符合 OpenAPI 3.0 规范的文档
- 版本化管理生成的文档

#### 核心组件

```typescript
// lib/openapi-generator.ts
interface OpenAPIGenerator {
  // 从路由生成 OpenAPI 文档
  generateFromRoutes(routes: Route[]): OpenAPISpec;
  
  // 保存带版本号的文档
  saveVersioned(spec: OpenAPISpec, version: string): Promise<void>;
  
  // 设置基线版本
  setBaseline(version: string): Promise<void>;
}

// lib/openapi-storage.ts
interface OpenAPIStorage {
  // 获取当前版本
  getCurrent(): OpenAPISpec;
  
  // 获取基线版本
  getBaseline(): OpenAPISpec;
  
  // 获取版本历史
  getVersionHistory(): Version[];
}
```

#### 文件结构

```
vibex-backend/
├── openapi/
│   ├── baseline.yaml       # 基线版本 (main 分支)
│   ├── current.yaml        # 当前版本 (PR/分支)
│   └── versions/          # 版本历史
│       ├── v1.0.0.yaml
│       ├── v1.0.1.yaml
│       └── v1.1.0.yaml
├── src/
│   ├── lib/
│   │   ├── openapi-generator.ts
│   │   ├── openapi-storage.ts
│   │   └── change-detector.ts
│   └── routes/
│       ├── auth/
│       ├── projects.ts
│       └── ...
├── scripts/
│   ├── generate-openapi.ts
│   └── detect-changes.ts
└── package.json
```

### 3.2 变更检测模块

#### 职责
- 对比两个 OpenAPI 规范文档
- 识别 Breaking Changes
- 分类变更类型

#### 变更分类

| 级别 | 类型 | 描述 | 影响 |
|-----|------|------|------|
| 🔴 Breaking | 不兼容变更 | 删除/修改字段导致客户端无法正常工作 | 阻止合并 |
| 🟡 Potentially Breaking | 可能不兼容 | 字段类型变更、添加必填字段 | 警告 |
| 🟢 Non Breaking | 兼容变更 | 添加可选字段、添加新端点 | 通过 |

#### 核心组件

```typescript
// lib/change-detector.ts
interface ChangeDetector {
  // 检测两个版本之间的变更
  detect(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): ChangeResult;
  
  // 分类变更
  classify(changes: Change[]): ClassifiedChanges;
  
  // 生成变更报告
  generateReport(result: ChangeResult): ChangeReport;
}

interface ChangeResult {
  compatible: boolean;
  breakingChanges: Change[];
  warningChanges: Change[];
  infoChanges: Change[];
}

interface Change {
  type: 'added' | 'modified' | 'removed' | 'deprecated';
  path: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}
```

### 3.3 CI/CD 集成模块

#### 工作流设计

```yaml
# .github/workflows/api-change-detect.yml
name: API Change Detection

on:
  pull_request:
    paths:
      - 'vibex-backend/src/routes/**'
      - 'vibex-backend/openapi/**'
    branches:
      - main

jobs:
  generate-openapi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
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
      
      - name: Run Change Detection
        run: npm run openapi:diff
      
      - name: Post Results as PR Comment
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            // Post change detection results

  block-merge-on-breaking:
    needs: generate-openapi
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Fail the workflow
        run: |
          echo "❌ Breaking API changes detected. Cannot merge."
          exit 1
```

#### CI Pipeline 流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI Pipeline Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PR Created/Updated                                                         │
│          │                                                                   │
│          ▼                                                                   │
│  ┌───────────────────┐                                                      │
│  │ Generate OpenAPI  │ ───▶ openapi/current.yaml                          │
│  │ from Routes       │                                                      │
│  └───────────────────┘                                                      │
│          │                                                                   │
│          ▼                                                                   │
│  ┌───────────────────┐                                                      │
│  │ Load Baseline     │ ───▶ openapi/baseline.yaml                         │
│  │ (main branch)     │                                                      │
│  └───────────────────┘                                                      │
│          │                                                                   │
│          ▼                                                                   │
│  ┌───────────────────┐     ┌───────────────────────────────────────────┐   │
│  │ Run openapi-diff  │────▶│ Detect Breaking Changes                  │   │
│  └───────────────────┘     └───────────────────────────────────────────┘   │
│          │                              │                                    │
│          ▼                              ▼                                    │
│  ┌───────────────────┐     ┌───────────────────────────────────────────┐   │
│  │ Generate Report  │────▶│ change-reports/{pr}-{timestamp}.md       │   │
│  └───────────────────┘     └───────────────────────────────────────────┘   │
│          │                              │                                    │
│          ▼                              ▼                                    │
│  ┌───────────────────┐     ┌───────────────────────────────────────────┐   │
│  │ Post PR Comment  │────▶│ 📊 API Changes Summary                    │   │
│  │                   │     │ Breaking: X | Warnings: Y | Info: Z      │   │
│  └───────────────────┘     └───────────────────────────────────────────┘   │
│          │                                                                   │
│          ▼                                                                   │
│    ┌─────────────┐                                                           │
│    │ No Breaking │──────────▶ ✅ Allow Merge                               │
│    └─────────────┘                                                           │
│          │                                                                   │
│    ┌─────────────┐                                                           │
│    │ Has Breaking│──────────▶ ❌ Block Merge                               │
│    └─────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 通知模块

#### 职责
- 将变更检测结果通知相关人员
- 支持多种通知渠道

#### 通知渠道

| 渠道 | 触发条件 | 内容格式 |
|-----|---------|----------|
| GitHub PR Comment | 始终 | Markdown 表格 |
| Slack | Breaking Changes | Rich Blocks |
| Email | Breaking Changes (可选) | HTML |

#### 核心组件

```typescript
// lib/notification-service.ts
interface NotificationService {
  // 发送 PR 评论
  postPRComment(prUrl: string, report: ChangeReport): Promise<void>;
  
  // 发送 Slack 通知
  sendSlackNotification(report: ChangeReport): Promise<void>;
  
  // 发送 Email 通知
  sendEmailNotification(report: ChangeReport): Promise<void>;
}

interface ChangeReport {
  prNumber: number;
  prTitle: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  timestamp: Date;
  summary: {
    breaking: number;
    warnings: number;
    info: number;
  };
  changes: Change[];
}
```

---

## 4. 数据模型

### 4.1 OpenAPI 版本

```typescript
interface OpenAPIVersion {
  version: string;        // e.g., "1.0.0"
  createdAt: Date;
  branch: string;
  commitHash: string;
  filePath: string;
}
```

### 4.2 变更记录

```typescript
interface ChangeRecord {
  id: string;
  baseVersion: string;
  headVersion: string;
  detectedAt: Date;
  changes: Change[];
  breakingCount: number;
  reportPath: string;
}
```

---

## 5. 配置文件

### 5.1 openapi-diff 配置

```yaml
# .openapi-diff.yaml
source:
  specFile: ./openapi/current.yaml
  
target:
  specFile: ./openapi/baseline.yaml
  
output:
  format: markdown
  path: ./reports/change-reports
  
rules:
  breaking:
    - path: components.schemas.*.properties.*.type
      action: detect
    - path: paths.*.*.parameters.*.required
      action: detect
      
info:
  - path: paths.*.*
    action: ignore
      
exclude:
  - description: Internal APIs
    path: /api/internal/**
  - description: Deprecated APIs  
    path: /api/deprecated/**
```

### 5.2 包配置

```json
{
  "scripts": {
    "openapi:generate": "tsx scripts/generate-openapi.ts",
    "openapi:diff": "tsx scripts/detect-changes.ts",
    "openapi:baseline": "tsx scripts/set-baseline.ts"
  },
  "dependencies": {
    "@hono/zod-openapi": "^0.18.0",
    "openapi-diff": "^2.0.0",
    "yaml": "^2.0.0"
  }
}
```

---

## 6. 实施计划

### Phase 1: OpenAPI 自动化 (Week 1)

| 任务 | 描述 | 产出 |
|-----|------|------|
| 1.1 安装依赖 | 安装 @hono/zod-openapi | package.json 更新 |
| 1.2 创建共享 Schema | 定义项目通用 Schema | lib/schemas/ |
| 1.3 改造核心路由 | 改造 auth/projects 路由 | 支持 OpenAPI |
| 1.4 生成脚本 | 创建生成脚本 | npm run openapi:generate |

### Phase 2: 变更检测 (Week 2)

| 任务 | 描述 | 产出 |
|-----|------|------|
| 2.1 集成 openapi-diff | 安装并配置工具 | npm run openapi:diff |
| 2.2 CI 工作流 | 创建 GitHub Actions | api-change-detect.yml |
| 2.3 基线管理 | 设置基线版本 | baseline.yaml |

### Phase 3: 通知系统 (Week 3)

| 任务 | 描述 | 产出 |
|-----|------|------|
| 3.1 PR 评论 | 自动评论 PR | GitHub Action |
| 3.2 Slack 集成 | Webhook 集成 | 消息通知 |
| 3.3 报告生成 | Markdown 报告 | 报告模板 |

---

## 7. API 设计

### 7.1 OpenAPI 端点

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /openapi.json | 获取当前 OpenAPI 规范 |
| GET | /openapi.yaml | 获取当前 OpenAPI 规范 (YAML) |
| GET | /openapi/versions | 获取版本列表 |
| GET | /openapi/versions/:version | 获取指定版本 |
| GET | /openapi/diff | 对比基线与当前版本 |

### 7.2 内部 API

| 方法 | 路径 | 描述 |
|-----|------|------|
| POST | /api/internal/openapi/generate | 触发 OpenAPI 生成 |
| POST | /api/internal/openapi/diff | 触发变更检测 |

---

## 8. 错误处理

### 8.1 错误类型

| 错误码 | 描述 | 处理方式 |
|-------|------|----------|
| E001 | OpenAPI 生成失败 | 记录日志，跳过检测步骤 |
| E002 | 基线版本不存在 | 创建基线，跳过检测 |
| E003 | openapi-diff 执行失败 | 记录错误，CI 失败 |
| E004 | GitHub API 调用失败 | 重试 3 次，发送告警 |

### 8.2 回退策略

```
检测失败
    │
    ▼
┌─────────────────┐
│ Is Critical?   │──Yes──▶ CI Fail + Notify
└─────────────────┘
    │ No
    ▼
┌─────────────────┐
│ Retry 3 times  │──Fail──▶ CI Warn + Continue
└─────────────────┘
    │ Success
    ▼
Continue Pipeline
```

---

## 9. 测试策略

### 9.1 单元测试

- OpenAPI 生成器逻辑
- 变更检测规则
- 通知格式化

### 9.2 集成测试

- CI Pipeline 端到端
- GitHub Action 行为
- 变更报告生成

### 9.3 验收标准

```typescript
// OpenAPI 生成
expect(fs.existsSync('openapi/current.yaml')).toBe(true);

// 变更检测
const result = await runOpenApiDiff(baseline, current);
expect(result.breakingChanges.length).toBe(0);

// CI 集成
expect(workflowRun.status).toBe('success');
```

---

## 10. 附录

### 10.1 技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | 20+ | 运行环境 |
| Hono | latest | Web 框架 |
| @hono/zod-openapi | ^0.18.0 | OpenAPI 集成 |
| openapi-diff | ^2.0.0 | 变更检测 |
| TypeScript | 5.x | 开发语言 |
| GitHub Actions | v4 | CI/CD |

### 10.2 文件清单

```
vibex-api-change-tracker/
├── docs/
│   └── vibex-api-change-tracker/
│       ├── architecture.md      # 本文档
│       ├── analysis.md         # 分析报告
│       └── prd.md              # PRD
├── vibex-backend/
│   ├── openapi/
│   │   ├── baseline.yaml
│   │   ├── current.yaml
│   │   └── versions/
│   ├── src/
│   │   └── lib/
│   │       ├── openapi-generator.ts
│   │       ├── change-detector.ts
│   │       └── notification-service.ts
│   ├── scripts/
│   │   ├── generate-openapi.ts
│   │   └── detect-changes.ts
│   └── .github/
│       └── workflows/
│           └── api-change-detect.yml
└── reports/
    └── change-reports/
```

---

*文档版本: 1.0*  
*最后更新: 2026-03-06*
