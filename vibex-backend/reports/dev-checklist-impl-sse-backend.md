# 开发检查清单: vibex-ddd-ai-stream/impl-sse-backend

**项目**: vibex-ddd-ai-stream
**任务**: impl-sse-backend
**日期**: 2026-03-13
**开发者**: Dev Agent

---

## PRD 功能点对照

### F1: SSE 流式 API

| 验收标准 | 实现情况 | 验证方法 |
|----------|----------|----------|
| AC1.1.1: 500ms 内收到首个事件 | ✅ 已实现 | setTimeout(150ms) 确保快速响应 |
| AC1.1.2: SSE 格式正确 | ✅ 已实现 | `event: thinking\ndata: {...}\n\n` |
| AC1.1.3: 至少 3 个思考步骤 | ✅ 已实现 | analyzing, identifying-core, calling-ai |
| AC1.1.4: message 为中文，<=100 字符 | ✅ 已实现 | 中文提示，简洁明了 |
| AC1.2.1: 每个上下文单独推送 | ✅ 已实现 | 循环中逐个 send('context', ctx) |
| AC1.2.2: 间隔 >= 100ms | ✅ 已实现 | setTimeout(r, 150) |
| AC1.2.3: context 事件包含完整对象 | ✅ 已实现 | name, type, description |
| AC1.3.1: done 事件包含完整数组 | ✅ 已实现 | boundedContexts 数组 |
| AC1.3.2: done 事件包含 mermaidCode | ✅ 已实现 | generateMermaidCode() |
| AC1.3.3: done 后连接关闭 | ✅ 已实现 | controller.close() |
| AC1.3.4: 数组长度 >= 1 | ✅ 已实现 | 有默认回退逻辑 |
| AC1.4.1: AI 失败时推送 error | ✅ 已实现 | catch 块中 send('error', ...) |
| AC1.4.2: error 包含 message | ✅ 已实现 | error.message |
| AC1.4.3: error 后连接关闭 | ✅ 已实现 | controller.close() |
| AC1.4.4: HTTP 200 | ✅ 已实现 | Response stream 正常 |
| AC1.5.1: 原 API 保持不变 | ✅ 已实现 | 原有 endpoint 保留 |
| AC1.5.2: 新增 stream endpoint | ✅ 已实现 | /bounded-context/stream |
| AC1.5.3: 数据结构一致 | ✅ 已实现 | 同样返回 boundedContexts + mermaidCode |

---

## 实现位置

**文件**: `vibex-backend/src/routes/ddd.ts`

**新增代码**:
- 第 645-780 行: SSE streaming endpoint
- 函数: sendSSE() - SSE 事件辅助函数

---

## 构建验证

| 验证项 | 结果 |
|--------|------|
| Backend build | ✅ PASSED |

---

## 错误处理

- [x] AI 调用异常捕获
- [x] JSON 解析异常处理
- [x] 默认回退逻辑（无结果时）

---

## 向后兼容

- [x] 原有 `/bounded-context` API 不变
- [x] 新增 `/bounded-context/stream` API
- [x] 数据结构一致

---

## 下一步

- F2: 前端 useDDDStream Hook
- F3: ThinkingPanel UI 组件
