# S9 Epic 4 Spec: DDL/PRD Generator v2

## 概述

Sprint 5/6 MVP 功能有限，需扩展：
- DDLGenerator：仅 VARCHAR/INT/DATE → 支持 7 种类型 + 索引
- PRDGenerator：仅 Markdown → 支持 JSON Schema + 预览面板

---

## F4.1 DDL 类型扩展

### 描述
DDLGenerator 支持 ENUM / JSONB / UUID / ARRAY 四种 PostgreSQL 类型。

### 类型映射

| PostgreSQL 类型 | DDL 示例 |
|----------------|----------|
| VARCHAR(n) | `col VARCHAR(255)` |
| INT | `col INTEGER` |
| DATE | `col DATE` |
| ENUM | `col VARCHAR(20) CHECK (col IN ('a','b','c'))` |
| JSONB | `col JSONB` |
| UUID | `col UUID DEFAULT gen_random_uuid()` |
| ARRAY | `col INTEGER[]` |

### DoD
- [ ] 7 种类型均生成正确 DDL
- [ ] DDL 含 CREATE INDEX 语句
- [ ] `npx vitest run generators.test.ts` 全通过
- [ ] E2E: 生成 DDL 在 pgAdmin 可执行

---

## F4.2 PRD 双格式输出

### 描述
PRDGenerator 输出 Markdown + JSON Schema。

### JSON Schema 结构
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "用户 ID" },
    "name": { "type": "string", "description": "用户名称" }
  },
  "required": ["id", "name"]
}
```

### DoD
- [ ] PRD 对象含 `.markdown` 和 `.jsonSchema`
- [ ] JSON Schema 含 `type` / `properties` / `required`
- [ ] Schema 字段覆盖完整

---

## F4.3 PRD 预览面板

### 描述
Generator 页面增加 Markdown/JSON Tab 切换预览面板。

### Tab 结构
- `tab-markdown` → 渲染 Markdown（`react-markdown`）
- `tab-json` → 渲染 JSON（`<pre>` + 语法高亮）

### DoD
- [ ] 面板可见（`data-testid="prd-preview-panel"`）
- [ ] Tab 切换正常
- [ ] Markdown 正确渲染（`## 需求概述` 等 heading）
- [ ] JSON 正确渲染（`"type": "object"` 等）
