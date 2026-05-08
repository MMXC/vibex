# Sprint 28 QA — 交互验证规格

本目录包含 Sprint 28 各 Epic 的交互验证规格（gstack 浏览器验证）。

## 文件清单

| 文件 | 对应 Epic | 验证策略 | E2E 文件 |
|------|-----------|---------|---------|
| E01-realtime-collaboration-qa.md | E01 实时协作整合 | gstack /qa | presence-mvp.spec.ts |
| E02-perf-optimization-qa.md | E02 Design Output 性能优化 | gstack /qa + /benchmark | — |
| E03-ai-clarify-qa.md | E03 AI 辅助需求解析 | gstack /qa | onboarding-ai.spec.ts |
| E04-template-crud-qa.md | E04 模板 API 完整 CRUD | gstack /qa | templates-crud.spec.ts |
| E05-prd-canvas-qa.md | E05 PRD → Canvas 自动流程 | gstack /qa | prd-canvas-mapping.spec.ts |
| E06-error-boundary-qa.md | E06 Canvas 错误边界完善 | gstack /qa + 代码审查 | — |
| E07-mcp-integration-qa.md | E07 MCP Server 集成完善 | API curl + E2E | mcp-integration.spec.ts |

## 验证方法

每个 spec 文件包含：
1. **四态验证** — 理想态 / 空状态 / 加载态 / 错误态
2. **gstack /qa 断言** — 可直接复制到 `/qa` 技能执行的断言
3. **执行命令** — 验证该 Epic 的 gstack 命令

## 执行顺序建议

1. E07（API 层，最独立）→ E01/E06（DDSCanvasPage，共用页面）→ E03（Onboarding 流程）→ E04（Dashboard）→ E05（PRD Editor）→ E02（性能验证，最后）
