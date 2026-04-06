# Spec: Epic E3 — 新手引导蒙层

## 1. 引导步骤

```typescript
const ONBOARDING_STEPS = [
  { target: '#requirement-input', text: '在这里输入你的业务需求', position: 'bottom' },
  { target: '#continue-context-btn', text: '点击生成限界上下文', position: 'bottom' },
  { target: '#context-tree', text: '勾选需要的上下文，继续生成', position: 'right' },
];

// 检测逻辑
const isOnboarded = localStorage.getItem('canvas_onboarded');
if (!isOnboarded) showOnboardingOverlay();

// 跳过
const handleSkip = () => {
  localStorage.setItem('canvas_onboarded', 'true');
  hideOverlay();
};
```

## 2. 验收标准

```bash
# E2E 测试
await page.goto('/canvas');
await page.evaluate(() => localStorage.removeItem('canvas_onboarded'));
await page.reload();
await expect(page.getByText(/Step 1/i)).toBeVisible();
await page.getByText('跳过引导').click();
await expect(page.getByText(/Step 1/i)).not.toBeVisible();
```
