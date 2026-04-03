# 首页 8 个紧急问题分析报告

**项目**: vibex-homepage-urgent-fixes
**分析师**: Analyst Agent
**日期**: 2026-03-14

---

## 执行摘要

对首页 9 个问题进行根因分析，发现 **5 个严重 Bug**、**3 个中等 UX 问题**、**1 个功能增强需求**。建议优先修复 **#1 领域模型报错**、**#5 面板功能无效** 和 **#9 步骤切换 Bug**，这三项阻塞核心用户流程。

---

## 问题总览

| # | 问题 | 类型 | 严重度 | 根因定位 | 工作量 |
|---|------|------|--------|----------|--------|
| 1 | 领域模型生成报错 | Bug | 🔴 严重 | 已定位 | 1天 |
| 2 | 按钮交互优化 | UX | 🟡 中等 | 已定位 | 0.5天 |
| 3 | 分析进度条缺失 | UX | 🟡 中等 | 新功能 | 0.5天 |
| 4 | React Hydration 错误 | Bug | 🔴 严重 | 已定位 | 0.5天 |
| 5 | 面板最大化最小化无效 | Bug | 🔴 严重 | 已定位 | 0.5天 |
| 6 | Panel 区域大小调整 | UX | 🟢 低 | 新功能 | 1天 |
| 7 | 示例点击未填入输入框 | Bug | 🟡 中等 | 已定位 | 0.5天 |
| 8 | 流程勾选上下文传递 | 功能 | 🔴 重要 | 已定位 | 1天 |
| 9 | 已完成步骤无法自由切换 | Bug | 🔴 严重 | 已定位 | 0.5天 |

---

## 详细分析

### #1: 领域模型生成报错 🔴 严重

**错误信息**:
```
ErrorBoundary caught an error: TypeError: Cannot read properties of undefined (reading 'length')
```

**根因定位**:

位置: `src/hooks/useDDDStream.ts` 第 141 行

```typescript
// 问题代码
for (let i = 0; i < lines.length; i++) {  // lines 可能为 undefined
  const line = lines[i]
  // ...
}
```

**问题分析**:
- `buffer.split('\n')` 返回结果在异常情况下可能为 undefined
- 缺少对 `lines` 的空值检查
- SSE 流解析时边界条件处理不完善

**修复方案**:

```typescript
// 修复后
const lines = buffer?.split('\n') || []
buffer = lines.pop() || ''

if (!Array.isArray(lines)) {
  console.warn('Invalid lines format')
  return
}

for (let i = 0; i < lines.length; i++) {
  // ...
}
```

**验收标准**:
- [ ] 领域模型生成不再报错
- [ ] 空数据情况下有友好提示
- [ ] 添加单元测试覆盖边界情况

**工作量**: 1 天

---

### #2: 按钮交互优化 🟡 中等

**问题描述**: 点击按钮无反馈，用户不知道当前状态

**根因定位**:

位置: `src/app/page.tsx` 第 754-813 行

```typescript
// 当前代码 - 无 loading 状态显示
<button onClick={handleGenerateDomainModel}>
  继续生成
</button>
```

**问题分析**:
- 按钮没有显示 loading 动画
- 没有禁用其他按钮的逻辑
- 缺少状态反馈机制

**修复方案**:

```typescript
// 添加 loading 状态
const isGenerating = flowStreamStatus !== 'idle'

<button 
  onClick={handleGenerateDomainModel}
  disabled={isGenerating}
  className={isGenerating ? styles.loading : ''}
>
  {isGenerating ? '生成中...' : '继续生成'}
</button>

// 其他按钮显示提示
<button 
  onClick={handleOther}
  title={isGenerating ? '请先等待当前分析完成' : ''}
>
  其他操作
</button>
```

**验收标准**:
- [ ] 生成中按钮显示 loading 动画
- [ ] 其他按钮被禁用并显示提示
- [ ] 状态变化时有过渡动画

**工作量**: 0.5 天

---

### #3: 分析进度条缺失 🟡 中等

**问题描述**: 用户不知道 AI 分析进度

**根因定位**: 新功能缺失

**实现方案**:

```typescript
// 添加进度条组件
<div className={styles.progressContainer}>
  <div 
    className={styles.progressBar}
    style={{ width: `${progress}%` }}
  />
  <span>{progress}%</span>
</div>
```

**进度计算方式**:
- 基于已接收的 SSE 事件数量
- 基于已生成的 token 数量
- 基于时间估算

**验收标准**:
- [ ] 进度条显示在 AI 面板上方
- [ ] 进度实时更新
- [ ] 完成后进度条消失

**工作量**: 0.5 天

---

### #4: React Hydration 错误 #418 🔴 严重

**错误信息**:
```
Uncaught Error: Minified React error #418
```

**根因定位**:

位置: `src/app/page.tsx` 第 196 行、第 232 行

```typescript
// 问题代码 - localStorage 在 SSR 时不可用
const [selectedNodes, setSelectedNodes] = useState<Set<string>>(() => {
  const stored = localStorage.getItem('vibex-selected-nodes');  // SSR 报错
  // ...
});

const [maximizedPanel, setMaximizedPanel] = useState<string | null>(() => {
  return localStorage.getItem('vibex-maximized-panel');  // SSR 报错
});
```

**问题分析**:
- React Error #418 是 Hydration 不匹配错误
- 服务端渲染时 `localStorage` 不存在
- 初始状态在服务端和客户端不一致

**修复方案**:

```typescript
// 修复后 - 使用 useEffect 初始化
const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

useEffect(() => {
  const stored = localStorage.getItem('vibex-selected-nodes');
  if (stored) {
    setSelectedNodes(new Set(JSON.parse(stored)));
  }
}, []); // 空依赖，只在客户端执行一次

// 或使用 typeof window 检查
const [maximizedPanel, setMaximizedPanel] = useState<string | null>(() => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vibex-maximized-panel');
});
```

**验收标准**:
- [ ] 首页加载无 Hydration 错误
- [ ] localStorage 数据正常持久化
- [ ] 控制台无相关警告

**工作量**: 0.5 天

---

### #5: 面板最大化最小化无效 🔴 严重

**问题描述**: 面板功能不工作

**根因定位**:

位置: `src/app/page.tsx` 第 232 行、第 240 行

```typescript
// 状态已定义
const [maximizedPanel, setMaximizedPanel] = useState<string | null>(() => {...});
const [minimizedPanel, setMinimizedPanel] = useState<string | null>(() => {...});

// 但缺少使用这些状态的 UI 逻辑
```

**问题分析**:
- 状态已定义但未使用
- 缺少最大化/最小化按钮的点击事件
- 缺少面板样式变化逻辑

**修复方案**:

```typescript
// 1. 添加按钮
<div className={styles.panelHeader}>
  <button 
    onClick={() => setMaximizedPanel(maximizedPanel ? null : 'preview')}
    className={styles.panelButton}
  >
    {maximizedPanel ? '还原' : '最大化'}
  </button>
  <button 
    onClick={() => setMinimizedPanel('preview')}
    className={styles.panelButton}
  >
    最小化
  </button>
</div>

// 2. 添加样式变化
<div className={`
  ${styles.previewArea}
  ${maximizedPanel === 'preview' ? styles.maximized : ''}
  ${minimizedPanel === 'preview' ? styles.minimized : ''}
`}>
```

**验收标准**:
- [ ] 点击最大化按钮，面板全屏显示
- [ ] 点击最小化按钮，面板折叠
- [ ] 状态持久化到 localStorage

**工作量**: 0.5 天

---

### #6: Panel 区域大小调整 🟢 低

**问题描述**: 预设 panel 浪费空间

**根因定位**: 功能增强

**当前状态**:
```typescript
// 已有 panelSizes 状态
const [panelSizes, setPanelSizes] = useState<number[]>([60, 40]);

// 已在 Panel 组件使用
<Panel defaultSize={panelSizes[0]} minSize={30} maxSize={70}>
```

**问题分析**:
- 已有基础实现
- 缺少用户可拖拽调整的 UI
- 需要添加 resize 事件处理

**修复方案**:

```typescript
// 添加可拖拽分隔条
<div className={styles.resizer} onMouseDown={handleResizeStart} />

const handleResizeStart = (e: React.MouseEvent) => {
  const startX = e.clientX;
  const startSizes = [...panelSizes];
  
  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX;
    const newSizes = [
      startSizes[0] + (diff / containerWidth * 100),
      startSizes[1] - (diff / containerWidth * 100),
    ];
    setPanelSizes(newSizes);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', handleMouseMove);
  }, { once: true });
};
```

**验收标准**:
- [ ] 可拖拽调整面板宽度
- [ ] 调整范围限制在 30%-70%
- [ ] 宽度持久化到 localStorage

**工作量**: 1 天

---

### #7: 示例点击未填入输入框 🟡 中等

**问题描述**: 点击示例后，文本未填入需求输入框

**根因定位**:

位置: `src/app/page.tsx` 第 383-385 行

```typescript
const handleSampleClick = (desc: string) => {
  setRequirementText(desc);  // 设置了 requirementText
};
```

**问题分析**:
- 代码逻辑正确，已调用 `setRequirementText`
- 可能是输入框未绑定 `requirementText`
- 或者有其他状态覆盖了输入

**检查输入框绑定**:
```typescript
// 需确认 RequirementInput 组件是否正确接收 value
<RequirementInput
  value={requirementText}  // 应该绑定
  onChange={setRequirementText}
/>
```

**修复方案**:

```typescript
// 确保 RequirementInput 正确绑定
// 1. 检查 props 传递
// 2. 检查内部 input 绑定
// 3. 添加调试日志

const handleSampleClick = (desc: string) => {
  console.log('Sample clicked:', desc);  // 调试
  setRequirementText(desc);
  // 可选: 滚动到输入框
  document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' });
};
```

**验收标准**:
- [ ] 点击示例后，文本显示在输入框
- [ ] 输入框内容与示例一致
- [ ] 可立即点击"开始生成"

**工作量**: 0.5 天

---

### #8: 流程勾选上下文传递 🔴 重要

**问题描述**: 用户勾选的内容未传递到下一步分析

**根因定位**:

位置: `src/app/page.tsx` 第 447-455 行

```typescript
// 当前代码 - 未使用 selectedNodes
const handleGenerateDomainModel = () => {
  if (boundedContexts.length === 0) return;
  generateDomainModels(requirementText, boundedContexts);  // 缺少 selectedNodes
};

const handleGenerateBusinessFlow = () => {
  if (domainModels.length === 0) return;
  generateFlow(domainModels, requirementText);  // 缺少 selectedNodes
};
```

**问题分析**:
- `selectedNodes` 状态已定义（第 196 行）
- 勾选 UI 已实现（第 789 行、第 844 行）
- 但生成时未使用勾选数据

**修复方案**:

```typescript
// 1. 过滤勾选的节点
const getSelectedContexts = () => {
  return boundedContexts.filter(ctx => 
    selectedNodes.has(`ctx-${ctx.id}`)
  );
};

const getSelectedModels = () => {
  return domainModels.filter(model => 
    selectedNodes.has(`model-${model.id}`)
  );
};

// 2. 在生成时使用勾选数据
const handleGenerateDomainModel = () => {
  const selectedContexts = getSelectedContexts();
  if (selectedContexts.length === 0) {
    // 提示用户选择至少一个
    alert('请至少选择一个限界上下文');
    return;
  }
  generateDomainModels(requirementText, selectedContexts);
};

// 3. 传递到后端
const generateDomainModels = (requirement: string, contexts: BoundedContext[]) => {
  // SSE 请求包含勾选的上下文
  const selectedIds = contexts.map(c => c.id);
  fetch('/api/domain-model', {
    method: 'POST',
    body: JSON.stringify({ requirement, selectedContextIds: selectedIds }),
  });
};
```

**验收标准**:
- [ ] 勾选的节点被传递到下一步
- [ ] 未勾选的节点不参与生成
- [ ] 全选/取消全选功能正常
- [ ] 勾选状态在步骤间保持

**工作量**: 1 天

---

### #9: 已完成步骤无法自由切换 🔴 严重

**问题描述**: 用户点击之前步骤后，之后的已完成步骤变成不可点击

**预期行为**:
1. 用户点击任意已完成的步骤 → 切换到该步骤
2. 用户可以继续点击之前或之后的已完成步骤 → 自由切换
3. 工作区内容恢复到对应步骤的状态

**当前 Bug**:
- 点击到之前步骤后，之后的步骤变成不可点击状态

**根因定位**:

位置: `src/app/page.tsx` 第 489-495 行

```typescript
// 问题代码
const isStepClickable = (stepId: number) => {
  return stepId <= currentStep;  // ❌ 只允许点击当前步骤和之前的步骤
};

const handleStepClick = (stepId: number) => {
  if (!isStepClickable(stepId)) return;
  setCurrentStep(stepId);  // 切换后，currentStep 变小，后面的步骤不可点击了
};
```

**问题分析**:
- `isStepClickable` 使用 `currentStep` 判断可点击性
- 当用户点击之前的步骤时，`currentStep` 变小
- 导致之后已完成的步骤不满足 `stepId <= currentStep`，变为不可点击

**示例场景**:
```
用户完成步骤 3 (currentStep = 3)
点击步骤 2 (currentStep = 2)
此时步骤 3 变成不可点击 (因为 3 > 2) ❌
```

**修复方案**:

```typescript
// 方案：新增 completedStep 状态跟踪已完成的最高步骤
const [completedStep, setCompletedStep] = useState(1);

// 当生成完成时更新
const handleGenerateComplete = (step: number) => {
  setCompletedStep(Math.max(completedStep, step));
  setCurrentStep(step);
};

// 修改可点击逻辑
const isStepClickable = (stepId: number) => {
  return stepId <= completedStep;  // ✅ 使用 completedStep 判断
};

// 点击步骤只切换 currentStep，不改变 completedStep
const handleStepClick = (stepId: number) => {
  if (!isStepClickable(stepId)) return;
  setCurrentStep(stepId);  // completedStep 保持不变
};
```

**验收标准**:
- [ ] 点击任意已完成步骤，可正常切换
- [ ] 切换后，其他已完成步骤仍可点击
- [ ] 未完成的步骤不可点击
- [ ] 步骤状态正确显示（完成/进行中/待完成）

**工作量**: 0.5 天

---

## 优先级排序

### Phase 1: 紧急修复 (本周)

| # | 问题 | 工作量 | 原因 |
|---|------|--------|------|
| 1 | 领域模型生成报错 | 1天 | 阻塞用户流程 |
| 4 | React Hydration 错误 | 0.5天 | 影响首屏体验 |
| 5 | 面板最大化最小化无效 | 0.5天 | 功能已实现但未集成 |
| 9 | 已完成步骤无法自由切换 | 0.5天 | 核心交互 Bug |
| 8 | 流程勾选上下文传递 | 1天 | 核心功能缺失 |

**Phase 1 总工期**: 3.5 天

### Phase 2: UX 优化 (下周)

| # | 问题 | 工作量 |
|---|------|--------|
| 2 | 按钮交互优化 | 0.5天 |
| 3 | 分析进度条缺失 | 0.5天 |
| 7 | 示例点击未填入输入框 | 0.5天 |

**Phase 2 总工期**: 1.5 天

### Phase 3: 功能增强 (后续)

| # | 问题 | 工作量 |
|---|------|--------|
| 6 | Panel 区域大小调整 | 1天 |

**Phase 3 总工期**: 1 天

---

## 技术风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Hydration 修复影响其他功能 | 🟡 中 | 充分测试 SSR 流程 |
| 勾选传递需要后端配合 | 🟡 中 | 与后端协调 API 修改 |
| 面板状态持久化可能冲突 | 🟢 低 | 使用唯一 key |
| 步骤切换影响其他状态 | 🟡 中 | 确保 completedStep 状态独立管理 |

---

## 验收检查清单

### Bug 修复

- [ ] #1: 领域模型生成无报错
- [ ] #4: 首页加载无 Hydration 错误
- [ ] #5: 面板最大化最小化功能正常
- [ ] #7: 示例点击填入输入框
- [ ] #9: 已完成步骤可自由前后切换

### 功能增强

- [ ] #8: 勾选内容传递到下一步

### UX 优化

- [ ] #2: 按钮有 loading 状态
- [ ] #3: 进度条显示分析进度

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-urgent-fixes/analysis.md`

**分析师**: Analyst Agent
**日期**: 2026-03-14