# SPEC: E3 — 新手引导流程

**Epic:** E3 — P1 体验改善：新手引导  
**Stories:** S3.1, S3.2, S3.3, S3.4, S3.5  
**Owner:** dev + pm（pm 确认引导步骤内容）  
**Estimated:** 4h

---

## 1. 概述

首次访问 Canvas 的用户看到空白的三树面板，不知道从哪开始。本 Epic 实现步骤式蒙层引导，帮助用户理解核心操作路径，并在 localStorage 中记录引导完成状态，防止重复展示。

---

## 2. 引导步骤设计

| Step | 标题 | 高亮目标 | 描述 |
|------|------|---------|------|
| 1 | 输入业务需求 | `#requirement-input` | 在左侧输入框中描述你的业务需求，AI 将引导你完善需求细节 |
| 2 | 开始生成上下文 | `#continue-context-btn` | 点击「继续·上下文树」，AI 开始分析你的需求并生成限界上下文 |
| 3 | 选择并继续 | `#context-tree` | 勾选需要的上下文，然后继续生成业务流程和组件 |

---

## 3. Story S3.1: 引导蒙层渲染

### 3.1 实现方案

**文件:** `src/components/OnboardingOverlay/index.tsx`（新建）

```typescript
interface OnboardingStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingOverlayProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingOverlay({ steps, onComplete, onSkip }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const current = steps[currentStep];

  // 计算目标元素位置
  const targetRef = useRef<Element | null>(null);
  useEffect(() => {
    targetRef.current = document.querySelector(current.target);
  }, [current.target]);

  const next = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div data-testid="onboarding-overlay" className="onboarding-overlay">
      {/* 遮罩层 */}
      <svg className="onboarding-mask" data-tutorial-step={currentStep}>
        {/* 使用 mask-path 高亮目标元素 */}
      </svg>

      {/* 引导卡片 */}
      <div
        className={`onboarding-card onboarding-${current.position ?? 'bottom'}`}
        data-tutorial-target={current.target}
      >
        <div className="onboarding-step-indicator">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`step-dot ${i === currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
        <h3>{current.title}</h3>
        <p>{current.description}</p>
        <div className="onboarding-actions">
          <button
            className="skip-btn"
            onClick={onSkip}
            data-testid="onboarding-skip"
          >
            跳过引导
          </button>
          <button className="next-btn primary" onClick={next} data-testid="onboarding-next">
            {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 入口逻辑

**文件:** `src/pages/CanvasPage.tsx`

```typescript
const ONBOARDING_KEY = 'canvas_onboarded';

const isOnboarded = useMemo(() => {
  if (typeof window === 'undefined') return true; // SSR
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}, []);

const onboardingSteps: OnboardingStep[] = [
  { target: '#requirement-input', title: '输入业务需求', description: '...', position: 'bottom' },
  { target: '#continue-context-btn', title: '开始生成上下文', description: '...', position: 'bottom' },
  { target: '#context-tree', title: '选择并继续', description: '...', position: 'right' },
];

// 渲染
{!isOnboarded && (
  <OnboardingOverlay
    steps={onboardingSteps}
    onComplete={() => localStorage.setItem(ONBOARDING_KEY, 'true')}
    onSkip={() => localStorage.setItem(ONBOARDING_KEY, 'true')}
  />
)}
```

### 3.3 验收标准

```typescript
expect(screen.getByTestId('onboarding-overlay')).toBeVisible();
expect(screen.getByText('输入业务需求')).toBeInTheDocument();
const dots = screen.getAllByClassName('step-dot');
expect(dots.length).toBe(3);
```

---

## 4. Story S3.2: 引导步骤流转

### 4.1 实现方案

点击"下一步"时：
1. 当前高亮元素失焦
2. 新目标元素高亮（CSS `box-shadow` 突出）
3. 引导卡片切换内容

### 4.2 验收标准

```typescript
fireEvent.click(screen.getByTestId('onboarding-next'));
expect(screen.getByText('开始生成上下文')).toBeInTheDocument();

fireEvent.click(screen.getByTestId('onboarding-next'));
expect(screen.getByText('选择并继续')).toBeInTheDocument();
```

---

## 5. Story S3.3: 跳过引导与持久化

### 5.1 验收标准

```typescript
fireEvent.click(screen.getByTestId('onboarding-skip'));
expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument();
expect(localStorage.getItem('canvas_onboarded')).toBe('true');
```

---

## 6. Story S3.4: 引导防重复

### 6.1 验收标准

```typescript
localStorage.setItem('canvas_onboarded', 'true');
render(<CanvasPage />);
expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument();
```

---

## 7. Story S3.5: E2E 测试

**文件:** `e2e/canvas/onboarding.spec.ts`

```typescript
test('onboarding: full flow from overlay to skip', async ({ page }) => {
  await page.goto('/canvas');
  // 验证引导出现
  await expect(page.getByTestId('onboarding-overlay')).toBeVisible();
  await expect(page.getByText('输入业务需求')).toBeVisible();
  // 跳过
  await page.click('[data-testid="onboarding-skip"]');
  await expect(page.getByTestId('onboarding-overlay')).not.toBeVisible();
  // 刷新不应再出现
  await page.reload();
  await expect(page.getByTestId('onboarding-overlay')).not.toBeVisible();
});

test('onboarding: complete all steps', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="onboarding-next"]'); // Step 2
  await expect(page.getByText('开始生成上下文')).toBeVisible();
  await page.click('[data-testid="onboarding-next"]'); // Step 3
  await expect(page.getByText('选择并继续')).toBeVisible();
  await page.click('[data-testid="onboarding-next"]'); // Complete
  await expect(page.getByTestId('onboarding-overlay')).not.toBeVisible();
  await expect(localStorage.getItem('canvas_onboarded')).toBe('true');
});
```

---

## 8. CSS 规格

**文件:** `src/styles/onboarding.css`

```css
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: all;
}

.onboarding-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.onboarding-card {
  position: absolute;
  max-width: 320px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}
.step-dot.active { background: #3b82f6; }

.skip-btn { color: #6b7280; }
.next-btn { background: #3b82f6; color: white; }
```

---

## 9. 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 引导步骤与 DOM 结构耦合，UI 变化后引导失效 | 使用 CSS class 定位而非 DOM 结构；引导步骤配置化 |
| 移动端引导体验差 | 引导在移动端（<768px）自动禁用 |
