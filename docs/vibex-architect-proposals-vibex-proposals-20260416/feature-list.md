# Feature List — VibeX E6/E7 架构提案

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**来源**: `vibex-architect-proposals-vibex-proposals-20260411` Epic 6 & 7
**日期**: 2026-04-16
**Plan 类型**: feat
**Plan 深度**: Standard

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| E6-S1 | @babel/parser AST 解析实现 | 新建 `security/codeAnalyzer.ts`，用 AST 替代正则检测 eval/new Function | A-P2-2 | 2h |
| E6-S2 | 误报率 <1% 测试集验证 | 1000 条合法代码样本，误报率验证 | A-P2-2 | 1h |
| E6-S3 | AST 解析性能验证 | 单文件解析 <50ms 性能测试 | A-P2-2 | 1h |
| E7-S1 | MCP /health 端点 | 新建 `packages/mcp-server/src/health.ts`，返回 {status, version, uptime} | A-P2-3 | 1.5h |
| E7-S2 | Structured logging | 新建 `packages/mcp-server/src/lib/logger.ts`，JSON 格式输出 | A-P2-3 | 1.5h |

**总工时**: 7h

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| E6 | Prompts 安全 AST 扫描 | E6-S1, E6-S2, E6-S3 | 4h |
| E7 | MCP Server 可观测性 | E7-S1, E7-S2 | 3h |

---

## 验收标准

### E6 DoD
- [ ] eval/new Function 检测精准（测试覆盖）
- [ ] 误报率 <1%（测试集验证）
- [ ] AST 解析性能 <50ms/文件
- [ ] 集成到 code-review.ts 和 code-generation.ts

### E7 DoD
- [ ] GET /health 返回 200 + JSON
- [ ] Structured log 输出 JSON 格式到 stdout
- [ ] 日志包含 tool/duration/success 字段
- [ ] SDK 版本检查日志输出
