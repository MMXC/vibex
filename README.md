# VibeX

> AI 驱动的 DDD 产品建模平台。通过对话式需求分析，AI 生成领域模型、可视化业务流程、原型页面。

**在线体验**: https://vibex-app.pages.dev
**API**: https://api.vibex.top

---

## 产品形态

### 是什么

用户输入业务需求（如"做一个电商系统"），VibeX 通过 AI 引导澄清需求，生成：

1. **领域模型** — DDD 限界上下文、实体、聚合
2. **业务流程图** — Mermaid 渲染的可视化流程
3. **原型页面** — 可编辑的低代码原型

### 核心场景

| 场景 | 操作 |
|------|------|
| 快速启动 | 输入需求 → AI 分析 → 一键创建项目 |
| 深度分析 | 输入详细需求 → AI 追问澄清 → 多轮优化 |
| 探索设计 | 边分析边切换步骤 → 探索不同设计方向 |

---

## 交互流程

### 首页 5 步流程

```
[输入需求] → [Step1 需求澄清] → [Step2 业务流程] → [Step3 组件图] → [Step4 领域模型] → [创建项目]
               ↑ AI 追问                                              ↓
            用户澄清                                            进入原型编辑
```

**各步骤说明**：

| 步骤 | 内容 | 产出 |
|------|------|------|
| Step1 | 需求澄清 | AI 追问确认边界 |
| Step2 | 业务流程 | Mermaid 流程图 |
| Step3 | 组件图 | 页面组件结构 |
| Step4 | 领域模型 | DDD 限界上下文 + 聚合 |

### 项目管理流程

```
创建项目 → 进行中 → 已完成
    ↓
[原型编辑] → 左侧菜单树 → 预览区 → 组件详情抽屉 → AI 助手
```

---

## 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户浏览器                               │
│  Next.js 14 (App Router) + Zustand + React Flow            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                  Cloudflare Edge                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Workers API  │  │   D1 DB     │  │   KV Storage    │    │
│  │  (Hono)      │  │  (SQLite)   │  │   (状态)        │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   MiniMax API   │
              │  (流式 AI)      │
              └─────────────────┘
```

### 前端结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页（5步流程）
│   ├── projects/           # 项目管理
│   ├── project/[id]/       # 原型编辑
│   └── auth/              # 登录注册
├── components/
│   ├── homepage/          # 首页组件
│   │   ├── steps/         # 各步骤组件 (Step1-4)
│   │   ├── PreviewArea/    # 预览区
│   │   ├── CardTree/       # 卡片树 (新) / GridLayout (旧)
│   │   └── InputArea/     # 输入区
│   ├── visualiztion/       # 可视化（Mermaid）
│   └── prototype/         # 原型编辑
├── hooks/                  # React hooks
├── stores/                 # Zustand 状态
└── types/                  # TypeScript 类型
```

---

## 时序图

### 需求分析流程

```
用户          前端          Workers         MiniMax         D1
 │              │              │               │              │
 │──输入需求──▶│              │               │              │
 │              │──POST /api/analyze──▶│               │              │
 │              │              │──stream──▶│               │              │
 │              │◀────────────response──│               │              │
 │              │              │               │              │
 │◀────────────│              │               │              │
 │   [Step1 澄清]            │               │              │
 │──确认──▶│              │               │              │
 │              │──POST /api/flow──▶│               │              │
 │              │◀────────────flow──│               │              │
 │   [Step2 流程图]          │               │              │
 │──继续──▶│              │──POST /api/domain──▶│              │
 │              │◀────────────domain──│               │              │
 │   [Step4 领域模型]        │               │              │
 │──创建项目──▶│              │               │              │
 │              │──POST /api/projects──▶│               │              │
 │              │              │               │              │──INSERT──▶│
 │              │◀─────────────201──│               │              │
 │   项目已创建              │               │              │
```

### 卡片树渲染流程

```
PreviewArea         CardTreeView         useProjectTree         D1/KV
     │                    │                    │                  │
     │──projectId───────▶│                    │                  │
     │                    │──projectId────────▶│                  │
     │                    │                    │──查询───────▶│  │
     │                    │◀──TreeData────────│                  │
     │◀──Mermaid──────│                    │                  │
     │   渲染完成        │                    │                  │
```

---

## UI 演进

| 版本 | 时间 | 核心变化 |
|------|------|---------|
| v0.1 | 早期 | 基础页面，GridLayout 预览 |
| v1.0 | 2026-03 | FUI 未来科幻风格，5步流程上线 |
| v2.0 | 2026-03 中 | 首页重构，PreviewArea 优化，CardTree 实验 |
| v2.1 | 2026-03 末 | 卡片树本地模式（Epic2），无需 API 等待 |

**当前版本**：v2.1（CardTree Feature Flag: `NEXT_PUBLIC_USE_CARD_TREE`）

---

## 路线图

### 已完成 ✅

- [x] 首页 5 步流程
- [x] AI 流式对话
- [x] Mermaid 流程图/组件图渲染
- [x] 项目管理（创建/列表/原型编辑）
- [x] 登录注册
- [x] 首页卡片树本地模式
- [x] ErrorBoundary 去重与合并

### 进行中 🔄

- [ ] 边分析边编辑卡片树（提案中）
- [ ] 首页卡片树调试（homepage-cardtree-debug, 21/21 已完成待验证）
- [ ] E2E 测试覆盖率提升

### 规划中 📋

- [ ] 多步流程并行探索
- [ ] AI 追问澄清自动优化
- [ ] 模板市场
- [ ] 团队协作功能

---

## 团队协作

### Agent 链路

```
analyst → pm → architect → dev → tester → reviewer → coord
```

### 文档规范

| 文档 | 位置 | 说明 |
|------|------|------|
| 产品简介 | `README.md` | 本文件 |
| 流程图 | `docs/flow.md` | Mermaid 流程图 |
| 首页 PRD | `docs/首页PRD.md` | 需求定义 |
| 首页功能清单 | `docs/首页功能清单.md` | 功能 checklist |
| 架构文档 | `docs/architecture/` | 架构设计 |
| Bug 追踪 | `docs/bug/` | 问题记录 |
| 提案汇总 | `docs/proposals/` | 团队提案 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| 状态管理 | Zustand |
| 可视化 | Mermaid, React Flow |
| 后端运行时 | Cloudflare Workers |
| API 框架 | Hono |
| 数据库 | Cloudflare D1 (SQLite) |
| 存储 | Cloudflare KV |
| AI | MiniMax API (流式) |
| 样式 | CSS Modules |
| 测试 | Playwright (E2E), Vitest (Unit) |

> ⚠️ **本文档由 Agent 系统维护，如有更新请同步修改。任何过时信息可能导致误导，欢迎报告。**
