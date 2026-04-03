# 分析报告：首页步骤组件模块化重构

**项目**: vibex-step-modular-architecture
**分析日期**: 2026-03-17
**分析师**: Analyst Agent
**状态**: 完成

---

## 一、执行摘要

**目标**：将 HomePage.tsx（530 行单体组件）拆分为按步骤独立组件，每个步骤包含图形区、思考区、录入区。

| 维度 | 当前状态 | 目标状态 |
|------|----------|----------|
| 组件结构 | 单体 530 行 | 5 个独立步骤组件 |
| 状态管理 | 集中在 HomePage | 各步骤独立 + 共享 Store |
| 测试难度 | 高（依赖完整流程） | 低（单步骤隔离测试） |

---

## 二、当前架构分析

### 2.1 现有组件结构

```
components/homepage/
├── HomePage.tsx (530 行) ← 主组件，包含所有逻辑
├── index.ts
├── types.ts
├── AIPanel/
├── InputArea/
├── PreviewArea/
│   ├── PreviewArea.tsx
│   └── PreviewCanvas.tsx
├── Sidebar/
├── ThinkingPanel/
├── Navbar/
└── hooks/
```

**问题**：
1. HomePage.tsx 包含所有 5 个步骤的逻辑
2. 使用 `currentStep` 状态切换显示，条件分支多
3. 测试需要完整流程，无法单独验证某一步骤

### 2.2 当前步骤控制逻辑

```tsx
// HomePage.tsx
{currentStep === 1 && (
  <button onClick={handleGenerate}>开始生成</button>
)}
{currentStep === 2 && boundedContexts.length > 0 && (
  <button onClick={handleGenerateDomainModel}>生成领域模型</button>
)}
{currentStep === 3 && domainModels.length > 0 && (
  <button onClick={handleGenerateBusinessFlow}>生成业务流程</button>
)}
```

---

## 三、目标架构

### 3.1 组件树设计

```
HomePage.tsx
├── StepContainer (容器组件)
│   ├── StepRequirementInput (Step 1)
│   │   ├── PreviewArea (图形区)
│   │   ├── ThinkingPanel (思考区)
│   │   └── InputArea (录入区)
│   ├── StepBoundedContext (Step 2)
│   │   ├── PreviewArea
│   │   ├── ThinkingPanel
│   │   └── InputArea
│   ├── StepDomainModel (Step 3)
│   ├── StepBusinessFlow (Step 4)
│   └── StepProjectCreate (Step 5)
├── Sidebar (步骤导航)
└── Navbar
```

### 3.2 步骤组件接口

```tsx
interface StepComponentProps {
  // 共享数据
  requirementText: string;
  onNavigate: (step: number) => void;
  
  // 步骤专属数据（从 Store 获取）
  // 内部管理
}

interface StepRequirementInputProps extends StepComponentProps {
  // Step 1 专属
}

interface StepBoundedContextProps extends StepComponentProps {
  // Step 2 专属
  boundedContexts: BoundedContext[];
  selectedContextIds: string[];
}
```

### 3.3 状态管理

**方案**：保持 Zustand Store，各步骤组件按需订阅

```tsx
// stores/confirmationStore.ts (已有)
export const useConfirmationStore = create<ConfirmationState>((set) => ({
  currentStep: 1,
  requirementText: '',
  boundedContexts: [],
  // ...
}));

// 各步骤组件内部订阅
function StepBoundedContext() {
  const boundedContexts = useConfirmationStore(s => s.boundedContexts);
  // ...
}
```

---

## 四、实施方案

### 4.1 文件结构

```
components/homepage/
├── steps/
│   ├── StepRequirementInput.tsx
│   ├── StepBoundedContext.tsx
│   ├── StepDomainModel.tsx
│   ├── StepBusinessFlow.tsx
│   └── StepProjectCreate.tsx
├── StepContainer.tsx (容器，按 currentStep 挂载)
├── HomePage.tsx (简化为容器)
└── index.ts
```

### 4.2 StepContainer 实现

```tsx
// StepContainer.tsx
import { lazy, Suspense } from 'react';
import { useConfirmationStore } from '@/stores/confirmationStore';

const StepComponents = {
  1: lazy(() => import('./steps/StepRequirementInput')),
  2: lazy(() => import('./steps/StepBoundedContext')),
  3: lazy(() => import('./steps/StepDomainModel')),
  4: lazy(() => import('./steps/StepBusinessFlow')),
  5: lazy(() => import('./steps/StepProjectCreate')),
};

export function StepContainer() {
  const currentStep = useConfirmationStore(s => s.currentStep);
  const StepComponent = StepComponents[currentStep];
  
  return (
    <Suspense fallback={<StepLoading />}>
      <StepComponent />
    </Suspense>
  );
}
```

### 4.3 单步骤组件示例

```tsx
// steps/StepRequirementInput.tsx
export function StepRequirementInput() {
  const requirementText = useConfirmationStore(s => s.requirementText);
  const { thinkingMessages, status, generateContexts, abort } = useDDDStream();
  
  return (
    <div className={styles.stepContainer}>
      <PreviewArea mermaidCode="" />
      <ThinkingPanel 
        thinkingMessages={thinkingMessages}
        status={status}
        onAbort={abort}
      />
      <InputArea 
        value={requirementText}
        onSubmit={generateContexts}
      />
    </div>
  );
}
```

---

## 五、工作量评估

| 任务 | 工时 | 风险 |
|------|------|------|
| 创建步骤组件结构 | 2h | 低 |
| 拆分 Step 1 (需求输入) | 3h | 中 |
| 拆分 Step 2 (限界上下文) | 3h | 中 |
| 拆分 Step 3-5 | 4h | 中 |
| StepContainer + 路由 | 2h | 低 |
| 测试用例 | 3h | 低 |
| 文档更新 | 1h | 低 |

**总计**: 18h (约 2.5 人日)

---

## 六、验收标准

| ID | 验收条件 | 验证方法 |
|----|----------|----------|
| AC1 | 5 个步骤组件独立存在 | `ls components/homepage/steps/` |
| AC2 | 单步骤可独立测试 | 单元测试通过 |
| AC3 | 步骤切换正常 | E2E 测试 |
| AC4 | HomePage.tsx 行数 < 100 | `wc -l` |
| AC5 | 无功能回归 | 回归测试 |

---

## 七、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 状态同步问题 | 中 | 高 | 使用 Zustand 共享 Store |
| 懒加载闪烁 | 低 | 中 | 添加 Loading 状态 |
| 样式冲突 | 低 | 低 | 使用 CSS Module |

---

## 八、相关文件

**需要修改的文件**：
1. `vibex-fronted/src/components/homepage/HomePage.tsx` - 简化为容器
2. 新建 `vibex-fronted/src/components/homepage/steps/` 目录
3. 新建 `vibex-fronted/src/components/homepage/StepContainer.tsx`

**参考文件**：
- `vibex-fronted/src/stores/confirmationStore.ts` - 状态管理
- `vibex-fronted/src/components/homepage/PreviewArea/` - 已有组件

---

## 九、测试策略

### 9.1 单元测试

```tsx
// steps/__tests__/StepRequirementInput.test.tsx
describe('StepRequirementInput', () => {
  it('应显示需求输入区域', () => {
    render(<StepRequirementInput />);
    expect(screen.getByLabelText('需求描述')).toBeInTheDocument();
  });
  
  it('点击生成按钮应触发 generateContexts', async () => {
    const { generateContexts } = useDDDStream();
    render(<StepRequirementInput />);
    await userEvent.click(screen.getByText('开始生成'));
    expect(generateContexts).toHaveBeenCalled();
  });
});
```

### 9.2 集成测试

```tsx
// __tests__/integration/step-navigation.test.tsx
describe('步骤导航', () => {
  it('Step 1 完成后应切换到 Step 2', async () => {
    render(<HomePage />);
    // 完成需求输入
    await completeStep1();
    expect(screen.getByText('Step 2: 限界上下文')).toBeInTheDocument();
  });
});
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-step-modular-architecture/analysis.md`
**分析师**: Analyst Agent
**日期**: 2026-03-17