# E04 模板 API 完整 CRUD — QA 验证规格

**Epic**: E04 | **验证策略**: gstack 浏览器交互验证
**E2E 文件**: templates-crud.spec.ts（276行）

---

## 页面: /dashboard/templates

### 验证场景
访问 /dashboard/templates，验证模板 CRUD 全链路和导入导出功能。

### 四态验证

**理想态（有模板数据）**
- 模板列表正常显示
- 每个模板显示：名称、描述、创建时间、操作按钮
- "新建模板"按钮可见
- 新建/编辑/删除按钮功能可用

**空状态**
- 无模板时显示空状态插图
- 引导文案："暂无模板，点击新建"
- "新建模板"按钮直接可见

**加载态**
- 列表区域显示骨架屏
- 不阻塞操作按钮

**错误态**
- 网络异常时显示错误信息
- "重试"按钮可用
- 不崩溃

### 验收断言（gstack /qa 格式）

```javascript
// E04-Q1: /dashboard/templates 可访问
await expect(page).toHaveURL(/\/dashboard\/templates/)
await expect(page.locator('[data-testid="templates-page"]')).toBeVisible()

// E04-Q2: 模板列表或空状态显示
const listOrEmpty = page.locator('[data-testid="template-list"], [data-testid="empty-state"]')
await expect(listOrEmpty.first()).toBeVisible()

// E04-Q3: 新建按钮可见
await expect(page.locator('[data-testid="new-template-btn"]')).toBeVisible()

// E04-Q4: 新建模板流程
await page.click('[data-testid="new-template-btn"]')
await expect(page.locator('[data-testid="template-form"], modal')).toBeVisible()
await page.fill('[data-testid="template-name-input"]', 'E2E Test Template')
await page.click('[data-testid="save-template-btn"]')
await expect(page.locator('text=/成功|Success|已保存/')).toBeVisible()

// E04-Q5: 导出按钮存在
const exportBtn = page.locator('[data-testid="export-template-btn"]')
await expect(exportBtn).toBeVisible()

// E04-Q6: 导入按钮存在
const importBtn = page.locator('[data-testid="import-template-btn"]')
await expect(importBtn).toBeVisible()
```

### 执行方式
`/qa --url http://localhost:3000/dashboard/templates --assert "E04-Q1 to E04-Q6"`
