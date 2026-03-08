# VibeX

> AI 驱动的应用构建平台，支持对话式原型生成、可视化流程编排和低代码页面编辑。

## 项目概览

VibeX 是一个全栈 Web 应用，采用未来科幻风格 (FUI) 设计，核心功能包括：

- **AI 对话**：通过自然语言描述快速生成应用原型
- **流程编排**：可视化拖拽节点定义业务逻辑
- **页面编辑**：低代码编辑器微调页面细节

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router), React 18, Zustand, React Flow |
| 后端 | Cloudflare Workers, D1, KV, R2 |
| AI | MiniMax API (流式) |
| 数据库 ORM | Prisma |

## 项目结构

```
vibex/
├── vibex-fronted/     # 前端项目
├── vibex-backend/     # 后端项目 (Cloudflare Workers)
├── landing-page/      # 落地页
├── docs/              # 文档
│   ├── architecture/  # 架构设计
│   ├── prd/           # 产品需求
│   └── output/        # 分析产出
├── analysis/          # 领域分析
├── domain.md          # 领域模型文档 (DDD)
└── README.md          # 本文件
```

## 核心文档

| 文档 | 说明 |
|------|------|
| [domain.md](./domain.md) | **领域模型文档** - DDD 建模，子域划分，聚合设计 |
| [docs/architecture.md](./docs/architecture.md) | 前端技术架构方案 |
| [docs/architecture/backend-arch.md](./docs/architecture/backend-arch.md) | 后端架构设计 |
| [docs/api-contract.yaml](./docs/api-contract.yaml) | API 契约定义 |

## 快速开始

### 前端

```bash
cd vibex-fronted
pnpm install
pnpm dev
```

### 后端

```bash
cd vibex-backend
pnpm install
pnpm dev
```

## 领域模型

项目采用 DDD (Domain-Driven Design) 方法论进行建模，详见 [domain.md](./domain.md)。

### 核心子域

| 子域 | 类型 | 说明 |
|------|------|------|
| AI 对话 | 核心域 | AI 驱动的需求理解和代码生成 |
| 流程编排 | 核心域 | 可视化业务逻辑设计 |
| 页面编辑 | 核心域 | 低代码页面创建与预览 |
| 项目管理 | 支撑域 | 项目、页面的 CRUD 管理 |
| 用户认证 | 通用域 | 登录、注册、权限 |

### 聚合根

- **User**：用户身份管理
- **Project**：项目容器，聚合 Page/Flow/Message
- **Agent**：AI 助手配置

## API 概览

| 模块 | 主要端点 |
|------|----------|
| 认证 | POST /api/auth/login, /register, /logout |
| 项目 | GET/POST/PUT/DELETE /api/projects |
| 消息 | GET/POST /api/messages |
| 流程图 | GET/PUT /api/flows/:id |
| 对话 | POST /api/chat (SSE 流式) |
| Agent | CRUD /api/agents |
| 页面 | CRUD /api/pages |

## 开发进度

- [x] 前端项目结构搭建
- [x] 后端 Cloudflare Workers 部署
- [x] 项目 CRUD API
- [x] AI 对话 (SSE 流式)
- [ ] 用户认证完善
- [ ] 消息持久化
- [ ] 流程图编辑器完善

## 贡献

项目由 VibeX Team 开发维护。

---

*最后更新: 2026-03-03*