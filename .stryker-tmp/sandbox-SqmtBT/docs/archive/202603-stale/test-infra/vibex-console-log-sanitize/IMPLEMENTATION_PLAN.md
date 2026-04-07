# 控制台日志脱敏

## 目标
移除/脱敏生产环境控制台中的敏感信息（token、userId、email 等）。

## 验收标准
- [x] 生产构建后 console.log 无敏感数据
- [x] 保留必要的调试信息

## 技术方案

### 1. 新建 `lib/log-sanitizer.ts`
提供三个核心工具：
- `sanitize()`: 递归扫描并脱敏敏感字段（token、email、password、userId 等）
- `sanitizeAndTruncate()`: 对字符串进行 email/token 模式脱敏 + 长度截断
- `devLog() / devDebug()`: 仅在非生产环境输出日志
- `safeError()`: 错误日志脱敏

### 2. 后端修复
| 文件 | 修复内容 |
|------|---------|
| `services/ai-service.ts` | 原始 AI 响应日志 → `sanitizeAndTruncate()` + `devDebug()` |
| `routes/ddd.ts` | DEBUG 日志 → `devDebug()` + `sanitize()` |
| `routes/plan.ts` | DEBUG 日志 → `devDebug()` + `sanitize()` |
| `app/api/plan/analyze/route.ts` | DEBUG 日志 → `devDebug()` + `sanitize()` |
| `services/context/SessionManager.ts` | 所有 `console.log` → `devDebug()` |
| `lib/cache.ts` | 缓存清理日志 → `devDebug()` |

### 3. 前端修复
| 文件 | 修复内容 |
|------|---------|
| `lib/componentRegistry.ts` | `print()` 方法添加生产环境守卫 |
| `lib/web-vitals.ts` | 所有 `console.log` → `devLog()` |
| `lib/circuit-breaker.ts` | 状态切换日志 → `devLog()` |
| `lib/guest/lifecycle.ts` | 所有 `console.log` → `devLog()` |
| `lib/fallbackStrategy.ts` | 所有 `console.log` → `devLog()` |
| `stores/confirmationStore.ts` | 迁移日志 → `devLog()` |
| `stores/smartRecommenderStore.ts` | 选择日志 → `devLog()` |
| `hooks/useApiCall.ts` | 重试日志 → `devLog()` |
| `hooks/useHomeGeneration.ts` | 生成日志 → `devLog()` |
| `hooks/usePanelActions.ts` | 状态变更日志 → `devLog()` |
| `app/flow/page.tsx` | Flow ID 日志 → `devLog()` |
| `app/templates/page.tsx` | 模板应用日志 → `devLog()` |
| `app/domain/DomainPageContent.tsx` | 需求获取错误日志 → `devLog()` |

### 4. 保留的安全日志
以下 `console.error` 保留（用于生产错误监控）：
- 所有 API route 的 `console.error` 错误日志
- 所有 error boundary 的 `console.error`
- Circuit breaker OPEN 状态的 `console.error`
- 所有 Sentry 集成相关日志

## 验证
```bash
grep -r "console.log" vibex-fronted/src --include="*.ts" --include="*.tsx" | grep -v "\.d\.ts" | grep -v "devLog\|if.*NODE_ENV\|console\.log.*=.*console\|//.*console\.log\|test\."
```
结果：仅剩 guard 方法内部、受保护方法内部、代码注释，无敏感数据泄漏。
