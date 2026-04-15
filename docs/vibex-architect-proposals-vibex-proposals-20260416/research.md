# Research Report — E6/E7 需求分析

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**分析人**: Analyst

---

## 历史经验（Learnings）

### 相关 Learnings 条目
- `learnings/canvas-cors-preflight-500.md` — CORS 错误修复，与 E6/E7 无直接关联
- `learnings/canvas-testing-strategy.md` — Canvas 测试策略，与 E6/E7 无直接关联
- `learnings/vibex-e2e-test-fix.md` — E2E 测试修复，与 E6/E7 无直接关联

### 教训（Lessons）
- Learnings 目录缺少安全扫描和可观测性相关历史记录，属于新领域无参考
- E7 的 health endpoint 在 MCP stdio 传输模式下不应使用 HTTP（Architecture 不匹配）

---

## Git History 分析

### code-review.ts / code-generation.ts
```
cf578266 chore: update flaky-tests.json timestamp
```
- git history 极度稀疏，仅一条 commit
- 无 AST 扫描或正则安全检测的历史记录
- 当前实现：prompt-based security（通过 prompt 指令让 AI 检测）

### packages/mcp-server/src/
```
cf578266 chore: update flaky-tests.json timestamp
```
- 同样只有一条 commit
- **关键发现**：`health.ts` 和 `logger.ts` 文件已存在于仓库中，说明 E7 已被部分实现

---

## 关键发现

### E7 已部分实现
检查发现 `packages/mcp-server/src/` 下已有：
- `health.ts` — 实现了 `health_check` MCP tool（而非 HTTP 端点）
- `logger.ts` — 实现了 structured JSON logging（集成到 index.ts）
- `tools/` — 工具调用已有 `logger.info/error` 调用

**问题**：spec 描述的 HTTP `/health` endpoint（`app.get('/health')`）与 MCP server 的 stdio 传输模式不兼容。MCP server 不使用 HTTP 监听。

### E6 依赖已具备
`vibex-backend/package.json` 已安装：
- `@babel/parser: ^7.26.10`
- `@babel/traverse: ^7.26.10`

可立即开始实现 `codeAnalyzer.ts`。

---

## 结论

| Epic | 状态 | 说明 |
|------|------|------|
| E6 | 未开始 | 依赖已就绪，可直接实现 |
| E7 | 部分完成 | health_check tool 和 structured logging 已实现，HTTP endpoint 方案需调整 |
