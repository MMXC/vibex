# P2-003: /api/chat 无速率限制

**严重性**: P2 (安全/稳定性)
**Epic**: E1
**Spec 引用**: analyst-qa-report.md §7 建议改进

## 问题描述

`/api/chat` 转发 AI 请求无速率限制，可能导致 API 成本失控或服务降级。

## 修复建议

增加速率限制中间件（upstash/ratelimit 或等效方案）。

## 影响范围

- `app/api/chat/route.ts`
