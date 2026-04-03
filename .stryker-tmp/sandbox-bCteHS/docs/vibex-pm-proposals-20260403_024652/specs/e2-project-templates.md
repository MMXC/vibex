# Epic E2 Spec: 项目模板库

**Epic**: E2 - 项目模板库
**优先级**: P1
**工时**: 6-8h
**依赖**: 无
**状态**: 规划中

---

## 1. Overview

### 1.1 目标
提供预设项目模板，用户可一键创建标准化 DDD 项目结构。

### 1.2 用户价值
- 用户无需从空白画布开始
- 标准化模板帮助新手理解 DDD 结构
- 快速启动标准化项目，提升效率

---

## 2. Template Data Structure

### 2.1 Template Schema

```typescript
interface ProjectTemplate {
  id: string;
  version: 1;
  name: string;
  description: string;
  thumbnail: string;
  category: TemplateCategory;
  contexts: TemplateContext[];
  flows: TemplateFlow[];
  components?: TemplateComponent[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type TemplateCategory = 
  | 'business'    // 业务系统
  | 'user'        // 用户管理
  | 'ecommerce'   // 电商
  | 'general';    // 通用

interface TemplateContext {
  name: string;
  description: string;
  entities?: string[];
}

interface TemplateFlow {
  name: string;
  context: string;
  steps: string[];
}

interface TemplateComponent {
  name: string;
  type: ComponentType;
  description: string;
}
```

### 2.2 内置模板

#### 模板 1: 电商系统 (ecommerce)
```json
{
  "id": "ecommerce",
  "name": "电商系统",
  "description": "适合电商平台领域建模，包含商品、订单、用户三大核心域",
  "category": "ecommerce",
  "contexts": [
    { "name": "商品域", "description": "商品目录和库存管理", "entities": ["商品", "SKU", "库存"] },
    { "name": "订单域", "description": "订单处理和履约", "entities": ["订单", "订单项", "支付"] },
    { "name": "用户域", "description": "用户账户和会员", "entities": ["用户", "地址", "会员"] }
  ],
  "flows": [
    { "name": "下单流程", "context": "订单域", "steps": ["选择商品", "加入购物车", "提交订单", "支付", "确认发货"] },
    { "name": "注册流程", "context": "用户域", "steps": ["填写信息", "验证手机", "完成注册"] }
  ],
  "tags": ["电商", "标准", "入门"]
}
```

#### 模板 2: 用户管理模块 (user)
```json
{
  "id": "user-management",
  "name": "用户管理模块",
  "description": "标准用户管理系统，包含注册、登录、权限管理",
  "category": "user",
  "contexts": [
    { "name": "认证域", "description": "用户身份认证", "entities": ["用户", "凭证", "会话"] },
    { "name": "权限域", "description": "权限和角色管理", "entities": ["角色", "权限", "资源"] }
  ],
  "flows": [
    { "name": "登录流程", "context": "认证域", "steps": ["输入账号", "输入密码", "验证码", "登录成功"] },
    { "name": "权限校验流程", "context": "权限域", "steps": ["获取角色", "查询权限", "校验资源"] }
  ],
  "tags": ["用户", "权限", "认证"]
}
```

#### 模板 3: 通用业务系统 (general)
```json
{
  "id": "generic-business",
  "name": "通用业务系统",
  "description": "适合一般业务系统的 DDD 骨架",
  "category": "general",
  "contexts": [
    { "name": "业务域", "description": "核心业务逻辑", "entities": ["业务对象"] },
    { "name": "数据域", "description": "数据管理", "entities": ["数据实体"] }
  ],
  "flows": [
    { "name": "标准业务流程", "context": "业务域", "steps": ["开始", "处理", "结束"] }
  ],
  "tags": ["通用", "骨架"]
}
```

---

## 3. Component Design

### 3.1 核心组件

| 组件名 | 文件 | 职责 |
|--------|------|------|
| TemplateSelector | `components/templates/TemplateSelector.tsx` | 模板选择器容器 |
| TemplateGrid | `components/templates/TemplateGrid.tsx` | 模板网格布局 |
| TemplateCard | `components/templates/TemplateCard.tsx` | 模板卡片 |
| TemplatePreview | `components/templates/TemplatePreview.tsx` | 模板预览弹窗 |
| TemplateFilter | `components/templates/TemplateFilter.tsx` | 模板分类筛选 |

### 3.2 Store Design

```typescript
// stores/templateStore.ts
interface TemplateState {
  templates: ProjectTemplate[];
  selectedCategory: TemplateCategory | 'all';
  selectedTemplate: ProjectTemplate | null;
  isPreviewOpen: boolean;
  
  // Actions
  loadTemplates: () => Promise<void>;
  selectCategory: (category: TemplateCategory | 'all') => void;
  selectTemplate: (template: ProjectTemplate) => void;
  openPreview: (template: ProjectTemplate) => void;
  closePreview: () => void;
  createFromTemplate: (templateId: string) => Promise<Project>;
}
```

---

## 4. UI Flow

### 4.1 新建项目页面

```
┌─────────────────────────────────────────────────────┐
│  新建项目                                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │             │  │             │                   │
│  │  空白项目    │  │  从模板创建  │                   │
│  │             │  │             │                   │
│  │  从头开始    │  │  快速启动   │                   │
│  └─────────────┘  └─────────────┘                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.2 模板选择器

```
┌─────────────────────────────────────────────────────┐
│  选择模板                           [全部][业务][用户][电商] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ [图片]   │  │ [图片]   │  │ [图片]   │             │
│  │         │  │         │  │         │             │
│  │ 电商系统 │  │用户管理  │  │通用业务  │             │
│  │ 电商    │  │ 用户    │  │ 通用    │             │
│  │ ⭐⭐⭐⭐  │  │ ⭐⭐⭐⭐  │  │ ⭐⭐⭐    │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.3 模板预览弹窗

```
┌─────────────────────────────────────────────────────┐
│  电商系统                                    [X]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  描述: 适合电商平台领域建模                           │
│                                                      │
│  限界上下文 (3)                                      │
│  ├── 商品域: 商品目录和库存管理                        │
│  ├── 订单域: 订单处理和履约                           │
│  └── 用户域: 用户账户和会员                           │
│                                                      │
│  业务流程 (2)                                        │
│  ├── 下单流程 → 5步                                  │
│  └── 注册流程 → 3步                                   │
│                                                      │
│  标签: 电商 | 标准 | 入门                            │
│                                                      │
│           [取消]              [使用此模板]            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 获取模板列表

```
GET /api/templates
Response: {
  templates: ProjectTemplate[];
}
```

### 5.2 获取模板详情

```
GET /api/templates/:id
Response: {
  template: ProjectTemplate;
}
```

### 5.3 从模板创建项目

```
POST /api/projects/from-template
Body: {
  templateId: string;
  projectName?: string;
}
Response: {
  project: Project;
}
```

---

## 6. Technical Implementation

### 6.1 模板加载

```typescript
// hooks/useTemplates.ts
const useTemplates = () => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates);
        setLoading(false);
      });
  }, []);
  
  return { templates, loading };
};
```

### 6.2 项目创建

```typescript
// services/templateService.ts
const createProjectFromTemplate = async (
  templateId: string,
  projectName?: string
): Promise<Project> => {
  const response = await fetch('/api/projects/from-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, projectName }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create project from template');
  }
  
  return response.json();
};
```

---

## 7. Acceptance Criteria

### E2-S1: 模板选择器入口
- [ ] `expect(templateEntry.isVisible()).toBe(true)` 模板入口可见
- [ ] `expect(templateEntry.getText()).toContain('模板')` 入口文案正确
- [ ] `expect(templateEntry.isClickable()).toBe(true)` 入口可点击

### E2-S2: 模板卡片展示
- [ ] `expect(templateCards.length()).toBeGreaterThanOrEqual(3)` 至少3个模板
- [ ] `expect(templateCard.find('.thumbnail').isVisible()).toBe(true)` 缩略图可见
- [ ] `expect(templateCard.find('.name').getText()).toBeTruthy()` 名称非空
- [ ] `expect(templateCard.find('.tags').isVisible()).toBe(true)` 标签可见

### E2-S3: 模板预览功能
- [ ] `expect(previewModal.isVisible()).toBe(true)` 预览弹窗打开
- [ ] `expect(previewModal.find('.contexts').isVisible()).toBe(true)` 上下文列表可见
- [ ] `expect(previewModal.find('.flows').isVisible()).toBe(true)` 流程列表可见
- [ ] `expect(previewModal.find('.create-btn').isClickable()).toBe(true)` 创建按钮可点击

### E2-S4: 模板分类筛选
- [ ] `expect(filterTabs.isVisible()).toBe(true)` 筛选标签可见
- [ ] `expect(filterTabs.find('tab[active]').getText()).toBe('全部')` 默认显示全部
- [ ] `expect(filterTabs.find('tab').at(1).isClickable()).toBe(true)` 分类可切换
- [ ] `expect(templateCards.length()).toChangeWhenFilter('业务系统')` 筛选后卡片数量变化

### E2-S5: 模板项目创建
- [ ] `expect(project.name).toBe(template.name)` 项目名称正确
- [ ] `expect(project.contexts.length).toBe(template.contexts.length)` 上下文数量正确
- [ ] `expect(project.flows.length).toBe(template.flows.length)` 流程数量正确
- [ ] `expect(navigation.getCurrentPath()).toBe('/canvas/:id')` 跳转至画布页面

---

## 8. Test Cases

### TC-E2-001: 显示模板列表
```typescript
test('TC-E2-001: 模板选择器应显示至少3个模板', async ({ page }) => {
  await page.goto('/projects/new');
  await page.click('#template-entry');
  
  const cards = page.locator('.template-card');
  await expect(cards).toHaveCount(3);
});
```

### TC-E2-002: 分类筛选
```typescript
test('TC-E2-002: 切换分类应筛选模板', async ({ page }) => {
  await page.goto('/projects/new');
  await page.click('#template-entry');
  
  // Click "电商" filter
  await page.click('.filter-tab:has-text("电商")');
  
  const cards = page.locator('.template-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('电商');
});
```

### TC-E2-003: 从模板创建项目
```typescript
test('TC-E2-003: 选择模板后应创建项目并跳转', async ({ page }) => {
  await page.goto('/projects/new');
  await page.click('#template-entry');
  
  // Select first template
  await page.click('.template-card:first-child');
  
  // Preview should open
  await expect(page.locator('#template-preview')).toBeVisible();
  
  // Click create
  await page.click('#create-from-template');
  
  // Should navigate to canvas
  await expect(page).toHaveURL(/\/canvas\/.+/);
});
```

---

## 9. Milestone

| 日期 | 里程碑 |
|------|--------|
| Week 1 | 完成模板数据结构和基础组件 |
| Week 2 | 完成模板预览和创建逻辑 |
| Week 3 | 完成测试和文档 |
