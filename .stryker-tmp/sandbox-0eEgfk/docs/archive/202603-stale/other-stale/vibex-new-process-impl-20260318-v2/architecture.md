# Architecture: VibeX 新流程实现 (Phase 2 - 增量扩展)

**项目**: vibex-new-process-impl-20260318-v2  
**版本**: 2.0  
**架构师**: Architect  
**日期**: 2026-03-18

---

## 1. Tech Stack

| 类别 | 技术选型 | 版本 | 选择理由 |
|------|----------|------|----------|
| 前端框架 | Next.js | 14.x | 现有架构兼容 |
| UI 库 | React | 18.x | 现有生态兼容 |
| 状态管理 | Zustand | 3.x | 轻量级，适合复杂状态 |
| 状态机 | XState | 5.x | 严格的状态转换规则 |
| 不可变更新 | Immer | 10.x | 简化不可变状态操作 |
| 持久化 | localStorage + API | - | 现有方案复用 |
| 测试 | Jest + RTL | - | 现有基础设施 |

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["前端 (Next.js)"]
        FC[FlowContainer<br/>流程容器]
        SI[StepIndicator<br/>步骤指示器]
        
        subgraph NewSteps["新增步骤"]
            RS[RequirementStep<br/>需求录入]
            BS[BoundedContextStep<br/>限界上下文]
        end
        
        subgraph ExistingSteps["现有步骤 (复用)"]
            BF[BusinessFlowStep<br/>业务流程]
            UC[UIComponentStep<br/>UI组件]
            PC[ProjectCreationStep<br/>项目创建]
        end
        
        subgraph State["状态管理"]
            SM[状态机<br/>XState]
            STORE[Zustand Store]
            PERSIST[持久化层]
        end
    end
    
    subgraph API["后端 API"]
        ANALYZE[/api/analyze]
        BOUNDED[/api/flow/bounded-context]
        BUSINESS[/api/flow/business-flow]
        UI[/api/flow/ui-component]
        PROJECT[/api/flow/project]
    end
    
    FC --> SI
    SI --> NewSteps
    SI --> ExistingSteps
    NewSteps --> SM
    ExistingSteps --> SM
    SM --> STORE
    STORE --> PERSIST
    
    RS --> ANALYZE
    BS --> BOUNDED
    BF --> BUSINESS
    UC --> UI
    PC --> PROJECT
    
    ANALYZE -.->|HTTP| API
    BOUNDED -.->|HTTP| API
    BUSINESS -.->|HTTP| API
    UI -.->|HTTP| API
    PROJECT -.->|HTTP| API
    
    style NewSteps fill:#e1f5fe,stroke:#01579b
    style ExistingSteps fill:#e8f5e8,stroke:#2e7d32
```

### 模块划分

| 模块 | 职责 | 位置 | 状态 |
|------|------|------|------|
| FlowContainer | 5步流程外层容器 | `src/app/flow/components/` | 需扩展 |
| StepIndicator | 5步进度指示器 | `src/app/flow/components/` | 需修改 |
| RequirementStep | 需求录入步骤（新增） | `src/app/flow/components/steps/` | 新建 |
| BoundedContextStep | 限界上下文步骤（新增） | `src/app/flow/components/steps/` | 新建 |
| BusinessFlowStep | 业务流程步骤 | `src/app/flow/components/steps/` | 复用 |
| UIComponentStep | UI组件步骤 | `src/app/flow/components/steps/` | 复用 |
| ProjectCreationStep | 项目创建步骤 | `src/app/flow/components/steps/` | 复用 |
| flowMachine | XState 状态机 | `src/app/flow/machines/` | 需升级 |
| flowStore | Zustand Store | `src/app/flow/stores/` | 需扩展 |
| flowApi | API 调用封装 | `src/app/flow/services/` | 需扩展 |

---

## 3. API Definitions

### 3.1 复用 API

| API | 方法 | 用途 |
|-----|------|------|
| `/api/analyze` | POST | 需求分析（步骤1） |

### 3.2 新增 API

| API | 方法 | 用途 |
|-----|------|------|
| `/api/flow/bounded-context` | POST | 限界上下文识别（步骤2） |
| `/api/flow/business-flow` | POST | 业务流程生成（步骤3） |
| `/api/flow/ui-component` | POST | UI组件方案生成（步骤4） |
| `/api/flow/project` | POST | 项目创建（步骤5） |

### 接口签名

```typescript
// POST /api/flow/bounded-context
interface BoundedContextRequest {
  requirement: string;
}

interface BoundedContextResponse {
  contexts: Array<{
    id: string;
    name: string;
    description: string;
    dependencies: string[];
  }>;
}

// POST /api/flow/business-flow
interface BusinessFlowRequest {
  requirement: string;
  contexts: string[];
}

interface BusinessFlowResponse {
  flow: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
}

// POST /api/flow/ui-component
interface UIComponentRequest {
  requirement: string;
  contexts: string[];
  businessFlow: BusinessFlowResponse['flow'];
}

// POST /api/flow/project
interface ProjectCreationRequest {
  requirement: string;
  contexts: string[];
  businessFlow: BusinessFlowResponse['flow'];
  components: UIComponentResponse['components'];
}
```

---

## 4. Data Model

### 4.1 流程状态（扩展）

```typescript
type StepType = 'requirement' | 'bounded-context' | 'business-flow' | 'ui-component' | 'project';

interface FlowState {
  currentStep: StepType;
  steps: {
    [key in StepType]: StepData;
  };
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

interface StepData {
  status: StepStatus;
  data: StepOutput | null;
  lastModified: string;
  isValid: boolean;
}

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'modified';
```

### 4.2 状态机状态（升级）

```typescript
type FlowMachineContext = {
  currentStep: StepType;
  stepData: Record<StepType, StepOutput>;
  errors: Record<StepType, string>;
  history: StepSnapshot[];
};

type FlowMachineEvents =
  | { type: 'NEXT'; output: StepOutput }
  | { type: 'BACK' }
  | { type: 'GOTO'; step: StepType }
  | { type: 'REGENERATE'; step: StepType }
  | { type: 'UPDATE'; step: StepType; data: StepOutput }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

---

## 5. Testing Strategy

### 5.1 测试框架

- **单元测试**: Jest
- **集成测试**: React Testing Library + Jest
- **E2E 测试**: Playwright（现有基础设施）

### 5.2 覆盖率要求

| 类型 | 覆盖率目标 |
|------|------------|
| 单元测试 | > 80% |
| 集成测试 | 核心路径覆盖 |
| E2E 测试 | 5步流程端到端 |

### 5.3 核心测试用例

#### 状态机测试

```typescript
describe('FlowMachine', () => {
  it('should transition from requirement to bounded-context', () => {
    const nextState = flowMachine.transition('requirement', { 
      type: 'NEXT', 
      output: mockRequirementOutput 
    });
    expect(nextState.value).toBe('bounded-context');
  });

  it('should allow going back to previous step', () => {
    const backState = flowMachine.transition('bounded-context', { 
      type: 'BACK' 
    });
    expect(backState.value).toBe('requirement');
  });

  it('should support undo/redo', () => {
    const undoState = flowMachine.transition('bounded-context', { type: 'UNDO' });
    expect(undoState.value).toBe('requirement');
  });
});
```

#### 组件测试

```typescript
describe('StepIndicator', () => {
  it('should render 5 steps', () => {
    render(<StepIndicator currentStep={0} totalSteps={5} />);
    expect(screen.getAllByRole('step')).toHaveLength(5);
  });

  it('should highlight current step', () => {
    render(<StepIndicator currentStep={2} totalSteps={5} />);
    expect(screen.getByRole('step', { name: /3/i })).toHaveClass('active');
  });
});
```

### 5.4 验收测试矩阵

| 步骤 | 组件 | 测试策略 | 优先级 |
|------|------|----------|--------|
| 1 | RequirementStep | 单元测试 + 集成 | P0 |
| 2 | BoundedContextStep | 单元测试 + 集成 | P0 |
| 3 | BusinessFlowStep | 集成测试（复用） | P0 |
| 4 | UIComponentStep | 集成测试（复用） | P0 |
| 5 | ProjectCreationStep | E2E（复用） | P0 |
| - | flowMachine | 单元测试 | P0 |

---

## 6. 增量实现要点

### 6.1 步骤常量扩展

```typescript
// 从 3 步扩展到 5 步
const STEPS: Step[] = [
  { id: 'requirement', label: '需求录入', description: '用户输入产品需求描述' },
  { id: 'bounded-context', label: '限界上下文', description: 'AI识别并展示限界上下文' },
  { id: 'business-flow', label: '业务流程', description: '基于上下文生成业务流程' },
  { id: 'ui-component', label: 'UI组件', description: '基于流程生成UI组件方案' },
  { id: 'project', label: '创建项目', description: '汇总信息创建项目' },
];
```

### 6.2 状态管理升级

```typescript
// 从简化版升级到完整版
const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      currentStep: 'requirement',
      steps: initialStepsState,
      // ... 方法
    }),
    { name: 'flow-storage' }
  )
);
```

### 6.3 回退/重做支持

```typescript
// 添加历史记录支持
interface StepSnapshot {
  step: StepType;
  data: StepOutput;
  timestamp: string;
}

// 在状态机中添加 UNDO/REDO 事件处理
```

---

## 7. 性能考虑

| 指标 | 目标 | 实现方式 |
|------|------|----------|
| 单步加载 | ≤ 2s | 代码分割，按需加载 |
| 页面切换 | ≤ 100ms | 客户端状态缓存 |
| 内存占用 | < 50MB | 及时清理旧步骤数据 |

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 状态管理复杂度 | 中 | 使用 XState 状态机 |
| 步骤间数据传递 | 高 | 依赖驱动 + 增量更新 |
| 现有功能回归 | 高 | 增量扩展，复用现有步骤 |

---

## 9. 实施计划

| 阶段 | 任务 | 工作量 |
|------|------|--------|
| Phase 2.1 | 新增步骤1-2 组件 | 2天 |
| Phase 2.2 | 升级状态管理 | 1天 |
| Phase 2.3 | 实现步骤1-2 API | 2天 |
| Phase 2.4 | 添加回退/重做 | 1天 |
| Phase 2.5 | 测试与修复 | 1天 |

---

*Architecture designed by Architect - 2026-03-18*
