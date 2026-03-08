# PRD: 流程执行引擎 (Flow Execution Engine)

**项目**: VibeX Flow Execution Engine
**版本**: 1.0
**日期**: 2026-03-04
**作者**: Analyst Agent

---

## 1. 概述

### 1.1 项目背景

VibeX 是一个 AI 驱动的原型构建平台，用户可以通过可视化流程图设计应用逻辑。当前流程图仅作为可视化展示，无法真正执行。本项目旨在实现流程执行引擎，让可视化流程图能够真正运行。

### 1.2 项目目标

- 让用户绘制的流程图可以实际执行
- 支持多种执行模式（模拟、代码生成、验证等）
- 提供完整的执行状态追踪和错误处理

---

## 2. 现有基础分析

### 2.1 已有代码结构

**文件**: `vibex-backend/src/lib/prompts/flow-execution.ts` (1121 行)

**已实现部分**:
- ✅ 执行模式枚举 (`ExecutionMode`)
- ✅ 执行状态枚举 (`ExecutionStatus`, `NodeExecutionState`)
- ✅ 类型定义 (`ExecutableFlow`, `ExecutionNode`, `ExecutionEdge`, `ExecutionResult`)
- ✅ 系统提示词模板 (`FLOW_EXECUTION_SYSTEM_PROMPT`)
- ✅ 提示词生成函数 (`generateFlowExecutionPrompt`, `generateCodeConversionPrompt`)

**待实现部分 (TODO)**:
```typescript
// 行 792: TypeScript 模板
// TODO: Implement flow execution based on node definitions

// 行 813: JavaScript 模板
// TODO: Implement flow execution

// 行 847: Python 模板
# TODO: Implement flow execution

// 行 869: Java 模板
// TODO: Implement flow execution
```

### 2.2 核心类型定义

```typescript
// 执行节点
interface ExecutionNode {
  id: string;
  type: string;  // start, end, action, decision, parallel, api_call, etc.
  label: string;
  description?: string;
  inputVariables?: string[];
  outputVariables?: string[];
  config?: Record<string, unknown>;
}

// 可执行流程
interface ExecutableFlow {
  id: string;
  name: string;
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  variables?: Record<string, {...}>;
  startNode?: string;
  endNodes?: string[];
}

// 执行结果
interface ExecutionResult {
  success: boolean;
  executedNodes: string[];
  skippedNodes: string[];
  failedNodes: string[];
  variables: Record<string, unknown>;
  errors: Array<{ nodeId: string; error: string; recoverable: boolean }>;
  steps: ExecutionStep[];
}
```

---

## 3. 功能需求

### 3.1 核心功能

#### 3.1.1 流程执行器 (Flow Executor)

**需求**: 实现能够真正执行流程图的引擎

**输入**:
- `ExecutableFlow` - 流程定义
- `FlowExecutionConfig` - 执行配置
- `FlowExecutionContext` - 执行上下文（变量、服务等）

**输出**:
- `ExecutionResult` - 执行结果

**执行逻辑**:
1. 从 `startNode` 开始
2. 根据 `edges` 确定下一个节点
3. 执行节点操作（API调用、决策判断、数据处理等）
4. 更新变量状态
5. 处理错误和重试
6. 到达 `endNode` 时结束

#### 3.1.2 节点类型处理器

| 节点类型 | 处理逻辑 |
|---------|---------|
| `start` | 初始化执行上下文，设置初始变量 |
| `end` | 终止执行，返回结果 |
| `action` | 执行指定操作（调用服务、数据处理） |
| `decision` | 评估条件，选择分支 |
| `parallel` | 并行执行多个分支 |
| `api_call` | 发起 HTTP 请求 |
| `wait` | 暂停指定时间 |
| `user_interaction` | 等待用户输入 |
| `subflow` | 调用子流程 |
| `error` | 错误处理和恢复 |

#### 3.1.3 执行模式

| 模式 | 说明 | 输出 |
|------|------|------|
| `simulation` | 模拟执行，不实际运行 | 执行路径分析、变量追踪 |
| `planning` | 生成执行计划 | 步骤列表、依赖关系 |
| `code_generation` | 生成可执行代码 | TypeScript/JS/Python/Java 代码 |
| `validation` | 验证流程可执行性 | 验证报告、错误列表 |
| `step_by_step` | 步骤执行指南 | 详细步骤说明 |
| `test_case` | 生成测试用例 | Jest 测试代码 |

### 3.2 API 设计

#### 3.2.1 执行流程 API

```http
POST /api/flows/{flowId}/execute
Content-Type: application/json

{
  "mode": "simulation",
  "input": {
    "username": "test",
    "email": "test@example.com"
  },
  "config": {
    "trackVariables": true,
    "simulateErrors": true
  }
}

Response:
{
  "success": true,
  "executionId": "exec-xxx",
  "result": {
    "executedNodes": ["start-1", "validate", "create", "end-1"],
    "variables": { "userId": "uuid-xxx" },
    "steps": [...]
  }
}
```

#### 3.2.2 代码生成 API

```http
POST /api/flows/{flowId}/generate-code
Content-Type: application/json

{
  "language": "typescript",
  "framework": "express"
}

Response:
{
  "code": "async function executeFlow(input) { ... }",
  "dependencies": ["axios", "zod"]
}
```

---

## 4. 技术方案

### 4.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     Flow Execution Engine                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Flow Parser │  │  Scheduler  │  │  Execution Context  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Node Handlers                       │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │    │
│  │  │ Action │ │Decision│ │API Call│ │ Parallel│ ...   │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Variables │  │Error Handler│  │   State Manager     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 核心类设计

```typescript
// 执行引擎
class FlowExecutionEngine {
  async execute(flow: ExecutableFlow, config: FlowExecutionConfig): Promise<ExecutionResult>;
  async simulate(flow: ExecutableFlow): Promise<SimulationResult>;
  async validate(flow: ExecutableFlow): Promise<ValidationResult>;
  async generateCode(flow: ExecutableFlow, language: string): Promise<string>;
}

// 节点处理器注册表
class NodeHandlerRegistry {
  register(type: string, handler: NodeHandler): void;
  getHandler(type: string): NodeHandler;
}

// 变量管理器
class VariableManager {
  set(name: string, value: unknown): void;
  get(name: string): unknown;
  trackHistory: boolean;
}

// 执行状态机
class ExecutionStateMachine {
  currentState: ExecutionStatus;
  transition(event: ExecutionEvent): void;
}
```

### 4.3 文件结构

```
vibex-backend/src/lib/flow-execution/
├── index.ts                    # 入口
├── engine.ts                   # 执行引擎
├── types.ts                    # 类型定义
├── handlers/
│   ├── index.ts               # 处理器注册表
│   ├── action.handler.ts      # Action 节点
│   ├── decision.handler.ts    # Decision 节点
│   ├── api-call.handler.ts    # API Call 节点
│   ├── parallel.handler.ts    # Parallel 节点
│   └── ...
├── scheduler.ts               # 执行调度器
├── variables.ts               # 变量管理
├── error-handler.ts           # 错误处理
└── code-generator.ts          # 代码生成器
```

---

## 5. 实现计划

### Phase 1: 核心执行引擎 (P0)

| 任务 | 说明 | 预估 |
|------|------|------|
| 1.1 | 实现 FlowExecutionEngine 类 | 4h |
| 1.2 | 实现基础节点处理器 (start, end, action) | 3h |
| 1.3 | 实现变量管理器 | 2h |
| 1.4 | 实现 API 端点 POST /api/flows/{id}/execute | 2h |
| 1.5 | 单元测试 | 2h |

### Phase 2: 高级节点处理 (P1)

| 任务 | 说明 | 预估 |
|------|------|------|
| 2.1 | 实现 decision 节点处理器 | 2h |
| 2.2 | 实现 api_call 节点处理器 | 3h |
| 2.3 | 实现 parallel 节点处理器 | 3h |
| 2.4 | 实现 wait 和 user_interaction 处理器 | 2h |

### Phase 3: 代码生成 (P1)

| 任务 | 说明 | 预估 |
|------|------|------|
| 3.1 | 实现 TypeScript 代码生成器 | 3h |
| 3.2 | 实现 JavaScript 代码生成器 | 1h |
| 3.3 | 实现 Python 代码生成器 | 2h |
| 3.4 | 实现 API 端点 POST /api/flows/{id}/generate-code | 2h |

### Phase 4: 错误处理与监控 (P2)

| 任务 | 说明 | 预估 |
|------|------|------|
| 4.1 | 实现错误处理机制 | 2h |
| 4.2 | 实现执行日志记录 | 2h |
| 4.3 | 实现执行状态监控 | 2h |

---

## 6. 验收标准

### 功能验收

- [ ] 执行简单顺序流程成功
- [ ] 执行带决策分支的流程成功
- [ ] 执行带并行节点的流程成功
- [ ] API 调用节点能正确发起请求
- [ ] 变量追踪功能正常
- [ ] 错误处理和重试机制正常
- [ ] 代码生成功能输出可执行代码

### 性能验收

- [ ] 简单流程执行时间 < 100ms
- [ ] 支持 100+ 节点的复杂流程
- [ ] 并行节点能真正并行执行

---

## 7. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 复杂流程循环依赖 | 执行死循环 | 设置最大执行步数限制 |
| API 调用失败 | 流程中断 | 实现重试机制和超时处理 |
| 并行执行竞态条件 | 数据不一致 | 实现变量锁机制 |
| 用户交互阻塞 | 执行超时 | 实现异步回调机制 |

---

## 8. 参考资料

- 现有代码: `vibex-backend/src/lib/prompts/flow-execution.ts`
- React Flow 文档: https://reactflow.dev/
- 工作流引擎参考: Temporal, Apache Airflow

---

*文档版本: 1.0*
*创建时间: 2026-03-04 01:10*
*作者: Analyst Agent*