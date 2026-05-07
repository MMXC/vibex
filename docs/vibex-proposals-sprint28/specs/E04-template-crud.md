# Spec: E04 — 模板 CRUD API (Sprint 28)

**Epic**: E04 模板 CRUD
**Story**: S08
**Agent**: pm
**日期**: 2026-04-28

---

## 1. 概述

模板库 API 支持行业模板的增删改查，存储实体类型、属性、Bounded Context 等领域分析数据。

---

## 2. 数据模型

### Template 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | Template ID (cuid) |
| name | string | ✅ | 模板名称 |
| industry | Industry | ✅ | 行业类型: ecommerce / social / saas |
| description | string | ✅ | 模板描述 |
| icon | string | ✅ | 图标名称 |
| entities | Entity[] | ✅ | 聚合根列表 |
| boundedContexts | BoundedContext[] | ✅ | 限界上下文列表 |
| sampleRequirement | string | ✅ | 示例需求文本 |
| tags | string[] | ✅ | 标签列表 |
| createdAt | string (ISO) | ✅ | 创建时间 |
| updatedAt | string (ISO) | ✅ | 更新时间 |

### Entity 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 实体名称 |
| type | 'aggregate' \| 'entity' \| 'valueObject' | 实体类型 |
| attributes | EntityAttribute[] | 属性列表 |
| description | string | 描述 |

### BoundedContext 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 上下文名称 |
| entities | string[] | 关联实体名称列表 |
| description | string | 描述 |

---

## 3. API 端点

### GET /api/v1/templates
列表查询。

**Query 参数**:
- `industry`: 可选，行业过滤
- `search`: 可选，名称/描述搜索

**响应**: `{ templates: Template[] }`

### GET /api/v1/templates/:id
详情查询。

**响应**: `Template`

### POST /api/v1/templates
创建模板。

**Body**: `Template`（除 id/createdAt/updatedAt 外）

**响应**: `201 Created` + `Template`

### PUT /api/v1/templates/:id
更新模板。

**Body**: `Partial<Template>`

**响应**: `200 OK` + `Template`

### DELETE /api/v1/templates/:id
删除模板。

**响应**: `204 No Content`

---

## 4. Error Codes

| Code | HTTP | 说明 |
|------|------|------|
| TEMPLATE_NOT_FOUND | 404 | 模板不存在 |
| VALIDATION_ERROR | 400 | 字段校验失败 |
| UNAUTHORIZED | 401 | 未登录 |
| FORBIDDEN | 403 | 无权限 |
| INTERNAL_ERROR | 500 | 服务器错误 |

---

## 5. DoD

- [x] GET /api/v1/templates — 列表过滤
- [x] GET /api/v1/templates/:id — 详情
- [x] POST /api/v1/templates — 创建
- [x] PUT /api/v1/templates/:id — 更新
- [x] DELETE /api/v1/templates/:id — 删除
- [x] Zod schema 校验
- [x] Industry 枚举完整
- [x] Error codes 统一
