# API URL 配置问题分析报告

## 问题概述

**问题**: 前端 `chat/page.tsx` 中 API_BASE_URL 回退值缺少 `/api` 后缀

**分析时间**: 2026-03-01 14:23

**项目路径**: `/root/.openclaw/vibex/vibex-fronted`

---

## 1. 扫描结果

### 1.1 API_BASE_URL 使用位置

| 文件 | 行号 | 代码 | 问题 |
|------|------|------|------|
| `src/services/api.ts` | 156 | `process.env.NEXT_PUBLIC_API_BASE_URL \|\| '/api'` | ⚠️ 回退值为相对路径 |
| `src/app/chat/page.tsx` | 67 | `process.env.NEXT_PUBLIC_API_BASE_URL \|\| 'https://api.vibex.top'` | ❌ **缺少 /api 后缀** |

### 1.2 环境变量配置

**文件**: `.env.local`
```
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top/api
```

✅ 环境变量配置正确

---

## 2. 问题详情

### 2.1 问题代码 (chat/page.tsx:67)

```typescript
// ❌ 错误: 回退值缺少 /api 后缀
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top'
const eventSource = new EventSource(`${apiBaseUrl}/chat/stream?...`)
```

**影响**:
- 当环境变量未设置时，SSE 连接会请求 `https://api.vibex.top/chat/stream`
- 正确路径应为 `https://api.vibex.top/api/chat/stream`
- 导致 SSE 聊天功能失败 (404)

### 2.2 潜在问题 (api.ts:156)

```typescript
// ⚠️ 回退值为相对路径 '/api'
constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '/api')
```

**影响**:
- 当环境变量未设置时，使用相对路径 `/api`
- 在 Cloudflare Pages 部署时，相对路径可能无法正确代理到后端
- 建议改为完整 URL 作为回退值

---

## 3. 修复建议

### 3.1 chat/page.tsx 修复

```typescript
// ✅ 正确: 添加 /api 后缀
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'
```

### 3.2 api.ts 修复 (建议)

```typescript
// ✅ 建议: 使用完整 URL 作为回退值
constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api')
```

---

## 4. API 调用路径汇总

| 来源 | 调用路径 | 状态 |
|------|----------|------|
| api.ts (Axios) | `{baseURL}/auth/login` | ✅ 正常 |
| api.ts (Axios) | `{baseURL}/projects` | ✅ 正常 |
| api.ts (Axios) | `{baseURL}/messages` | ✅ 正常 |
| chat/page.tsx (SSE) | `{apiBaseUrl}/chat/stream` | ❌ 回退值错误 |

---

## 5. 总结

| 问题类型 | 数量 | 优先级 |
|----------|------|--------|
| 缺少 /api 后缀 | 1 处 | P0 |
| 相对路径回退值 | 1 处 | P1 |

**修复优先级**:
1. **P0**: `chat/page.tsx` 第 67 行 - SSE 聊天功能依赖
2. **P1**: `api.ts` 第 156 行 - 建议改为完整 URL

---

**分析完成时间**: 2026-03-01 14:23
**分析者**: Analyst Agent