# Spec: E04 — 模板 CRUD API

**Epic**: E04 Spec 补全
**Story**: S08
**Agent**: pm
**日期**: 2026-05-07

---

## 1. 概述

定义模板（Template）相关的后端 API 接口规范，供前端调用和数据校验使用。Sprint 28 提案中 E04 spec 缺失，本文档补全。

---

## 2. 数据模型

### Template Entity

```typescript
interface Template {
  id: string;           // UUID v4
  name: string;         // 1-100 chars, non-empty
  description: string; // 0-500 chars, optional
  category: string;     // 'component' | 'layout' | 'page'
  projectId: string;    // UUID v4, nullable for system templates
  content: object;      // Serialized prototype JSON
  createdBy: string;    // User ID
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  isPublic: boolean;    // false = private template
  tags: string[];       // max 10 tags, each max 50 chars
}
```

### Error Response

```typescript
interface ApiError {
  error: {
    code: string;       // Machine-readable error code
    message: string;    // Human-readable message (zh-CN)
    details?: object;  // Optional field-level details
  };
}
```

---

## 3. API 端点

### 3.1 创建模板

```
POST /api/templates
Content-Type: application/json

Request Body:
{
  "name": "我的组件模板",
  "description": "可复用的按钮组件",
  "category": "component",
  "projectId": "uuid-xxx",    // nullable
  "content": { ... },
  "isPublic": false,
  "tags": ["button", "ui"]
}

Response 201:
{
  "id": "uuid-generated",
  "name": "我的组件模板",
  "createdAt": "2026-05-07T12:00:00Z"
}

Error Codes:
- 400: MISSING_REQUIRED_FIELD  (name missing or empty)
- 400: INVALID_CATEGORY        (category not in ['component','layout','page'])
- 400: FIELD_TOO_LONG          (any string field exceeds max length)
- 401: UNAUTHORIZED            (no auth token)
- 403: FORBIDDEN               (cannot create public template without permission)
```

### 3.2 获取模板列表

```
GET /api/templates?category=component&page=1&limit=20

Response 200:
{
  "data": [ /* Template[] */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}

Error Codes:
- 400: INVALID_PAGINATION  (page < 1 or limit > 100)
- 401: UNAUTHORIZED
```

### 3.3 获取单个模板

```
GET /api/templates/:id

Response 200: /* Template */

Error Codes:
- 401: UNAUTHORIZED
- 403: FORBIDDEN          (template is private and not owned by user)
- 404: NOT_FOUND          (template id does not exist)
```

### 3.4 更新模板

```
PATCH /api/templates/:id
Content-Type: application/json

Request Body (partial update):
{
  "name": "新名称",
  "tags": ["updated"]
}

Response 200: /* Updated Template */

Error Codes:
- 400: FIELD_TOO_LONG
- 401: UNAUTHORIZED
- 403: FORBIDDEN          (not owner or not public template editor)
- 404: NOT_FOUND
```

### 3.5 删除模板

```
DELETE /api/templates/:id

Response 204: (no body)

Error Codes:
- 401: UNAUTHORIZED
- 403: FORBIDDEN          (not owner)
- 404: NOT_FOUND
```

---

## 4. 错误码矩阵

| HTTP Status | Error Code | 触发条件 | 降级策略 |
|-------------|-----------|---------|---------|
| 400 | MISSING_REQUIRED_FIELD | 必填字段缺失或空字符串 | 返回所有缺失字段列表 |
| 400 | INVALID_CATEGORY | category 不在允许值内 | 提示允许值范围 |
| 400 | FIELD_TOO_LONG | 字符串长度超限 | 提示最大允许长度 |
| 400 | INVALID_PAGINATION | page < 1 或 limit > 100 | 使用默认值 page=1, limit=20 |
| 401 | UNAUTHORIZED | 无效或过期 token | 跳转登录页 |
| 403 | FORBIDDEN | 无权限操作 | 提示无权限原因 |
| 404 | NOT_FOUND | 资源不存在 | 提示资源类型 + ID |
| 422 | INVALID_JSON | 请求体不是有效 JSON | 返回原始解析错误 |
| 500 | INTERNAL_ERROR | 服务端异常 | 提示稍后重试，log error |

---

## 5. 验证规则

| 字段 | 规则 |
|------|------|
| name | 必填，1-100 字符，非空（trim 后） |
| description | 可选，0-500 字符 |
| category | 必填，`component` \| `layout` \| `page` |
| projectId | 可为 null，非 null 时必须是 UUID 格式 |
| content | 必填，非空对象 |
| tags | 可选，数组，最多 10 项，每项最多 50 字符 |

---

## 6. DoD

- [ ] `POST /api/templates` 201 + 400 + 401 + 403 覆盖
- [ ] `GET /api/templates` 200 + 400 + 401 覆盖
- [ ] `GET /api/templates/:id` 200 + 401 + 403 + 404 覆盖
- [ ] `PATCH /api/templates/:id` 200 + 400 + 401 + 403 + 404 覆盖
- [ ] `DELETE /api/templates/:id` 204 + 401 + 403 + 404 覆盖
- [ ] 所有错误码在错误码矩阵中有定义
- [ ] 字段验证规则完整且可测试
