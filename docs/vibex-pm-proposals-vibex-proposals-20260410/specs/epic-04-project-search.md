# Epic E04 Spec: 项目搜索过滤

> **Epic ID**: E04
> **Epic 名称**: 项目搜索过滤
> **优先级**: P1
> **预计工时**: 2h
> **关联 Feature**: F04
> **关联提案**: P004

---

## 1. 概述

在项目列表页面提供全局搜索栏和分类过滤功能，支持按名称、时间、标签快速定位目标项目，搜索响应时间控制在 200ms 以内。

---

## 2. 用户流程

```
用户访问 /projects
    ↓
查看项目列表（默认按更新时间倒序）
    ↓
输入搜索关键词 / 选择过滤条件
    ↓
实时过滤项目列表
    ↓
点击项目进入详情
```

---

## 3. 过滤维度

| 维度 | 过滤类型 | 数据来源 |
|------|---------|---------|
| 项目名称 | 模糊搜索（包含匹配） | project.name |
| 创建时间 | 时间范围选择 | project.createdAt |
| 更新时间 | 时间范围选择 | project.updatedAt |
| 行业标签 | 多选（电商/社交/SaaS/其他） | project.industry |
| 项目状态 | 单选（活跃/草稿/归档） | project.status |

---

## 4. 组件设计

### 4.1 ProjectSearchBar

| 属性 | 类型 | 说明 |
|------|------|------|
| value | string | 搜索关键词 |
| onChange | (value: string) => void | 搜索词变化回调 |
| placeholder | string | "搜索项目名称..." |

**交互**:
- 实时搜索（debounce 300ms）
- 清空按钮
- 搜索图标

### 4.2 ProjectFilter

| 属性 | 类型 | 说明 |
|------|------|------|
| filters | FilterState | 当前过滤条件 |
| onChange | (filters: FilterState) => void | 过滤条件变化 |

**子组件**:
- `TimeRangePicker` — 创建/更新时间范围
- `IndustryMultiSelect` — 行业多选
- `StatusSelect` — 状态单选

### 4.3 ProjectList

| 属性 | 类型 | 说明 |
|------|------|------|
| projects | Project[] | 项目列表 |
| isLoading | boolean | 加载状态 |

**交互**:
- 卡片式列表展示
- 悬浮显示项目信息
- 点击进入详情

---

## 5. 状态管理

```typescript
// src/stores/projectFilterStore.ts
interface FilterState {
  query: string
  createdAfter?: Date
  createdBefore?: Date
  industries: string[]
  status?: 'active' | 'draft' | 'archived'
  sortBy: 'updatedAt' | 'createdAt' | 'name'
  sortOrder: 'asc' | 'desc'
}

// URL 参数同步（可选，便于分享）
const filterToParams = (filter: FilterState): URLSearchParams => {
  const params = new URLSearchParams()
  if (filter.query) params.set('q', filter.query)
  if (filter.industries.length) params.set('industry', filter.industries.join(','))
  if (filter.status) params.set('status', filter.status)
  if (filter.sortBy) params.set('sort', filter.sortBy)
  return params
}
```

---

## 6. API 设计

### GET /api/v1/projects/search

**Query 参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| industry | string | 行业标签（逗号分隔多选） |
| status | string | 项目状态 |
| created_after | ISO date | 创建时间下限 |
| created_before | ISO date | 创建时间上限 |
| sort | string | 排序字段（updatedAt/createdAt/name） |
| order | asc/desc | 排序方向 |
| page | number | 页码 |
| limit | number | 每页数量（默认 20） |

**响应**:
```json
{
  "projects": [
    {
      "id": "proj_xxxx",
      "name": "电商平台领域模型",
      "industry": "ecommerce",
      "status": "active",
      "createdAt": "2026-04-01T10:00:00Z",
      "updatedAt": "2026-04-05T15:30:00Z",
      "tags": ["电商", "订单"]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

## 7. Stories 实现细节

### E04-S1: 搜索栏组件（0.5h）

- [ ] 实现 `ProjectSearchBar` 组件
- [ ] debounce 300ms 防抖
- [ ] 清空按钮
- [ ] 搜索图标
- [ ] 键盘 Enter 触发搜索

### E04-S2: 过滤逻辑实现（1h）

- [ ] 实现 `ProjectFilter` 组件
- [ ] 实现时间范围选择器
- [ ] 实现行业多选
- [ ] 实现状态单选
- [ ] 与 API 对接，实时过滤
- [ ] 搜索响应时间测试 < 200ms

### E04-S3: 分类视图（0.5h）

- [ ] 按时间分类（今天/本周/本月/更早）
- [ ] 按类型分类（电商/社交/SaaS/其他）
- [ ] 按状态分类（活跃/草稿/归档）
- [ ] 分类快捷入口

---

## 8. 验收测试用例

```typescript
describe('E04 项目搜索过滤', () => {
  beforeEach(async ({ page }) => {
    // 创建多个测试项目
    await seedTestProjects([
      { name: '电商平台', industry: 'ecommerce', status: 'active' },
      { name: '社交应用', industry: 'social', status: 'active' },
      { name: 'SaaS CRM', industry: 'saas', status: 'draft' },
    ])
  })

  it('E04-S2: 搜索响应时间 < 200ms', async ({ page }) => {
    await page.goto('/projects')
    const start = Date.now()
    await page.fill('#project-search', '电商')
    await page.waitForResponse(resp => resp.url().includes('/search'))
    expect(Date.now() - start).toBeLessThan(200)
  })

  it('E04-S2: 按名称搜索实时过滤', async ({ page }) => {
    await page.goto('/projects')
    await page.fill('#project-search', '电商')
    await expect(page.locator('.project-item')).toHaveCount(1)
    await expect(page.locator('.project-item').first()).toContainText('电商平台')
  })

  it('E04-S2: 按行业过滤', async ({ page }) => {
    await page.goto('/projects')
    await page.click('#filter-industry')
    await page.click('.filter-option[value="ecommerce"]')
    await expect(page.locator('.project-item')).toHaveCount(1)
  })

  it('E04-S2: 组合过滤', async ({ page }) => {
    await page.goto('/projects')
    await page.fill('#project-search', '平台')
    await page.click('.filter-option[value="ecommerce"]')
    await expect(page.locator('.project-item')).toHaveCount(1)
    await expect(page.locator('.project-item').first()).toContainText('电商平台')
  })

  it('E04-S3: 按时间分类', async ({ page }) => {
    await page.goto('/projects')
    await page.click('.category-tab[data-category="recent"]')
    await expect(page.locator('.project-item').first()).toBeVisible()
  })

  it('E04-S1: 清空搜索恢复全部', async ({ page }) => {
    await page.goto('/projects')
    await page.fill('#project-search', '电商')
    await page.click('.search-clear')
    await expect(page.locator('#project-search')).toHaveValue('')
    await expect(page.locator('.project-item')).toHaveCount(3)
  })
})
```

---

## 9. 性能优化

| 优化点 | 方案 |
|-------|------|
| 前端分页 | 首次加载 20 条，滚动加载更多 |
| debounce | 搜索输入 300ms 防抖，减少 API 调用 |
| 索引优化 | 后端按 name 建索引，LIKE 查询优化 |
| 缓存 | 热门搜索词缓存 5 分钟 |
