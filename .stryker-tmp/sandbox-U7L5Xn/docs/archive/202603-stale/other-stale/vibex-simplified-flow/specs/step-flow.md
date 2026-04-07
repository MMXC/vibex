# Spec: 3步流程路由

## 路由结构

```
/create/step1  → BusinessDomainStep (业务领域定义)
/create/step2  → ClarificationStep (需求澄清)
/create/step3  → UIGenerationStep  (UI 生成)
```

## 路由守卫

```typescript
// Feature Flag 控制
const isSimplifiedFlow = process.env.NEXT_PUBLIC_SIMPLIFIED_FLOW === 'true';

// 旧路由重定向
if (!isSimplifiedFlow && pathname === '/design/bounded-context') {
  redirect('/design/bounded-context'); // 保持原样
}
if (isSimplifiedFlow && pathname === '/design/bounded-context') {
  redirect('/create/step1');
}
```

## 步骤进度条

```typescript
const STEPS_SIMPLIFIED = [
  { id: 'step1', label: '业务领域定义' },
  { id: 'step2', label: '需求澄清' },
  { id: 'step3', label: 'UI 生成' },
];

const STEPS_ORIGINAL = [
  { id: 'bounded-context', label: '限界上下文' },
  { id: 'clarification', label: '澄清' },
  { id: 'business-flow', label: '业务流程' },
  { id: 'ui-generation', label: 'UI 生成' },
  { id: 'domain-model', label: '领域模型' },
];
```

## 验收标准

```typescript
// __tests__/routes.test.ts
describe('简化流程路由', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SIMPLIFIED_FLOW = 'true';
  });

  it('Step1 路由正确渲染', () => {
    render(<Step1 />);
    expect(screen.getByText('业务领域定义')).toBeVisible();
  });

  it('Step2 可从 Step1 导航到达', () => {
    render(<Step1 />);
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    expect(window.location.pathname).toBe('/create/step2');
  });

  it('Step3 可从 Step2 导航到达', () => {
    render(<Step2 />);
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    expect(window.location.pathname).toBe('/create/step3');
  });
});
```
