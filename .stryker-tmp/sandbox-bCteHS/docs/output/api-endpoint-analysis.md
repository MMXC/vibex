# API 地址硬编码问题分析报告

**分析时间**: 2026-03-03 19:48
**问题**: 前端控制台报错 `POST http://localhost:8787/api/ddd/bounded-context net::ERR_CONNECTION_REFUSED`

---

## 问题定位

### 硬编码位置

**文件**: `/root/.openclaw/vibex/vibex-fronted/src/services/api.ts`
**行号**: 1419

```typescript
export async function generateBoundedContext(
  requirementText: string,
  projectId?: string
): Promise<BoundedContextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787'  // ← 问题在这里
  
  const response = await fetch(`${baseUrl}/api/ddd/bounded-context`, {
    // ...
  })
}
```

### 问题分析

| 位置 | 回退值 | 正确性 |
|------|--------|--------|
| `ApiService` 构造函数 (行 369) | `'https://api.vibex.top/api'` | ✅ 正确 |
| `generateBoundedContext` 函数 (行 1419) | `'http://localhost:8787'` | ❌ 错误 |

**根因**: `generateBoundedContext` 是独立函数，使用直接 `fetch` 而非 `ApiService` 实例，且使用了错误的回退值。

---

## 不一致性说明

同一文件中存在两种 API 地址配置方式：

### 方式 1: ApiService 类 (正确)
```typescript
// 行 369
constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api') {
  this.client = axios.create({
    baseURL,
    // ...
  })
}
```

### 方式 2: generateBoundedContext 函数 (错误)
```typescript
// 行 1419
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787'
const response = await fetch(`${baseUrl}/api/ddd/bounded-context`, { ... })
```

**问题**: 方式 2 的回退值是本地开发地址，与方式 1 不一致。

---

## 环境变量配置

**文件**: `/root/.openclaw/vibex/vibex-fronted/.env.local`

```
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top/api
```

**状态**: ✅ 环境变量已正确配置，但在运行时可能未被正确读取。

---

## 后端路由验证

**文件**: `/root/.openclaw/vibex/vibex-backend/src/index.ts`

```typescript
import ddd from './routes/ddd';
app.route('/api/ddd', ddd);  // 行 106
```

**状态**: ✅ 后端路由已正确配置 `/api/ddd/bounded-context`

---

## 修复方案

### 方案 A: 统一回退值 (推荐)

修改 `generateBoundedContext` 函数的回退值，与 `ApiService` 保持一致：

```typescript
// 行 1419
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'

// 同时修正 URL 拼接（移除重复的 /api）
const response = await fetch(`${baseUrl}/ddd/bounded-context`, {
```

**注意**: 由于 `NEXT_PUBLIC_API_BASE_URL` 已包含 `/api` 后缀，需要调整路径拼接。

### 方案 B: 使用 ApiService 实例

重构 `generateBoundedContext` 使用 `apiService` 实例：

```typescript
export async function generateBoundedContext(
  requirementText: string,
  projectId?: string
): Promise<BoundedContextResponse> {
  const response = await apiService.client.post('/ddd/bounded-context', {
    requirementText,
    projectId,
  })
  return response.data
}
```

**优点**: 统一 API 调用方式，自动继承认证拦截器、错误处理等。

### 方案 C: 创建统一的 API 配置常量

```typescript
// 在文件顶部定义
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'

// 所有函数使用同一常量
```

---

## 推荐方案

**推荐方案 B**: 重构 `generateBoundedContext` 使用 `apiService` 实例。

**理由**:
1. 统一 API 调用方式
2. 自动继承认证拦截器
3. 统一错误处理逻辑
4. 减少代码重复

---

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `vibex-fronted/src/services/api.ts` | 修改行 1419-1431，使用 apiService 或统一回退值 |

---

## 验证步骤

1. 修改代码后运行 `npm run build`
2. 检查控制台无 `localhost:8787` 报错
3. 测试 `/confirm` 页面 API 调用正常

---

*分析完成时间: 2026-03-03 19:48*
*分析者: Analyst Agent*