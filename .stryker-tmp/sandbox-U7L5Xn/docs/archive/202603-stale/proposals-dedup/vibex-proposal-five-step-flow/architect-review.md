# 架构评审: 五步流程架构

**项目**: vibex-proposal-five-step-flow
**评审人**: Architect Agent
**评审日期**: 2026-03-19
**评审状态**: APPROVED

---

## 1. 评审结论

| 项目 | 结论 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 通过 | 利用现有 XState 状态机 |
| 架构合理性 | ✅ 通过 | 流程扩展符合现有设计 |
| 兼容性 | ✅ 通过 | 向后兼容现有三步流程 |
| 实施复杂度 | 🟢 低 | 纯前端改动 |

---

## 2. 目标 vs 现状

### 2.1 流程对比

```
当前流程 (3步):
[1. 业务流程分析] → [2. UI组件分析] → [3. 创建项目]

目标流程 (5步):
[1. 需求录入] → [2. 限界上下文] → [3. 业务流程] → [4. UI组件] → [5. 创建项目]
```

### 2.2 差距分析

| 步骤 | 组件 | 状态 | 需要改动 |
|------|------|------|----------|
| Step 1 | 需求录入 | ❌ 缺失 | 新增组件 |
| Step 2 | 限界上下文 | ⚠️ 部分 | 独立组件 |
| Step 3 | 业务流程 | ✅ 正常 | - |
| Step 4 | UI组件 | ✅ 正常 | - |
| Step 5 | 创建项目 | ✅ 正常 | - |

---

## 3. 技术方案

### 3.1 组件架构

```typescript
// components/home/
src/
├── home/
│   ├── HomePage.tsx              // 主页面，定义 STEPS
│   ├── steps/
│   │   ├── Step0Welcome.tsx      // 欢迎页 (可选)
│   │   ├── Step1Requirement.tsx  // [NEW] 需求录入
│   │   ├── Step2Context.tsx      // [NEW] 限界上下文
│   │   ├── Step3Flow.tsx         // 业务流程
│   │   ├── Step4UI.tsx           // UI组件分析
│   │   └── Step5Create.tsx       // 创建项目
│   └── hooks/
│       ├── useHomePage.ts        // 主状态管理
│       └── useStepNavigation.ts  // 步骤导航
```

### 3.2 状态管理

```typescript
// types/steps.ts
export interface Step {
  id: number;
  label: string;
  component: React.ComponentType;
  validation?: () => boolean;
  dataKey: string;  // 存储该步骤数据的 key
}

export const STEPS: Step[] = [
  { id: 1, label: '需求录入', component: Step1Requirement, dataKey: 'requirement' },
  { id: 2, label: '限界上下文', component: Step2Context, dataKey: 'boundedContext' },
  { id: 3, label: '业务流程', component: Step3Flow, dataKey: 'flowchart' },
  { id: 4, label: 'UI组件', component: Step4UI, dataKey: 'uiComponents' },
  { id: 5, label: '创建项目', component: Step5Create, dataKey: 'project' },
];

// useHomePage.ts
interface HomePageState {
  currentStep: number;
  stepData: Record<string, unknown>;
  validation: Record<string, boolean>;
}

export const useHomePage = () => {
  const [state, setState] = useState<HomePageState>({
    currentStep: 1,
    stepData: {},
    validation: { step1: false },
  });

  // 步骤验证
  const validateStep = (stepId: number): boolean => {
    const step = STEPS.find(s => s.id === stepId);
    return step?.validation?.() ?? true;
  };

  // 前进条件检查
  const canProceed = (targetStep: number): boolean => {
    for (let i = state.currentStep; i < targetStep; i++) {
      if (!validateStep(i)) return false;
    }
    return true;
  };

  return { state, validateStep, canProceed, ... };
};
```

### 3.3 新增步骤组件设计

```typescript
// Step1Requirement.tsx
export const Step1Requirement: React.FC = () => {
  const { state, updateStepData } = useHomePage();
  
  return (
    <div className="step-requirement">
      <textarea
        value={state.stepData.requirement?.text ?? ''}
        onChange={(e) => updateStepData('requirement', { text: e.target.value })}
        placeholder="请输入需求描述..."
      />
      <div className="template-selector">
        {/* 需求模板选择 */}
      </div>
    </div>
  );
};

// Step2Context.tsx
export const Step2Context: React.FC = () => {
  const { state, updateStepData } = useHomePage();
  const { requirement } = state.stepData;
  
  // 基于 Step 1 的需求，自动生成限界上下文建议
  const suggestedContexts = useMemo(() => {
    return extractBoundedContexts(requirement);
  }, [requirement]);

  return (
    <div className="step-context">
      <BoundedContextSelector
        suggestions={suggestedContexts}
        selected={state.stepData.boundedContext?.contexts ?? []}
        onChange={(contexts) => updateStepData('boundedContext', { contexts })}
      />
    </div>
  );
};
```

---

## 4. 数据流设计

### 4.1 步骤间数据传递

```typescript
// 数据流
Step 1 (需求录入)
    ↓ 提取关键词、实体
Step 2 (限界上下文)
    ↓ 基于领域分析
Step 3 (业务流程)
    ↓ 选择流程节点
Step 4 (UI组件)
    ↓ 关联组件
Step 5 (创建项目)
    ↓ 汇总所有数据 → API 调用
```

### 4.2 数据持久化策略

```typescript
// 防止数据丢失 - 本地优先
export const useAutoSave = () => {
  const [state, setState] = useHomePage();
  
  // 防抖保存到 localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('homepage_draft', JSON.stringify(state.stepData));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [state.stepData]);
  
  // 页面加载时恢复
  useEffect(() => {
    const saved = localStorage.getItem('homepage_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 合并到当前状态
      } catch (e) {
        console.error('Failed to restore draft');
      }
    }
  }, []);
};
```

---

## 5. 测试策略

### 5.1 测试用例

```typescript
// __tests__/steps.test.tsx
describe('HomePage Steps', () => {
  it('should render all 5 steps', () => {
    render(<HomePage />);
    const steps = screen.getAllByRole('button', { name: /step/i });
    expect(steps).toHaveLength(5);
  });

  it('should navigate to step 2 after validating step 1', async () => {
    render(<HomePage />);
    
    // Fill in requirement
    fireEvent.change(screen.getByPlaceholderText('请输入需求描述'), {
      target: { value: 'Test requirement' }
    });
    
    // Click next
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    
    // Should navigate to step 2
    expect(screen.getByText('限界上下文')).toBeInTheDocument();
  });

  it('should not allow navigation without validation', () => {
    render(<HomePage />);
    
    // Try to skip to step 3
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    
    // Should still be on step 1
    expect(screen.getByText('需求录入')).toBeInTheDocument();
  });
});
```

### 5.2 覆盖率目标

| 测试类型 | 目标覆盖率 |
|----------|------------|
| 组件测试 | 90% |
| Hooks 测试 | 85% |
| 集成测试 | 80% |

---

## 6. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 回归现有流程 | 🟡 中 | 添加 feature flag 控制新旧流程切换 |
| 状态管理复杂度 | 🟡 中 | 使用 XState 统一管理 |
| 数据迁移 | 🟢 低 | localStorage 向前兼容 |
| 性能影响 | 🟢 低 | 懒加载新增步骤组件 |

---

## 7. 实施计划

```
Day 1:
├── 定义 STEPS 常量
├── 创建 Step1Requirement 组件
└── 更新 useHomePage hook

Day 2:
├── 创建 Step2Context 组件
├── 实现数据流传递
└── 添加验证逻辑

Day 3:
├── 集成测试
├── E2E 测试
└── 性能测试

Day 4:
├── Bug 修复
├── 文档更新
└── 部署上线
```

---

## 8. 总结

**评审结论**: APPROVED

**技术亮点**:
1. 利用现有 XState 状态机，无需引入新库
2. 组件化设计，便于维护
3. 数据流清晰，步骤间解耦

**关键成功因素**:
1. 步骤验证逻辑完善
2. 数据自动保存防止丢失
3. 向后兼容现有用户

---

*Architect Review - 2026-03-19*
