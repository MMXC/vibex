# API Spec Template

> 通用模板 — 每个 API Spec 文件请基于此模板创建

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/xxx` |
| **所属模块** | `xxx` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` / `in-review` / `approved` |
| **创建日期** | `YYYY-MM-DD` |
| **最后更新** | `YYYY-MM-DD` |

---

## 功能说明

> 简洁描述此 API 的核心功能，1-3 句话。

---

## 接口定义

### 请求

**方法**: `GET` / `POST` / `PUT` / `DELETE`  
**路径**: `/api/xxx`  
**认证**: `Public` / `Required`  
**Content-Type**: `application/json`

#### Query Parameters（GET 时）

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `xxx` | `string` | 是 | 说明 | `xxx` |

#### Request Body（POST/PUT 时）

```typescript
interface XxxRequest {
  field1: string;      // required, 说明
  field2?: number;    // optional, 说明
}
```

---

## 响应

### 成功响应

```typescript
interface XxxResponse {
  success: true;
  data: XxxData;
  updatedAt?: string;
}

interface XxxData {
  // ...
}
```

### 错误响应

| HTTP Status | Code | 说明 |
|-------------|------|------|
| `400` | `VALIDATION_ERROR` | 参数校验失败 |
| `401` | `UNAUTHORIZED` | 未认证 |
| `403` | `FORBIDDEN` | 无权限 |
| `404` | `NOT_FOUND` | 资源不存在 |
| `409` | `CONFLICT` | 冲突 |
| `429` | `RATE_LIMITED` | 限流 |
| `500` | `INTERNAL_ERROR` | 服务器错误 |

---

## 示例

### curl 示例

```bash
# 示例 1
curl -X POST "https://api.vibex.top/api/xxx" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "field1": "value1"
  }'

# Expected response:
# { "success": true, "data": { ... } }
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| 必填字段缺失 | `field1: ""` | `400` + 具体字段名 |
| 字段超长 | `field1: "x".repeat(10000)` | `400` + 最大长度 |
| 无效枚举值 | `field2: "invalid"` | `400` + 有效值列表 |
| 越权访问 | 其他用户的 ID | `403` |
| 资源不存在 | 不存在的 ID | `404` |
| 并发冲突 | 过时的 version | `409` |

---

## 数据结构

```typescript
// 核心数据类型定义
interface XxxData {
  id: string;
  name: string;
  // ...
}
```

---

## 测试用例

### 单元测试

```typescript
describe('Xxx API', () => {
  it('should return 400 when field1 is missing', async () => {
    const res = await api.post('/api/xxx', { field2: 123 });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 403 when accessing other user resource', async () => {
    const res = await api.post('/api/xxx', { field1: 'xxx', userId: 'other_user' });
    expect(res.status).toBe(403);
  });
});
```

### E2E 测试

```typescript
// cypress/e2e/xxx.spec.ts
it('should complete full flow', () => {
  // ...
});
```

---

## 验证命令

```bash
# API 稳定性测试
curl -X POST "https://api.vibex.top/api/xxx" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '...' | jq .

# 边界条件测试
curl ... | jq '.success, .code, .error'
```

---

## 关联 Specs

- `SPEC-xxx.md` — 关联的 API
- `SPEC-xxx.md` — 被依赖的 API

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| `YYYY-MM-DD` | `1.0` | 初始版本 | `architect` |
