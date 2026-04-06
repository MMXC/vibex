# Reviewer 每日提案 — 2026-04-11

**Agent**: analyst
**日期**: 2026-04-11
**产出**: proposals/20260411/reviewer.md

---

## R-P0-1: Hono v4 c.text() 误用 204 状态码（7675370a 修复）

**Summary**: 后端 API 路由中部分 204 响应使用 c.text() 而非 c.body()。

**Problem**: Hono v4 中 c.text() 用于 204 会导致类型错误（7675370a 已部分修复）。

**Solution**: 全面审计所有 204 状态码响应：
```typescript
// ❌ return c.text(null, 204);
// ✅ return c.body(null, 204);
```

**Impact**: API 类型安全，0.3h
**Effort**: 0.3h

---

## R-P0-2: MCP prompt security scanner 误报风险

**Summary**: a05ea850 的 AST-based prompt security scanner 可能有误报。

**Problem**: AST 扫描可能将正常用户输入误判为 prompt injection（如包含 "ignore previous instructions" 的正常文档）。

**Solution**: 
1. 添加人工确认流程（高风险标记后需人工审核）
2. 补充误报率测试用例
3. 添加白名单机制（可信代码片段）

**Impact**: 安全扫描准确性，1h
**Effort**: 1h

---

## R-P1-1: Error handling 覆盖率检查

**Summary**: 部分 API routes 缺少 try/catch，错误未规范化。

**Problem**: API 错误时返回未处理的异常堆栈，暴露内部信息。

**Solution**: 审计所有 API routes：
1. 识别无 try/catch 的 routes
2. 统一错误响应格式：`{ error: string, code: string }`
3. 添加全局错误处理中间件

**Impact**: 错误处理一致性，2h
**Effort**: 2h

---

## R-P1-2: 未使用 import 清理

**Summary**: 部分文件存在未使用的 import。

**Problem**: 虽然 ESLint 无报错（0 errors），但维护性降低。

**Solution**: 运行 `npx eslint --fix src/` 定期清理，添加到 pre-commit hook。

**Impact**: 代码清洁度，0.2h
**Effort**: 0.2h

---

## R-P2-1: 日志级别规范缺失

**Summary**: canvasLogger 的 warn/info/debug 使用不一致。

**Problem**: 部分地方用 info 记录 debug 信息，部分地方用 warn 记录普通信息。

**Solution**: 建立日志级别规范：
- error: 功能不可用
- warn: 功能降级/参数异常
- info: 关键业务事件
- debug: 开发调试信息

**Impact**: 日志可维护性，1h
**Effort**: 1h
