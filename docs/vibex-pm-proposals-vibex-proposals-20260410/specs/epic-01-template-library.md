# Epic E01 Spec: 需求模板库

> **Epic ID**: E01
> **Epic 名称**: 需求模板库
> **优先级**: P0
> **预计工时**: 3h
> **关联 Feature**: F01
> **关联提案**: P001

---

## 1. 概述

提供电商、社交、SaaS 三类行业模板，用户选择模板后自动填充示例需求，降低首次使用门槛，提升 AI 生成质量。

---

## 2. 模板存储结构

### 2.1 文件位置

```
/content/templates/
├── ecommerce.yaml
├── social.yaml
└── saas.yaml
```

### 2.2 模板 Schema

```yaml
title: "电商行业领域建模模板"
industry: "ecommerce"
description: "适用于电商平台的 DDD 领域建模"
entities:
  - name: "订单 (Order)"
    fields:
      - "orderId: string (主键)"
      - "userId: string (外键)"
      - "status: OrderStatus (枚举)"
      - "totalAmount: decimal"
      - "createdAt: datetime"
  - name: "用户 (User)"
    fields:
      - "userId: string (主键)"
      - "username: string"
      - "email: string"
      - "phone: string"
  - name: "商品 (Product)"
    fields:
      - "productId: string (主键)"
      - "name: string"
      - "price: decimal"
      - "stock: integer"
contexts:
  - name: "订单上下文"
    description: "处理订单创建、支付、履约流程"
  - name: "用户上下文"
    description: "处理用户注册、认证、个人信息管理"
  - name: "商品上下文"
    description: "处理商品上架、库存管理"
example_requirements: |
  我们要开发一个电商平台，需要包含以下功能：
  1. 用户可以注册和登录
  2. 用户可以浏览商品列表和详情
  3. 用户可以将商品加入购物车
  4. 用户可以下单并完成支付
  5. 商家可以管理商品库存
  6. 系统需要处理订单状态流转
```

---

## 3. 用户流程

```
用户访问首页
    ↓
点击「使用模板」按钮
    ↓
打开模板库页面 /templates
    ↓
浏览模板卡片列表（电商/社交/SaaS）
    ↓
点击选择行业模板
    ↓
返回首页，输入框自动填充模板内容
    ↓
用户可修改/补充内容
    ↓
提交 AI 分析
```

---

## 4. 组件设计

### 4.1 TemplateCard

| 属性 | 类型 | 说明 |
|------|------|------|
| template | TemplateObject | 模板数据对象 |
| onSelect | () => void | 选择模板回调 |

**交互**:
- Hover: 显示阴影提升效果
- Click: 触发 onSelect，路由跳转回首页

### 4.2 TemplateFilter

**交互**:
- 支持按行业筛选（全部/电商/社交/SaaS）
- 筛选时模板卡片列表实时过滤

### 4.3 TemplateDetailModal

**交互**:
- 点击模板卡片展开详情
- 显示实体列表、限界上下文描述
- 「使用此模板」按钮填充内容

---

## 5. Stories 实现细节

### E01-S1: 模板存储结构定义（0.5h）

- [ ] 创建 `/content/templates/` 目录
- [ ] 编写 `ecommerce.yaml`、`social.yaml`、`saas.yaml` 三个模板文件
- [ ] 定义 TypeScript 类型 `TemplateSchema` 验证模板结构
- [ ] 编写 loader 函数 `loadTemplates(): Promise<Template[]>`

```typescript
// src/types/template.ts
interface TemplateField {
  name: string
  type: string
  description?: string
}

interface TemplateEntity {
  name: string
  fields: string[]
}

interface TemplateContext {
  name: string
  description: string
}

interface Template {
  title: string
  industry: 'ecommerce' | 'social' | 'saas'
  description: string
  entities: TemplateEntity[]
  contexts: TemplateContext[]
  example_requirements: string
}
```

### E01-S2: 模板库页面开发（1.5h）

- [ ] 创建路由 `/templates`
- [ ] 实现 `TemplateCard` 组件
- [ ] 实现 `TemplateFilter` 筛选组件
- [ ] 实现 `TemplateList` 列表组件
- [ ] 页面加载时调用 `loadTemplates()` 获取数据
- [ ] 响应式布局适配

### E01-S3: 模板选择与填充（1h）

- [ ] 点击模板后，通过 URL 参数或状态传递模板数据回首页
- [ ] 首页 `RequirementInput` 组件接收模板数据
- [ ] 自动填充 `example_requirements` 内容
- [ ] 支持用户编辑修改
- [ ] 填充状态通过 URL query 参数 `?template=ecommerce` 标识

---

## 6. API 设计

本次方案为本地文件系统，无后端 API 依赖。

前端直接读取 `/content/templates/*.yaml` 文件：
```typescript
// src/services/templateService.ts
export async function loadTemplates(): Promise<Template[]> {
  const modules = import.meta.glob('/content/templates/*.yaml')
  // 使用 js-yaml 解析
}
```

---

## 7. 验收测试用例

```typescript
// spec/e2e/template-library.spec.ts

describe('E01 需求模板库', () => {
  it('E01-S2: 模板库页面正常加载', async ({ page }) => {
    await page.goto('/templates')
    await expect(page).toHaveTitle(/模板库/)
    await expect(page.locator('.template-card')).toHaveCount(3)
  })

  it('E01-S2: 每个模板显示名称和行业', async ({ page }) => {
    await page.goto('/templates')
    const cards = page.locator('.template-card')
    await expect(cards.first().locator('.template-title')).toBeVisible()
    await expect(cards.first().locator('.template-industry')).toBeVisible()
  })

  it('E01-S3: 点击模板跳转首页并填充内容', async ({ page }) => {
    await page.goto('/templates')
    await page.click('.template-card[data-industry="ecommerce"]')
    await page.click('button:has-text("使用此模板")')
    await expect(page).toHaveURL(/\//)
    const input = page.locator('#requirement-input')
    await expect(input).toHaveValue(/电商|订单|用户/)
  })

  it('E01-S3: 用户可修改填充内容', async ({ page }) => {
    await page.goto('/?template=ecommerce')
    const input = page.locator('#requirement-input')
    await input.fill('我的自定义需求')
    await expect(input).toHaveValue('我的自定义需求')
  })
})
```

---

## 8. 风险与依赖

| 风险 | 缓解措施 |
|-----|---------|
| 模板数量不足 | 上线前准备至少 3 个完整模板，人工审核内容质量 |
| 模板内容不适合所有用户 | 支持用户自定义修改，不强制完整使用 |
| 后续迁移成本 | 模板 Schema 设计时考虑扩展性，支持方案 B 迁移 |
