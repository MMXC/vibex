# 竞品功能对比矩阵

## 目标
分析 VibeX 核心竞品的功能矩阵，明确差异化定位。

## 竞品列表

| 竞品 | URL | 定位 |
|-------|-----|------|
| Cursor | cursor.com | AI-first code editor |
| Copilot | copilot.microsoft.com | GitHub integrated AI |
| Windsurf | windsurf.com | Rule-based AI agent |
| Claude | claude.ai | Constitutional AI assistant |
| v0 | v0.dev | UI generation from prompts |

## 功能对比矩阵

| 功能 | Cursor | Copilot | Windsurf | Claude | v0 | VibeX |
|------|--------|---------|---------|--------|-----|-------|
| 代码生成 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| UI 生成 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| PRD 输入 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 多轮澄清 | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| DDD 领域建模 | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| 可运行原型 | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| 业务流程生成 | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ✅ |
| 组件代码导出 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 对话式澄清 | ⚠️ | ⚠️ | ✅ | ✅ | ❌ | ✅ |
| 原型预览 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

> 图例: ✅ 完全支持 | ⚠️ 部分/受限支持 | ❌ 不支持

## 核心竞品分析

### Cursor (cursor.com)
- **优势**: 实时 AI 代码补全，Composer 多文件生成，Agent 模式
- **劣势**: 无 PRD 理解能力，无 UI 原型生成
- **定位**: AI-first code editor，开发者生产力工具

### Copilot (copilot.microsoft.com)
- **优势**: GitHub 深度集成，代码补全准确率高
- **劣势**: 仅限代码片段，无端到端生成能力
- **定位**: 代码助手，IDE 插件形式

### Windsurf (windsurf.com)
- **优势**: Rule-based AI agent，Cascade 流程编排
- **劣势**: 无 PRD 输入通道，领域建模能力弱
- **定位**: AI agent，工作流自动化

### Claude (claude.ai)
- **优势**: Constitutional AI，对话理解强，可扩展 MCP
- **劣势**: 无 UI 原型生成，非代码专用
- **定位**: 通用 AI 助手，MCP 生态

### v0 (v0.dev)
- **优势**: 纯 UI 生成，组件美观，即时预览
- **劣势**: 仅限 UI，无代码生成能力，非开发者工具
- **定位**: UI 生成器，产品设计辅助

## VibeX 差异化

- **PRD → 可运行原型（端到端）**: 唯一支持从需求文档到可交互原型的产品
- **多轮澄清对话**: AI 主动追问需求细节，确保理解准确
- **DDD 领域建模**: 支持领域驱动设计，生成清晰的领域模型
- **组件代码生成**: 输出生产级 React/Vue 组件代码
- **业务流程生成**: 基于 PRD 自动生成业务流程图
- **原型预览**: 内置预览，所见即所得

## 市场定位

VibeX 填补了「从需求到原型」的空白：

```
PRD → [VibeX] → 可运行原型 + 组件代码
```

竞品要么只做代码补全，要么只做 UI 生成，没有完整覆盖需求到原型的链路。
