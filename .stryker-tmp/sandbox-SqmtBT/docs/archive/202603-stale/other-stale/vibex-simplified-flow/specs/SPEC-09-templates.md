# SPEC-09: GET /api/templates

> **模板市场列表 API** — 公开模板浏览

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `GET /api/templates` |
| **所属模块** | `Template` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

浏览和筛选公开模板列表，支持分类、标签、克隆次数排序。

---

## 接口定义

**方法**: `GET`  
**路径**: `/api/templates`  
**认证**: `Required`

### Query Parameters

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `category` | `string` | 否 | 分类筛选 | `电商` |
| `tag` | `string` | 否 | 标签筛选 | `SaaS` |
| `page` | `number` | 否 | 页码, default 1 | `1` |
| `limit` | `number` | 否 | 每页数量, default 20, max 50 | `20` |
| `sort` | `string` | 否 | 排序: `popular` `newest` `name` | `popular` |

---

## 响应

### 200 OK

```typescript
interface ListTemplatesResponse {
  success: true;
  data: {
    templates: TemplateSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface TemplateSummary {
  id: string;
  name: string;
  description?: string;
  preview: {
    domainCount: number;
    nodeCount: number;
    uiNodeCount: number;
    thumbnail?: string;   // 预览图 URL
  };
  tags: string[];         // e.g. ["电商", "SaaS", "后台管理"]
  usageCount: number;     // 被克隆次数
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isPublic: boolean;
}
```

---

## 示例

```bash
# 浏览电商模板
curl -X GET "https://api.vibex.top/api/templates?category=电商&sort=popular&page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# 按标签筛选
curl -X GET "https://api.vibex.top/api/templates?tag=SaaS" \
  -H "Authorization: Bearer <token>"
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| 正常分页 | `page=2&limit=10` | 返回第 11-20 条 |
| limit 超限 | `limit=100` | `400` + max 50 |
| 无结果 | `category=不存在的分类` | `200` + 空列表 |
| 无认证 | 无 Authorization header | `401` |

---

## 测试用例

```typescript
describe('GET /api/templates', () => {
  beforeEach(async () => {
    await setupPublicTemplates();
  });

  it('should return paginated templates', async () => {
    const res = await api.get('/api/templates?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.data.data.templates.length).toBeLessThanOrEqual(10);
    expect(res.data.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('should filter by category', async () => {
    const res = await api.get('/api/templates?category=电商');
    expect(res.data.data.templates.every(t => t.tags.includes('电商'))).toBe(true);
  });

  it('should sort by popularity', async () => {
    const res = await api.get('/api/templates?sort=popular');
    const counts = res.data.data.templates.map(t => t.usageCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('should return 400 for limit > 50', async () => {
    const res = await api.get('/api/templates?limit=100');
    expect(res.status).toBe(400);
  });
});
```

---

## 验证命令

```bash
# 1. 列表浏览
curl -s "https://api.vibex.top/api/templates?sort=popular" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '{total: .data.pagination.total, first: .data.templates[0].name}'

# 2. 分类筛选
curl -s "https://api.vibex.top/api/templates?category=电商" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.data.templates | length'

# 3. 分页验证
curl -s "https://api.vibex.top/api/templates?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.data.pagination'
```

---

## 关联 Specs

- **关联**: `SPEC-06-project-clone.md` (克隆模板)
- **关联**: `SPEC-03-project-snapshot.md` (模板详情)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
