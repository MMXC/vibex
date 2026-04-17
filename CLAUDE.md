# CLAUDE.md — VibeX Development Guide

> 所有 Agent 在操作 Vibex 项目前必须阅读本文档。

## Design System

**📖 必读**: `DESIGN.md` — VibeX 官方设计系统文档，定义颜色/字体/间距/动效/组件规范。

**核心原则**：
- 所有 UI 改动必须符合 `DESIGN.md` 中定义的设计变量
- 禁止使用内联 `style={{}}` 定义颜色/间距/字体（已定义变量的场景）
- 禁止引入 DESIGN.md 中未定义的新颜色
- 新增组件前先检查 `design-tokens.css` 是否已有对应变量

**验证命令**：
```bash
# 检查内联样式
grep -rn "style={{" /root/.openclaw/vibex/vibex-fronted/src/app/ --include="*.tsx" | grep -v "node_modules"
```

## 项目结构

```
vibex/                          # 根目录
├── vibex-fronted/              # Next.js 前端
│   ├── src/
│   │   ├── app/                # Next.js App Router 页面
│   │   ├── components/         # React 组件
│   │   ├── styles/            # 设计系统（design-tokens.css 等）
│   │   ├── lib/               # 工具函数
│   │   ├── hooks/             # 自定义 Hooks
│   │   └── stores/            # Zustand 状态管理
│   └── package.json
├── vibex-backend/              # Cloudflare Workers 后端
│   └── src/
└── DESIGN.md                  # 设计系统文档（本文档所在）
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 15 (App Router) | React Server Components |
| 状态管理 | Zustand | 轻量状态管理 |
| 数据获取 | TanStack Query | API 数据缓存 |
| 样式 | CSS Modules + CSS Variables | 组件隔离 + 主题支持 |
| 后端 | Cloudflare Workers | 边缘计算 |
| 数据库 | Cloudflare D1 | SQLite at edge |
| 部署 | Cloudflare Pages | 前端静态部署 |

## 开发规范

### Git 工作流

- 每个功能/修复单独分支
- PR 需要 Reviewer 审查后才能合并
- 合并后自动部署到 `vibex-app.pages.dev`

### 代码风格

- TypeScript 严格模式
- ESLint + Prettier 自动格式化
- 组件使用 CSS Modules（`.module.css`）

### API 规范

- RESTful 风格
- 错误响应格式：`{ error: string, code?: string }`
- API 地址：`https://api.vibex.top`

## 产品哲学

> **画布是主操作区，一切围绕画布展开。对话 + 可视化展示编辑是手段，能顺利走完流程才是重点。**

新功能评估标准：
- 是否让画布操作更顺畅？
- 是否帮助用户走完流程？
- 思考过程展示是否锦上添花（而非喧宾夺主）？

## 经验沉淀

`docs/solutions/` — 已解决问题的文档化方案（bugs、best practices、workflow patterns），按 category 组织，含 YAML frontmatter（module、tags、problem_type）。**在 documented areas 中实现或 debug 前必查。**
`docs/.learnings/` — 项目级经验沉淀，按项目命名（vibex-*.md）。

## 常用命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 开发
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
pnpm test:e2e

# 类型检查
pnpm lint

# 安全扫描
pnpm scan:vuln
```

## 线上地址

- **前端**: <https://vibex-app.pages.dev>
- **API**: <https://api.vibex.top>
- **GitHub**: <https://github.com/your-org/vibex> （如适用）
