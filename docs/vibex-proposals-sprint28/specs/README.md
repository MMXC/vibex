# VibeX Sprint 28 — Specs 目录

> 本目录存放各 Epic 的详细技术规格。

| 文件 | Epic | 标题 |
|------|------|------|
| `E01-realtime-collab.md` | E01 | 实时协作整合详细规格 |
| `E02-perf-optimization.md` | E02 | Design Output 性能优化详细规格 |
| `E03-ai-clarify.md` | E03 | AI 辅助需求解析详细规格 |
| `E04-template-crud.md` | E04 | 模板 API 完整 CRUD 详细规格 |
| `E05-prd-canvas.md` | E05 | PRD → Canvas 自动流程详细规格 |
| `E06-error-boundary.md` | E06 | Canvas 错误边界完善详细规格 |
| `E07-mcp-server.md` | E07 | MCP Server 集成完善详细规格 |

---

## 目录结构

```
specs/
├── E01-realtime-collab.md   # 实时协作：Firebase 配置、PresenceLayer 合并、节点同步策略
├── E02-perf-optimization.md # 性能：react-window 虚拟化配置、Memo 策略
├── E03-ai-clarify.md        # AI：/api/ai/clarify 请求/响应格式、降级路径
├── E04-template-crud.md     # 模板：API 请求/响应 schema、Dashboard UI 布局
├── E05-prd-canvas.md        # PRD→Canvas：映射规则、API 请求/响应
├── E06-error-boundary.md    # ErrorBoundary：Fallback UI 设计、边界条件
├── E07-mcp-server.md        # MCP：健康检查协议、集成测试用例
└── README.md                # 本文件
```
