# E04: 模板 API — 详细规格

## 1. 背景

Sprint 28 E04 实现模板 CRUD API，本规格补全 API schema 定义和 JSON 导入/导出格式说明。

## 2. API 规格

### 2.1 POST /api/templates

创建模板。

**Request Body**
```json
{
  "name": "登录流程模板",
  "description": "标准的用户登录流程模板",
  "nodes": [],
  "edges": [],
  "version": 1
}
```

**Response 201**
```json
{
  "id": "tpl_abc123",
  "name": "登录流程模板",
  "description": "标准的用户登录流程模板",
  "nodes": [],
  "edges": [],
  "version": 1,
  "createdAt": "2026-05-01T10:00:00.000Z",
  "updatedAt": "2026-05-01T10:00:00.000Z"
}
```

### 2.2 GET /api/templates

获取模板列表。

**Response 200**
```json
{
  "templates": [
    { "id": "tpl_xxx", "name": "...", "description": "...", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

### 2.3 GET /api/templates/:id

获取单个模板详情。

**Response 200** — `{ "template": { ... } }`

### 2.4 PUT /api/templates/:id

更新模板。

**Request Body** — 同 POST

**Response 200** — `{ "template": { ... } }`

### 2.5 DELETE /api/templates/:id

删除模板。

**Response 200** — `{ "success": true }`

### 2.6 GET /api/templates/:id/export

导出模板为 JSON 文件。

**Response 200** — Content-Type: `application/json`, Content-Disposition: `attachment; filename="template-<id>.json"`

```json
{
  "name": "登录流程模板",
  "description": "...",
  "nodes": [...],
  "edges": [...],
  "exportedAt": "2026-05-01T10:00:00.000Z",
  "version": 1
}
```

### 2.7 POST /api/templates/import

导入模板 JSON。

**Request** — `multipart/form-data` 或 JSON body

**Response 201** — `{ "template": { ... }, "imported": true }`

**错误响应 400** — `{ "error": "INVALID_FORMAT", "message": "模板 JSON 格式错误" }`

## 3. Dashboard UI 布局

`/dashboard/templates` 页面：

```
┌─────────────────────────────────────────┐
│ 我的模板              [+ 新建] [导入]   │
├─────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐     │
│ │模板卡片 │  │模板卡片 │  │+ 新建  │     │
│ │ 名称   │  │ 名称   │  │ 模板   │     │
│ │描述... │  │描述... │  │        │     │
│ │[编辑] │  │[编辑] │  │        │     │
│ └────────┘  └────────┘  └────────┘     │
└─────────────────────────────────────────┘
```

卡片操作：编辑 / 导出 / 删除

## 4. JSON 导入/导出格式

导出 JSON 格式与模板内部结构完全一致，包含 `name`、`description`、`nodes`、`edges`、`version`。

导入时校验：
- `name` 必填（string）
- `nodes` / `edges` 可选（array）
- 非法格式返回 400 错误

## 5. 验收门控

- [ ] POST /api/templates 创建成功，返回 id
- [ ] GET /api/templates 返回列表
- [ ] PUT /api/templates/:id 更新成功
- [ ] DELETE /api/templates/:id 删除成功
- [ ] /export 返回正确 JSON 文件
- [ ] /import 接受有效 JSON，拒绝无效格式
- [ ] Dashboard templates 页面可正常加载
- [ ] tsc --noEmit exits 0