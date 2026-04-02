# VibeX

> AI 驱动的 DDD 产品建模平台。通过对话式需求分析， AI 生成领域模型、可视化业务流程、原型页面。

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

> **2026-04-02 更新**：VibeX 首页已迁移至 `/canvas`（统一画布）。根路径 `/` 自动重定向到 `/canvas`。

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

> 🔑 **产品哲学**：画布是主操作区，一切围绕画布展开。对话 + 可视化展示编辑是**手段**，能顺利走完流程才是**重点**。思考过程展示是锦上添花。

### Canvas 原型编辑流程

```
[限界上下文树] → [勾选节点] → [继续生成流程] → [勾选流程] → [继续生成组件] → [组件预览]
     ↑                                              ↓
     ←—————————————————————————— 任意时刻可返回编辑 ———————————————————————————→
```

**三树操作规则**（2026-04-02 已上线）：
- **勾选状态持久化**：勾选状态写入节点 JSON，刷新/导入后保留
- **无顺序约束**：任意时刻可增删改任意树的任意节点
- **手动触发联动**：勾选后点"继续生成"按钮手动触发下游联动，不自动
- **部分重生成**：选中若干节点，仅重新生成选中节点，不影响其他节点

---

## 路线图

### ✅ 已完成（v1.0 基础版）

| 功能 | 状态 | 说明 |
|------|------|------|
| 三树数据结构统一 | ✅ | 上下文/流程/组件树共享统一 JSON 模型 |
| canvasStore 重构 | ✅ | 拆分为 contextStore/flowStore/componentStore/sessionStore |
| Checkbox UX 统一 | ✅ | 单 checkbox、toggle 行为、标题同行、绿色确认边框 |
| Flow 级联确认 | ✅ | 勾选流程卡片自动确认/取消所有子步骤 |
| Component API 验证 | ✅ | Zod schema 防御性解析，非法值 fallback 不崩溃 |
| P0 快速修复 | ✅ | scrollTop/节点 deselect/面板背景/XSS/依赖安全 |
| 快速生成命令 | ✅ | Ctrl+G 快捷键触发三树级联生成 |

### 🔄 进行中（v1.1）

| 功能 | 阶段 | 说明 |
|------|------|------|
| Checkbox 状态持久化 | E1 开发中 | confirmed 字段写入节点 JSON，支持导入/导出保留勾选状态 |

### 📋 下一阶段（v1.2-v2.0）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 组件树实时预览 | P1 | 选中组件节点 → 原型预览区实时热更新（ Zustand 订阅） |
| 项目导入/导出 | P1 | 完整 JSON 导出/导入，保留所有树数据和勾选状态 |
| Prompt 对话集成 | P2 | 选中卡片 → 根据卡片类型弹出对应指令选项 |
| E2E 测试覆盖 | P2 | Playwright 覆盖核心用户流程（生成→预览→编辑） |
| AI 补全组件 | P3 | 选中组件节点 → AI 推荐 props/schema |
| 差分预览 | P3 | 对比前后 uiSchema → 只重渲染变化部分 |

### 🎯 长期规划

| 方向 | 说明 |
|------|------|
| 多人协作 | 实时协同编辑 |
| 版本管理 | 设计稿版本历史、回滚 |
| 设计系统集成 | Figma/Sketch 导入 |

---

## 技术架构

### Store 结构

```
canvasStore (旧)
    ↓ 拆分为
contextStore   → 限界上下文节点（confirmed/toggle）
flowStore      → 业务流程节点 + 子步骤（confirmFlowNode 级联）
componentStore → 组件节点（type/path/api/props）
sessionStore   → 会话消息/polling/prototype队列
```

### 关键技术

- **前端**: React + TypeScript + Zustand + Tailwind CSS
- **后端**: Node.js API（ AI 生成服务）
- **预览渲染**: 自研 json-render 模式（ renderer.ts 2175 行）
- **测试**: Vitest + Playwright E2E

---

## 开发指南

### 本地开发

```bash
cd vibex
pnpm install
pnpm dev        # 开发模式
pnpm build      # 生产构建
pnpm test       # 单元测试
```

### 架构文档

- [三树数据模型](./docs/canvas-three-tree-unification/architecture.md)
- [Store 重构](./docs/vibex-canvasstore-refactor/architecture.md)
- [Checkbox 修复](./docs/bc-checkbox-confirm-style-fix/architecture.md)
- [Flow 级联确认](./docs/flow-step-check-fix/architecture.md)
- [组件 API 验证](./docs/component-api-response-fix/architecture.md)

### 提案收集

Sprint 提案归档在 `proposals/` 目录，按日期组织。

---

_Last updated: 2026-04-02_
