# SPEC: E5 — 需求模板库

**Epic:** E5 — P1 体验改善：需求输入  
**Stories:** S5.1, S5.2, S5.3, S5.4, S5.5  
**Owner:** dev + pm（pm 审核模板内容）  
**Estimated:** 3h

---

## 1. 概述

新用户进入 Canvas 后不知道如何描述业务需求。本 Epic 在需求输入前提供行业模板卡片，点击后自动填充输入框，降低冷启动摩擦。

---

## 2. 模板设计

### 2.1 模板 JSON Schema

**文件:** `src/data/templates/requirement-templates.json`

```typescript
interface RequirementTemplate {
  id: string;
  name: string;
  icon: string;        // emoji
  industry: string;
  description: string;
  content: string;     // 填充到输入框的模板文本
  keywords: string[];  // 高亮关键词
}

const templates: RequirementTemplate[] = [
  {
    id: 'ecommerce',
    name: '电商系统',
    icon: '🛒',
    industry: '零售',
    description: '商品管理、订单流程、支付与物流',
    content: `我们正在构建一个电商平台，需要支持以下核心功能：
1. 商品管理：商品上架、下架、库存管理、价格策略
2. 订单流程：购物车、订单创建、订单状态跟踪
3. 支付系统：集成主流支付渠道、退款处理
4. 物流配送：发货管理、物流跟踪、签收确认`,
    keywords: ['商品', '订单', '支付', '物流', '库存'],
  },
  {
    id: 'social',
    name: '社交平台',
    icon: '👥',
    industry: '社区',
    description: '用户关系、内容发布、消息通知',
    content: `我们需要开发一个社交平台，核心功能包括：
1. 用户系统：注册登录、个人资料、关注/粉丝
2. 内容发布：图文/视频动态、点赞、评论、分享
3. 关系网络：好友推荐、话题标签、推荐算法
4. 消息系统：私信、群聊、系统通知`,
    keywords: ['用户', '内容', '关系', '消息', '动态'],
  },
  {
    id: 'saas-admin',
    name: 'SaaS 管理后台',
    icon: '📊',
    industry: '企业服务',
    description: '组织管理、角色权限、数据报表',
    content: `我们需要一个 SaaS 化管理后台，功能包括：
1. 多租户组织管理：创建租户、部门结构、人员管理
2. 角色权限系统：RBAC 角色定义、权限分配、审计日志
3. 数据报表：关键指标仪表盘、自定义报表、数据导出
4. 系统设置：通知配置、集成管理、系统参数`,
    keywords: ['租户', '角色', '权限', '报表', '审计'],
  },
  {
    id: 'healthcare',
    name: '医疗预约系统',
    icon: '🏥',
    industry: '医疗健康',
    description: '患者管理、医生排班、预约流程',
    content: `我们正在开发医疗预约系统，核心需求：
1. 患者管理：患者档案、就诊记录、健康档案
2. 医生管理：医生资料、排班设置、可用时段
3. 预约流程：在线预约、改签取消、排队叫号
4. 处方管理：电子处方、用药提醒`,
    keywords: ['患者', '医生', '预约', '处方', '排班'],
  },
  {
    id: 'content-platform',
    name: '内容发布平台',
    icon: '📝',
    industry: '媒体',
    description: '作者管理、文章审核、发布流程',
    content: `我们需要构建一个内容发布平台，核心功能：
1. 作者管理：作者入驻、等级体系、收益结算
2. 内容创作：富文本编辑、素材库、版本管理
3. 审核流程：内容初审、复审、违规处理
4. 发布管理：定时发布、频道管理、推荐算法`,
    keywords: ['作者', '内容', '审核', '发布', '推荐'],
  },
  {
    id: 'custom',
    id: 'custom',
    name: '自定义需求',
    icon: '✨',
    industry: '通用',
    description: '从空白开始，自由描述你的业务需求',
    content: '',
    keywords: [],
  },
];
```

---

## 3. Story S5.1: 模板卡片渲染

### 3.1 实现方案

**文件:** `src/components/RequirementTemplateSelector/index.tsx`（新建）

```typescript
export function RequirementTemplateSelector({
  onSelect,
}: {
  onSelect: (template: RequirementTemplate) => void;
}) {
  const templates = useRequirementTemplates(); // 从 JSON 加载

  return (
    <div className="template-selector" data-testid="template-selector">
      <h3 className="template-title">选择业务场景模板（可选）</h3>
      <div className="template-grid">
        {templates.map((t) => (
          <button
            key={t.id}
            className="template-card"
            data-testid="template-card"
            onClick={() => onSelect(t)}
            aria-label={`选择 ${t.name} 模板`}
          >
            <span className="template-icon">{t.icon}</span>
            <div className="template-info">
              <span className="template-name">{t.name}</span>
              <span className="template-desc">{t.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 3.2 入口集成

**文件:** `src/pages/CanvasPage.tsx`

```typescript
const [selectedTemplate, setSelectedTemplate] = useState<RequirementTemplate | null>(null);

{!selectedTemplate && (
  <RequirementTemplateSelector onSelect={setSelectedTemplate} />
)}

{selectedTemplate && (
  <RequirementInput
    initialValue={selectedTemplate.content}
    keywords={selectedTemplate.keywords}
    onClearTemplate={() => setSelectedTemplate(null)}
  />
)}
```

### 3.3 验收标准

```typescript
const cards = screen.getAllByTestId('template-card');
expect(cards.length).toBeGreaterThanOrEqual(3);
// 验证每个卡片有图标和描述
cards.forEach((card) => {
  expect(card.querySelector('.template-icon')).toBeInTheDocument();
  expect(card.querySelector('.template-name')).toBeInTheDocument();
});
```

---

## 4. Story S5.2: 模板点击填充

### 4.1 验收标准

```typescript
fireEvent.click(screen.getByText('🛒 电商系统'));
await waitFor(() => {
  expect(screen.getByTestId('requirement-input').value).toContain('电商平台');
  expect(screen.getByTestId('template-selector')).not.toBeInTheDocument();
});
```

---

## 5. Story S5.3: 自定义需求入口

### 5.1 实现

自定义模板点击后，`content = ''`，用户从空白开始输入。

```typescript
const handleSelect = (template: RequirementTemplate) => {
  if (template.id === 'custom') {
    setSelectedTemplate({ ...template, content: '' });
  } else {
    setSelectedTemplate(template);
  }
};
```

### 5.2 验收标准

```typescript
fireEvent.click(screen.getByText('✨ 自定义需求'));
await waitFor(() => {
  const input = screen.getByTestId('requirement-input');
  expect(input.value).toBe('');
  expect(screen.getByText('清除模板')).toBeInTheDocument(); // 清除按钮出现
});
```

---

## 6. Story S5.4: 模板 JSON 可扩展

### 6.1 实现

模板通过 `import` 引入 JSON 文件，新增模板仅需修改 JSON：

```typescript
// src/data/templates/requirement-templates.json
// 添加新模板: { id: 'fintech', name: '金融系统', ... }
// 无需改代码
```

类型检查通过 JSON Schema 或 Runtime Validation（zod）确保字段完整。

### 6.2 验收标准

```typescript
// 在 requirement-templates.json 中添加一个测试模板
const templates = require('../../data/templates/requirement-templates.json');
expect(templates.length).toBeGreaterThan(5);
expect(templates.every(t => t.id && t.name && t.content !== undefined)).toBe(true);
```

---

## 7. Story S5.5: E2E 测试

**文件:** `e2e/canvas/requirement-template.spec.ts`

```typescript
test('template selector: renders cards and fills input', async ({ page }) => {
  await page.goto('/canvas');
  const cards = await page.getByTestId('template-card').all();
  expect(cards.length).toBeGreaterThanOrEqual(3);
  // 点击电商模板
  await page.click('[data-testid="template-card"]:has-text("电商系统")');
  await expect(page.getByTestId('requirement-input')).toHaveValue(/电商/);
});

test('template selector: clear template returns to selector', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="template-card"]:has-text("电商系统")');
  await page.click(screen.getByText('清除模板'));
  await expect(page.getByTestId('template-selector')).toBeVisible();
});
```

---

## 8. CSS 规格

**文件:** `src/styles/template-selector.css`

```css
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.template-icon { font-size: 24px; }
.template-name { font-weight: 600; font-size: 14px; }
.template-desc { font-size: 12px; color: #6b7280; }
```
