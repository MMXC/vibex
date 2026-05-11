# Spec E2: 模板市场 MVP

## 概述

在 Dashboard 模板页面增加 marketplace 发现能力，提供可浏览/筛选的模板市场，包含静态 JSON 数据和前端 industry filter。

## S2.1 Marketplace API + 静态数据

### 文件结构

```
vibex-backend/src/app/api/templates/marketplace/route.ts
vibex-backend/public/data/marketplace-templates.json
```

### API 设计

**GET `/api/templates/marketplace`**

响应 200:
```json
{
  "templates": [
    {
      "id": "tpl_mkt_001",
      "name": "SaaS Dashboard Pro",
      "industry": "saas",
      "description": "企业级 SaaS 管理后台模板，包含数据可视化和用户管理模块",
      "tags": ["dashboard", "data-viz", "admin"],
      "icon": "📊",
      "previewUrl": "/images/templates/saas-dashboard.png",
      "usageCount": 1247,
      "createdAt": "2026-03-01"
    },
    {
      "id": "tpl_mkt_002",
      "name": "Mobile Commerce Kit",
      "industry": "mobile",
      "description": "移动电商模板，包含商品展示、购物车和订单流程",
      "tags": ["ecommerce", "mobile", "shopping"],
      "icon": "🛒",
      "previewUrl": "/images/templates/mobile-commerce.png",
      "usageCount": 892,
      "createdAt": "2026-03-15"
    },
    {
      "id": "tpl_mkt_003",
      "name": "E-commerce Starter",
      "industry": "ecommerce",
      "description": "电商落地页模板，适合快速搭建产品展示和转化页面",
      "tags": ["landing", "product", "conversion"],
      "icon": "🛍️",
      "previewUrl": "/images/templates/ecommerce-landing.png",
      "usageCount": 2103,
      "createdAt": "2026-02-20"
    }
  ],
  "meta": {
    "total": 3,
    "lastUpdated": "2026-05-01"
  }
}
```

### 实现要求

1. `route.ts` 返回 `public/data/marketplace-templates.json` 内容
2. 无需数据库依赖，MVP 阶段为纯静态数据
3. 响应头 `Cache-Control: public, max-age=3600`

---

## S2.2 Dashboard 模板页 Industry Filter

### 文件位置
`vibex-fronted/src/app/dashboard/templates/page.tsx`

### UI 设计

```
┌─────────────────────────────────────────────┐
│  模板市场                                    │
├─────────────────────────────────────────────┤
│  [全部]  [SaaS]  [Mobile]  [E-commerce]      │  ← Industry Filter Tabs
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 📊       │  │ 🛒        │  │ 🛍️        │  │
│  │ SaaS     │  │ Mobile    │  │ E-comm    │  │
│  │ Dashboard│  │ Commerce  │  │ Starter   │  │
│  │ 使用 1247 │  │ 使用 892   │  │ 使用 2103 │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

### 实现要求

1. Tab 组件使用 `role="tab"`，name 含对应 industry 名称
2. 前端按 industry 过滤 marketplace 数据（无需重新请求）
3. Tab 切换状态用 React state 管理（`selectedIndustry: string | null`）
4. `selectedIndustry === null` 时显示全部模板
5. 每个模板卡片有 `data-testid="template-card"`

### 组件结构

```tsx
// Dashboard Templates Page
export default function TemplatesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const { data } = useSWR('/api/templates/marketplace');

  const industries = ['saas', 'mobile', 'ecommerce'];
  const filteredTemplates = selectedIndustry
    ? data?.templates.filter(t => t.industry === selectedIndustry)
    : data?.templates;

  return (
    <div>
      {/* Industry Filter Tabs */}
      <div role="tablist">
        <button role="tab" onClick={() => setSelectedIndustry(null)}>全部</button>
        {industries.map(ind => (
          <button key={ind} role="tab" onClick={() => setSelectedIndustry(ind)}>
            {ind.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div>
        {filteredTemplates?.map(tpl => (
          <div key={tpl.id} data-testid="template-card">{tpl.name}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## E2 E2E 测试

### 文件位置
`vibex-fronted/tests/e2e/templates-market.spec.ts`

```typescript
// TC1: marketplace API 返回 200 和 ≥3 个模板
test('GET /api/templates/marketplace returns 200 with templates', async ({ request }) => {
  const response = await request.get('/api/templates/marketplace');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.templates.length).toBeGreaterThanOrEqual(3);
});

// TC2: Dashboard 模板页 industry filter 可切换
test('industry filter tabs are clickable and filter templates', async ({ page }) => {
  await page.goto('/dashboard/templates');
  
  // SaaS tab exists
  const saasTab = page.getByRole('tab', { name: /saas/i });
  await expect(saasTab).toBeInTheDocument();
  
  // Click SaaS tab
  await saasTab.click();
  
  // Template cards rendered
  await expect(page.locator('[data-testid="template-card"]').first()).toBeVisible();
});
```

---

## DoD 检查清单

- [ ] GET `/api/templates/marketplace` 返回 HTTP 200
- [ ] 返回 ≥3 个模板，每个含 industry/description/tags/icon 字段
- [ ] `/dashboard/templates` 页面存在 saas/mobile/ecommerce 三个 tab
- [ ] Tab 切换后模板列表正确过滤
- [ ] `templates-market.spec.ts` E2E 测试通过
- [ ] TypeScript 类型检查通过
