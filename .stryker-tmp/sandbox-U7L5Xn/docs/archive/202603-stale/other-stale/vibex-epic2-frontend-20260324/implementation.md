# Epic2-Frontend: 实现方案

**项目**: vibex-epic2-frontend-20260324
**Epic**: P1-5 E2E CI + P1-6 API Error Tests
**创建时间**: 2026-03-25

---

## P1-5: E2E CI 集成

### 问题
1. `continue-on-error: true` 掩盖真实失败
2. 未显式指定 `playwright.ci.config.ts`

### 修复
- `e2e-tests.yml`: 移除 `continue-on-error: true`，显式指定 `--config=playwright.ci.config.ts`
- notify job: `if: always()` → `if: failure()`

---

## P1-6: API 错误测试开发

### 产出
- `vibex-fronted/src/services/api/__tests__/api-error-integration.test.ts` — 33 tests

### 测试覆盖

| 测试组 | 测试数 | 内容 |
|--------|--------|------|
| E1.1 HTTP状态码拦截 | 7 | 400/401/403/404/409/500/200 |
| E1.2 错误响应解析 | 3 | data.error/嵌套/默认消息 |
| E1.3 网络错误捕获 | 5 | Failed to fetch/DNS/ECONNREFUSED/CORS/普通Error |
| E1.4 超时错误处理 | 3 | timeout检测/可重试/正常响应 |
| E2.1 认证错误映射 | 4 | AUTH_001/AUTH_002/401/未知 |
| E2.2 业务错误映射 | 3 | PROJECT_001/002/未知 |
| E2.3 验证错误映射 | 2 | VALIDATION_001/字段级 |
| E2.4 服务端错误映射 | 4 | API_001/002/003/5xx |
| E4 Toast集成 | 2 | 错误消息来源/登录提示 |

### 已知限制
- `ErrorClassifier.isNetworkError` 不检测 "getaddrinfo ENOTFOUND" / "connect ECONNREFUSED"（缺少关键字匹配）
- `ErrorClassifier.classify` 依赖 `axios.isAxiosError`（需要 axios mock 支持）

### 验收标准
- [x] 33 tests pass
- [x] changelog 已更新
