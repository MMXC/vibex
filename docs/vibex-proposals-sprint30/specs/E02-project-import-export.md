# Spec: E02 — 项目导入/导出

**Epic**: E02 项目导入/导出
**Stories**: S03, S04, S05
**Agent**: pm
**日期**: 2026-05-07

---

## 1. 概述

实现项目导出（.vibex JSON 文件）和导入（Dashboard 重建项目）功能，解决 localStorage 数据不跨设备持久化问题。

---

## 2. 文件格式规范

### .vibex 文件结构（v1.0）

```json
{
  "version": "1.0",
  "project": {
    "id": "uuid-xxx",
    "name": "项目名称",
    "description": "",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-05-07T00:00:00Z"
  },
  "trees": {
    "componentTree": { ... },
    "prototypeTree": { ... },
    "contextTree": { ... }
  },
  "exportedAt": "2026-05-07T12:00:00Z",
  "exportedBy": "user_id"
}
```

### 校验规则

| 字段 | 规则 |
|------|------|
| version | 必填，值为 `"1.0"`，非字符串或不匹配 → `INVALID_VERSION` |
| project | 必填，非空对象 |
| trees | 必填，含 `componentTree/prototypeTree/contextTree` 三个 key |
| exportedAt | ISO 8601 格式，非格式 → `INVALID_DATE` |
| exportedBy | 必填，非空字符串 |

---

## 3. API 端点

### 3.1 导出项目

```
GET /api/projects/:id/export

Response 200:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="项目名.vibex"

{ /* .vibex JSON body */ }

Error Codes:
- 401: UNAUTHORIZED
- 403: FORBIDDEN       (不是项目 owner 或 collaborator)
- 404: NOT_FOUND      (project id 不存在)
```

### 3.2 导入项目

```
POST /api/projects/import
Content-Type: multipart/form-data (file field) 或 application/json

Request (multipart):
  file: .vibex 文件

Request (JSON):
{ /* .vibex JSON body */ }

Response 201:
{
  "id": "new-uuid",
  "name": "项目名称",
  "importedAt": "2026-05-07T12:00:00Z"
}

Error Codes:
- 400: MISSING_FILE        (无 file 字段)
- 401: UNAUTHORIZED
- 422: INVALID_JSON        (文件无法解析为 JSON)
- 422: INVALID_VERSION     (version 字段缺失或非 "1.0")
- 422: INVALID_TREE_STRUCTURE  (缺少必需 tree key)
- 422: INVALID_DATE         (exportedAt 格式错误)
- 500: INTERNAL_ERROR      (DB write 失败)
```

---

## 4. 前端集成

### Dashboard 导出按钮

| 元素 | 描述 |
|------|------|
| 位置 | Dashboard 项目卡片右上角菜单 |
| 触发 | 点击 `导出为 .vibex` 菜单项 |
| 行为 | GET /api/projects/:id/export → 浏览器下载 |
| 加载态 | 按钮显示 spinner，禁用点击 |
| 错误态 | Toast: `导出失败，请稍后重试` |

### Dashboard 导入 Modal

| 元素 | 描述 |
|------|------|
| 触发 | Dashboard 顶部「导入项目」按钮 |
| 方式 | 拖拽 .vibex 文件或点击上传 |
| Dropzone | data-testid="import-dropzone" |
| 进度 | 导入中显示进度条 |
| 成功 | 关闭 Modal，新项目出现在 Dashboard |
| 错误 | 红色提示：`文件格式错误` / `不支持的版本` |

---

## 5. 端到端场景

### E2E: 导出 → 删除 → 导入 → 数据完整恢复

```
1. GET /api/projects/proj_001/export → 保存 response.json
2. DELETE /api/projects/proj_001
3. POST /api/projects/import (multipart, file=exported.json)
4. GET /api/projects/new_id → verify
5. 断言:
   - new_id !== proj_001
   - new_project.name === exported.project.name
   - new_project.trees === exported.trees
   - new_project.trees.contextTree === deepEqual(exported.trees.contextTree)
```

---

## 6. DoD

- [ ] `GET /api/projects/:id/export` → 200 + valid v1.0 JSON + Content-Disposition
- [ ] `POST /api/projects/import` → 201 + 新项目出现在 Dashboard
- [ ] Dashboard 导出按钮：点击 → 浏览器下载 .vibex 文件
- [ ] Dashboard 导入 Modal：拖拽 → 项目重建
- [ ] E2E: 导出 → 删除 → 导入 → 数据完整恢复（deepEqual trees）
- [ ] 错误码覆盖：400/401/403/404/422（INVALID_JSON/INVALID_VERSION/INVALID_TREE_STRUCTURE）
- [ ] 大文件（>5MB）：前端显示进度提示
- [ ] `tests/e2e/dashboard-import.spec.ts` 存在且通过
