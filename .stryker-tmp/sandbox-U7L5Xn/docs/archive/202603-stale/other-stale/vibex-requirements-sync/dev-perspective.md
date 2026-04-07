# Vibex 需求对齐分析 — Dev 视角

> **作者**: Dev Agent  
> **日期**: 2026-03-20  
> **目的**: 对比"总需求流程"与当前代码实现，识别缺口

---

## 1. 总需求流程（目标）

```
首页输入需求
  → 对话澄清
    → 生成核心上下文 + 业务流程（SSE 流式）
      → 询问通用支撑域
        → 用户勾选流程节点
          → 生成页面/组件节点
            → 用户再次勾选
              → 创建项目
                → Dashboard
                  → 原型预览 + AI助手
```

---

## 2. 实际实现逐项对比

### 2.1 首页输入需求 ✅

**实现**: `HomePage.tsx` + `InputArea.tsx`  
**状态**: 完整实现

```typescript
// HomePage.tsx:76
const handleRequirementSubmit = useCallback(() => {
  generateContexts(requirementText);
}, [requirementText, generateContexts]);
```

用户输入 → 点击提交 → SSE 流式生成限界上下文 ✅

---

### 2.2 对话澄清 ❌

**期望**: 交互式澄清对话，模板推荐  
**现状**: 
- `ClarificationPage` (`/design/clarification`) 有离线监听 + 关键词提取 + 模板推荐 UI
- **问题**: 首页提交需求后**不会进入澄清流程**，直接跳到 Step 1 限界上下文生成
- `clarificationRounds` 在 `designStore` 中定义了，但从未被调用

**缺口**: 首页缺少澄清对话入口或自动澄清逻辑

---

### 2.3 生成核心上下文 + 业务流程 ✅ (部分)

**实现**: `useBusinessFlowStream` hook + SSE 流式  
**状态**: 限界上下文生成完整，流程图生成部分

```typescript
// useDDDStream.ts:331 - useBusinessFlowStream
const mutation = useMutation({
  mutationFn: async ({ domainModels, requirementText }) => {
    return streamBusinessFlow(domainModels, requirementText, {
      onThinking: (data) => setThinkingMessages(prev => [...prev, data]),
      onDone: (data) => {
        setBusinessFlow(data.businessFlow);
        setMermaidCode(data.mermaidCode);
      },
    }, abortControllerRef.current.signal);
  },
});
```

**缺口**: 
- 后端 DDD 路由 (`routes/ddd.ts`) 已完整实现 ✅
- MermaidManager 重构已完成 ✅
- 但 `useHomePage` 的 `generateBusinessFlow` 没有正确保存到 `confirmationStore`（**今天刚修复** `67f5eb8d`）

---

### 2.4 询问通用支撑域 ❌

**期望**: AI 询问"这些流程是否依赖通用支撑域？"  
**现状**: 无此功能

- `designStore` 没有定义支撑域相关状态
- 无对应的 UI 交互

---

### 2.5 用户勾选流程节点 ✅ (部分)

**实现**: `NodeTreeSelector` 组件  
**状态**: 组件存在，但与生成流程**未集成**

```typescript
// PreviewArea.tsx - 渲染了 NodeTreeSelector
{showNodeTree && nodes.length > 0 && (
  <NodeTreeSelector
    nodes={nodes}
    selectedIds={selectedNodes}
    onSelectionChange={handleNodeSelectionChange}
    onToggle={() => setShowNodeTree(!showNodeTree)}
  />
)}
```

**缺口**: 
- `nodes` 来自 `boundedContexts`，不是流程节点
- 勾选后没有后续逻辑（不触发下一步生成）
- 流程节点选择应该是业务流中的节点，不是限界上下文

---

### 2.6 生成页面/组件节点 ❌

**期望**: 基于用户勾选的流程节点生成页面/组件  
**现状**: 无此功能

- `analyzePageStructure` 函数存在（`useHomePage.ts:280`），但内容是 mock 实现
- `/design/ui-generation` 是占位桩
- 无实际的页面结构生成 API

---

### 2.7 用户再次勾选 ❌

**期望**: 用户选择要生成的页面/组件  
**现状**: 无此功能（同 2.6）

---

### 2.8 创建项目 ❌⚠️

**期望**: 将分析结果保存为项目  
**状态**: 严重问题

```typescript
// HomePage.tsx:117 - 空实现！
onCreateProject={() => {}}
```

**修复方案**:
- `StepProjectCreate.tsx` 有完整的 `projectApi.createProject()` 逻辑
- 但 **HomePage 没有渲染 StepProjectCreate**
- `currentStep` 只支持 1/2/3，没有 Step 3 项目创建步骤
- 需要将 `currentStep` 扩展到 4+，渲染 `StepProjectCreate`

---

### 2.9 Dashboard ✅

**实现**: `/dashboard/page.tsx`  
**状态**: 完整实现

```typescript
// dashboard/page.tsx
export default function DashboardPage() {
  const { data: projects } = useProjects();
  // 显示项目列表，支持删除/恢复
}
```

---

### 2.10 原型预览 + AI助手 ⚠️

**实现**: `/prototype/editor` + `/chat`  
**状态**: 页面存在，但与创建流程未打通

```typescript
// StepProjectCreate.tsx:81
router.push(`/project?id=${createdProjectId}`)
```

**问题**: 
- 项目创建后跳转到 `/project?id=...`，不是 `/prototype/editor`
- `/project` 页面内容需要确认（可能只是项目信息页）
- `/prototype` 编辑器有 React Flow 实现，但没有被项目创建流程触发
- `/chat` AI 助手存在，但未与项目上下文关联

---

## 3. Confirm 流程 vs HomePage 流程（重复实现）

| 功能 | Confirm 流程 | HomePage 流程 | 状态 |
|------|------------|--------------|------|
| 限界上下文 | `/confirm/context` | HomePage Step 1 | HomePage ✅ |
| 领域模型 | `/confirm/model` | HomePage Step 2 | HomePage ✅ |
| 业务流程 | `/confirm/flow` | HomePage SSE | HomePage ✅ |
| 项目创建 | `/confirm/success` | 未实现 | 两者都缺失 |
| 结果持久化 | confirmationStore | 无 | confirmationStore ✅ |

**结论**: Confirm 流程完全闲置。HomePage 是实际使用的入口，但项目创建缺失。

---

## 4. 核心缺口汇总

| 优先级 | 缺口 | 影响 |
|--------|------|------|
| P0 | `onCreateProject={() => {}}` 空实现 | **无法创建项目，核心流程断裂** |
| P0 | HomePage 缺少 Step 4 项目创建步骤 | 项目创建无入口 |
| P1 | 用户勾选流程节点 → 后续生成未连通 | 无法基于选择生成内容 |
| P1 | 通用支撑域询问功能缺失 | 需求理解不完整 |
| P2 | 设计流程页面占位桩 | `/design/*` 无实际功能 |
| P2 | 页面/组件节点生成缺失 | 端到端流程中断 |
| P2 | 原型编辑器与项目创建未打通 | 用户无法预览生成结果 |

---

## 5. 建议修复路径

### 短期（P0，2h）：
1. **让 HomePage 渲染 `StepProjectCreate`** — 将 `currentStep` 扩展到 3，Step 3 时显示项目创建按钮
2. **修复 `onCreateProject` 调用** — `() => setCurrentStep(3)`

### 中期（P1，4h）：
1. **集成 `NodeTreeSelector` 到业务流程** — 勾选后触发页面/组件生成
2. **实现通用支撑域询问** — 新增一个澄清步骤或气泡对话

### 长期（P2，8h+）：
1. 实现 `/design/ui-generation` 完整功能
2. 打通 `/prototype/editor` 与项目数据
3. 清理闲置的 `/confirm/*` 路由或重定向

---

## 6. 已完成的相关实现

| 提交 | 内容 |
|------|------|
| `67f5eb8d` | PreviewArea 订阅 confirmationStore（修复流程图未渲染） |
| `8b8eab0b` | ActionButtons Step1 按钮行为修正 |
| `469bb207` | DesignStepLayout + StepNavigator（全5页集成） |
| `48153cb4` | Secure storage 错误日志 |
| `6ab10f04` | ESLint cache 优化（lint 27s < 30s） |

---

*Dev Agent | 2026-03-20*
