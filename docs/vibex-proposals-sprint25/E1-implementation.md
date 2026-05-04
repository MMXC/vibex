# E1: Onboarding + 模板捆绑交付 — 实现方案

## 背景

Epic1 (E1) 包含 4 个 Feature，涉及 Onboarding 流程改造：
- F1.1: Step 5 模板推荐
- F1.2: 模板 auto-fill（ChapterPanel 已有 E4-S2 实现基础）
- F1.3: 场景化模板推荐
- F1.4: 状态持久化

## 现有代码分析

### 已就绪的部分
- `onboardingStore.ts`: 有 persist middleware，但 `complete()` 只写 Zustand 状态
- `ChapterPanel.tsx`: 已有 `templateRequirement` prop 和 `parseRequirementContent()` + useEffect auto-fill
- `industry-templates.json`: 已有 4 个模板（saas-crm/mobile-app/ecommerce-platform/blank）
- `useTemplates.ts`: 有 `selectTemplate()` 方法

### 需要补全的部分
1. `PreviewStep.tsx`: 改为 TemplateStep，显示模板卡片列表
2. `ClarifyStep.tsx`: 增加场景选择 UI
3. `onboardingStore.ts`: 增加 `scenario` 字段 + `complete()` 写 localStorage
4. `OnboardingModal.tsx`: 传递 `onSelectTemplate` 回调
5. `ChapterPanel.tsx`: 通过 CanvasPage 的 onSelectTemplate 传入 `templateRequirement`
6. 单元测试补全

## 方案设计

### 方案 A（推荐）：增量改造，不新增 step 文件
- 复用 PreviewStep.tsx 改为显示模板卡片
- 在 ClarifyStep.tsx 增加场景选择 UI
- 通过 store 传递模板 ID 和 scenario

**优点**: 改动范围小，不破坏 step 顺序
**缺点**: PreviewStep 改动较大

### 方案 B：新建 TemplateStep.tsx
- 新建 step 文件作为 Step 5
- 5-step 改为 6-step

**优点**: 步骤职责清晰
**缺点**: 需要修改 step 顺序映射，改动更大

## 实施步骤

### Step 1: F1.3 — 场景化推荐（最底层依赖）
修改 ClarifyStep.tsx + onboardingStore.ts

### Step 2: F1.1 — Step 5 模板推荐
修改 PreviewStep.tsx 显示模板卡片

### Step 3: F1.4 — localStorage 持久化
修改 onboardingStore.ts complete()

### Step 4: F1.2 — auto-fill 连接
修改 DDSCanvasPage.tsx 传递 templateRequirement

### Step 5: 单元测试补全

## 验收标准

- [ ] `data-testid="onboarding-step-4"` 改为显示模板卡片列表
- [ ] `data-testid="onboarding-template-card"` 存在
- [ ] scenario 选择后，模板卡片按场景过滤
- [ ] 选择模板后，ChapterPanel requirement 章节自动填充
- [ ] `localStorage.setItem('onboarding_completed', 'true')` 写入
- [ ] `pnpm run build` → 0 errors
