# Spec E2: 模板市场 MVP

## S2.1 Marketplace API + 静态数据

### 实现位置
`vibex-backend/src/app/api/templates/marketplace/route.ts`（新建）
`vibex-backend/public/data/marketplace-templates.json`（新建）

### API 设计

**GET `/api/templates/marketplace`**

响应 200:
```json
{
  "templates": [
    { "id": "tpl_mkt_001", "name": "SaaS Dashboard Pro", "industry": "saas", "description": "...", "tags": ["dashboard"], "icon": "📊", "usageCount": 1247 },
    { "id": "tpl_mkt_002", "name": "Mobile Commerce Kit", "industry": "mobile", "description": "...", "tags": ["ecommerce"], "icon": "🛒", "usageCount": 892 },
    { "id": "tpl_mkt_003", "name": "E-Commerce Starter", "industry": "ecommerce", "description": "...", "tags": ["landing"], "icon": "🛍️", "usageCount": 2103 }
  ],
  "meta": { "total": 3, "lastUpdated": "2026-05-11" }
}
```

### 实现要求

1. `route.ts` 返回 `public/data/marketplace-templates.json` 内容
2. 无数据库依赖，MVP 为纯静态数据
3. `Cache-Control: public, max-age=3600`
4. 每个模板 `icon` 字段必须为 emoji（非空）

---

## S2.2 Dashboard Industry Filter

### 实现位置
`vibex-fronted/src/app/dashboard/templates/page.tsx`（修改）

### 四态定义（TemplateCard + IndustryFilter）

#### IndustryFilter Tab

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | 用户点击某个 tab（saas/mobile/ecommerce）| Tab 高亮，模板卡片正确过滤 | — |
| 空状态 | 某 industry 下无模板 | 显示空状态插图 + 文案 | "该分类暂无可用模板，看看其他分类？" |
| 加载态 | 等待 marketplace API 响应 | 骨架屏占位（禁止转圈，会抖动）| — |
| 错误态 | API 404 / network error | 显示错误文案 + 重试按钮 | "加载失败，请检查网络后重试" |

#### TemplateCard

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | 模板数据加载完成 | 显示 icon + name + industry tag + usageCount | — |
| 空状态 | 该分类无模板 | 整区显示空状态，不渲染 TemplateCard | "该分类暂无可用模板，看看其他分类？" |
| 加载态 | 模板数据加载中 | 骨架屏（3 个卡片占位框）| — |
| 错误态 | 单个模板数据损坏 | 该卡片显示降级文案，页面其余卡片正常 | "模板加载失败" |

### 实现要求

```tsx
export default function TemplatesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('saas');
  const { data, error, isLoading } = useSWR('/api/templates/marketplace');

  const industries = ['saas', 'mobile', 'ecommerce'];
  const filteredTemplates = data?.templates?.filter(
    t => t.industry === selectedIndustry
  ) ?? [];

  return (
    <>
      {/* Industry Filter Tabs */}
      <div role="tablist">
        {industries.map(ind => (
          <button
            key={ind}
            role="tab"
            aria-selected={selectedIndustry === ind}
            onClick={() => setSelectedIndustry(ind)}
          >
            {ind.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && <TemplateCardSkeleton count={3} />}

      {/* Error state */}
      {error && (
        <div>
          <p>加载失败，请检查网络后重试</p>
          <button onClick={() => mutate()}>重试</button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredTemplates.length === 0 && (
        <div>
          <EmptyStateIllustration />
          <p>该分类暂无可用模板，看看其他分类？</p>
        </div>
      )}

      {/* Template grid */}
      {!isLoading && !error && filteredTemplates.length > 0 && (
        <div>
          {filteredTemplates.map(tpl => (
            <div key={tpl.id} data-testid="template-card">
              <span>{tpl.icon}</span>
              <span>{tpl.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```

### E2E 测试（templates-market.spec.ts）

```typescript
test('industry filter tabs are clickable and filter templates', async ({ page }) => {
  await page.goto('/dashboard/templates');

  // SaaS tab exists
  const saasTab = page.getByRole('tab', { name: /saas/i });
  await expect(saasTab).toBeInTheDocument();

  // Template cards rendered
  await expect(page.locator('[data-testid="template-card"]').first()).toBeVisible();
});

test('marketplace API returns 200 with at least 3 templates', async ({ request }) => {
  const response = await request.get('/api/templates/marketplace');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.templates.length).toBeGreaterThanOrEqual(3);
});
```

---

## DoD 检查清单

- [ ] GET `/api/templates/marketplace` 返回 HTTP 200
- [ ] 返回 ≥3 个模板，每个含 industry/description/tags/icon 字段
- [ ] `icon` 字段为非空 emoji
- [ ] `/dashboard/templates` 存在 saas/mobile/ecommerce 三个 tab
- [ ] Tab 切换后模板列表正确过滤
- [ ] 空状态有引导插图 + 文案（禁止留白）
- [ ] 加载态使用骨架屏（禁止转圈）
- [ ] 错误态有重试按钮
- [ ] `templates-market.spec.ts` E2E 测试通过
- [ ] TypeScript 类型检查通过
- [ ] 四态定义完整（TemplateCard + IndustryFilter）