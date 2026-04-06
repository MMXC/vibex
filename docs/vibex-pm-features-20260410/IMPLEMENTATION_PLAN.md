# IMPLEMENTATION_PLAN: VibeX PM Features 2026-04-10

> **项目**: vibex-pm-features-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 | E1 模板系统 | 3h |
| Sprint 2 | Day 2 | E2 引导流程 + 集成测试 | 3h |

**总工时**: 6h | **团队**: 1 Dev

---

## 2. Sprint 1: 模板系统（3h）

### Task S1.1: 模板数据结构（0.5h）

**Step 1: 创建类型定义**

```typescript
// types/template.ts
export interface Template {
  id: string;
  name: string;
  industry: Industry;
  description: string;
  icon: string;
  entities: Entity[];
  boundedContexts: BoundedContext[];
  sampleRequirement: string;
  tags: string[];
  createdAt: string;
}

export type Industry = 'ecommerce' | 'social' | 'saas';
```

**Step 2: 创建模板 JSON 文件**

```bash
mkdir -p data/templates
```

```json
// data/templates/ecommerce.json
{
  "id": "tmpl-ecommerce-001",
  "name": "电商平台",
  "industry": "ecommerce",
  "description": "适合电商平台、产品商城等场景",
  "icon": "🛒",
  "entities": [
    { "name": "Product", "type": "aggregate", "attributes": [
      { "name": "id", "type": "uuid" },
      { "name": "name", "type": "string" },
      { "name": "price", "type": "number" }
    ]},
    { "name": "Order", "type": "aggregate", "attributes": [
      { "name": "id", "type": "uuid" },
      { "name": "status", "type": "string" }
    ]}
  ],
  "boundedContexts": [
    { "name": "Catalog", "entities": ["Product"] },
    { "name": "Ordering", "entities": ["Order"] }
  ],
  "sampleRequirement": "用户可以浏览商品、将商品加入购物车、下单支付，商家可以管理商品和订单",
  "tags": ["电商", "商城", "交易"],
  "createdAt": "2026-04-10"
}
```

**验证命令**:
```bash
node -e "const t = require('./data/templates/ecommerce.json'); console.log('OK:', t.name)"
```

---

### Task S1.2: /templates 页面（1.5h）

**Step 1: 创建页面**

```typescript
// app/templates/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '@/types/template';
import { TemplateCard } from '@/components/TemplateCard';

const TEMPLATES = [
  require('@/data/templates/ecommerce.json'),
  require('@/data/templates/social.json'),
  require('@/data/templates/saas.json'),
] as Template[];

export default function TemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Template | null>(null);

  const handleSelect = (template: Template) => {
    setSelected(template);
  };

  const handleStartAnalysis = () => {
    if (selected) {
      // 存储到 sessionStorage，跳转到 dashboard
      sessionStorage.setItem('selected_template', JSON.stringify(selected));
      router.push('/dashboard');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">选择行业模板</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selected?.id === template.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
      {selected && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">示例需求</h2>
          <textarea
            className="w-full h-32 p-3 border rounded-lg"
            value={selected.sampleRequirement}
            readOnly
          />
          <button
            onClick={handleStartAnalysis}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            开始分析
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: 创建 TemplateCard 组件**

```typescript
// components/TemplateCard.tsx
import { Template } from '@/types/template';

export function TemplateCard({ template, onSelect, isSelected }: TemplateCardProps) {
  return (
    <div
      data-testid={`template-card-${template.industry}`}
      className={cn(
        'rounded-lg border-2 p-4 cursor-pointer transition-all',
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
      )}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{template.icon}</span>
        <div>
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-sm text-gray-500">{template.description}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {template.tags.map(tag => (
          <span key={tag} className="text-xs bg-gray-100 rounded px-1">{tag}</span>
        ))}
      </div>
    </div>
  );
}
```

**验证命令**:
```bash
curl -s http://localhost:3000/templates | grep -c "template-card"
# 应输出: 3
```

---

### Task S1.3: 模板填充逻辑（1h）

**Step 1: 创建 useTemplateFill Hook**

```typescript
// hooks/useTemplateFill.ts
export function useTemplateFill() {
  const [template, setTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('selected_template');
    if (stored) {
      setTemplate(JSON.parse(stored));
      // 清除 sessionStorage
      sessionStorage.removeItem('selected_template');
    }
  }, []);

  return { template };
}
```

**Step 2: 在 Dashboard 使用**

```typescript
// app/dashboard/page.tsx
const { template } = useTemplateFill();

useEffect(() => {
  if (template) {
    // 自动填充需求输入框
    setRequirementInput(template.sampleRequirement);
  }
}, [template]);
```

---

## 3. Sprint 2: 引导流程（3h）

### Task S2.1: 引导流程设计（0.5h）

**Step 1: 创建引导步骤配置**

```typescript
// data/onboarding-steps.ts
export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'step-1',
    target: '[data-testid="requirement-input"]',
    title: '输入需求描述',
    content: '在这里输入您的产品需求描述',
    placement: 'top',
  },
  {
    id: 'step-2',
    target: '[data-testid="analyze-button"]',
    title: '发起分析',
    content: '点击按钮开始 AI 分析',
    placement: 'bottom',
  },
  {
    id: 'step-3',
    target: '[data-testid="domain-model"]',
    title: '查看结果',
    content: '分析完成后查看领域模型',
    placement: 'left',
  },
  {
    id: 'step-4',
    target: '[data-testid="export-button"]',
    title: '导出结果',
    content: '导出代码或继续编辑',
    placement: 'right',
  },
];
```

---

### Task S2.2: Highlight + Tooltip 实现（1h）

**Step 1: 创建 OnboardingHighlight**

```typescript
// components/OnboardingHighlight.tsx
export function OnboardingHighlight({ target, children }: OnboardingHighlightProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const el = document.querySelector(target);
    if (el) {
      setHighlightRect(el.getBoundingClientRect());
    }
  }, [target]);

  if (!highlightRect) return <>{children}</>;

  return (
    <>
      <div
        className="fixed pointer-events-none z-40 rounded-lg"
        style={{
          top: highlightRect.top - 4,
          left: highlightRect.left - 4,
          width: highlightRect.width + 8,
          height: highlightRect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
        }}
      />
      <div className="relative z-50">{children}</div>
    </>
  );
}
```

**Step 2: 创建 OnboardingOverlay**

```typescript
// components/OnboardingOverlay.tsx
export function OnboardingOverlay() {
  const { isVisible, complete, skip } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <OnboardingHighlight target={step.target}>
        <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm" data-testid="onboarding-tooltip">
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{step.content}</p>
          <div className="flex justify-between mt-4">
            <button onClick={skip} data-testid="onboarding-skip" className="text-sm text-gray-500">
              跳过
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)}>上一步</button>
              )}
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <button onClick={() => setCurrentStep(s => s + 1)} className="px-3 py-1 bg-blue-600 text-white rounded">
                  下一步
                </button>
              ) : (
                <button onClick={complete} className="px-3 py-1 bg-blue-600 text-white rounded" data-testid="onboarding-complete">
                  完成
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn('w-2 h-2 rounded-full', i === currentStep ? 'bg-blue-600' : 'bg-gray-300')}
              />
            ))}
          </div>
        </div>
      </OnboardingHighlight>
    </div>
  );
}
```

---

### Task S2.3: 引导状态持久化（0.5h）

**Step 1: 创建 useOnboarding Hook**

```typescript
// hooks/useOnboarding.ts
const ONBOARDING_KEY = 'onboarding_v2_completed';
const SKIPPED_KEY = 'onboarding_v2_skipped';

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true';
    setIsCompleted(completed);
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
    setIsVisible(false);
  }, []);

  const skip = useCallback(() => {
    localStorage.setItem(SKIPPED_KEY, 'true');
    setIsVisible(false);
  }, []);

  return { isCompleted, isVisible, complete, skip };
}
```

**Step 2: 在 _app.tsx 或 layout.tsx 注册**

```typescript
// app/layout.tsx
import { OnboardingOverlay } from '@/components/OnboardingOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <OnboardingOverlay />
      </body>
    </html>
  );
}
```

---

## 4. Sprint 3: 集成测试（0.5h）

### Task S3.1: E2E 测试

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('引导流程完整测试', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/dashboard');
  await page.reload();

  // 验证引导弹出
  await expect(page.locator('[data-testid="onboarding-tooltip"]')).toBeVisible();

  // 验证 4 步
  await expect(page.locator('[data-testid="onboarding-step"]')).toHaveCount(4);

  // 完成引导
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("下一步")');
  }
  await page.click('[data-testid="onboarding-complete"]');

  // 验证 localStorage
  const completed = await page.evaluate(() => localStorage.getItem('onboarding_v2_completed'));
  expect(completed).toBe('true');

  // 刷新后引导不弹出
  await page.reload();
  await expect(page.locator('[data-testid="onboarding-tooltip"]')).not.toBeVisible();
});
```

---

## 5. 验收标准

| Task | 验收标准 | 命令 |
|------|---------|------|
| S1.1 | 模板 JSON Schema 校验通过 | `node -e "require('./data/templates/ecommerce.json')"` |
| S1.2 | /templates 显示 3 个模板 | `curl /templates \| grep template-card \| wc -l` |
| S1.3 | 选择后自动填充 | 手动测试 |
| S2.1 | 引导步骤 ≤ 4 | E2E 计数 |
| S2.2 | Highlight 高亮 | 截图验证 |
| S2.3 | localStorage 标记 | `localStorage.getItem('onboarding_v2_completed')` |

---

## 6. 回滚计划

| Task | 回滚步骤 | 时间 |
|------|---------|------|
| S1.x | 删除 data/templates/ + pages/templates.tsx | <5 min |
| S2.x | 删除 hooks/useOnboarding.ts + OnboardingOverlay | <5 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
