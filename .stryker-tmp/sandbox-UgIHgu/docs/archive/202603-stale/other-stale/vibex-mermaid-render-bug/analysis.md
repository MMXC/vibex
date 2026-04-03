# Mermaid 实时渲染 Bug 分析报告

**项目**: vibex-mermaid-render-bug  
**分析师**: Analyst Agent  
**日期**: 2026-03-16  
**状态**: ✅ 分析完成

---

## 执行摘要

**问题**: 限界上下文生成后（及生成过程中）mermaid 图形未实时渲染。

**根因**: `getCurrentMermaidCode()` 函数基于 `currentStep` 返回静态状态中的 mermaidCode，未考虑 SSE 流式返回的 `streamMermaidCode`。

**影响范围**: 三个 SSE 流的实时预览（限界上下文、领域模型、业务流程）。

**推荐方案**: 修改渲染条件，优先使用 SSE 流式返回的 mermaidCode。

---

## 一、问题定位

### 1.1 问题现象

| 场景 | 预期行为 | 实际行为 |
|------|----------|----------|
| 点击"开始生成"后 | 预览区实时显示 AI 生成的图表 | 显示空状态或等待完成后才显示 |
| SSE 流式返回 mermaidCode 时 | 实时更新图表 | 不更新 |
| SSE 完成后 | 显示完整图表 | ✅ 正常显示 |

### 1.2 代码路径分析

**文件**: `src/components/homepage/HomePage.tsx`

```typescript
// 问题代码：getCurrentMermaidCode() 函数
const getCurrentMermaidCode = () => {
  switch (currentStep) {
    case 1: return mermaidCode;      // ❌ useMemo 返回的空字符串
    case 2: return contextMermaidCode;
    case 3: return modelMermaidCode;
    case 4: return flowMermaidCode;
    default: return '';
  }
};
```

**渲染条件**:
```typescript
{getCurrentMermaidCode() ? (
  <MermaidPreview code={getCurrentMermaidCode()} ... />
) : (
  <div className={styles.previewEmpty}>输入需求后，这里将实时显示...</div>
)}
```

**问题根源**:
1. `currentStep === 1` 时，`getCurrentMermaidCode()` 返回 `mermaidCode`（空字符串）
2. SSE 流式返回时，`streamMermaidCode` 有值但未被使用
3. 只有当 SSE 完成后，`setContextMermaidCode(streamMermaidCode)` 和 `setCurrentStep(2)` 同时触发
4. 此时 `currentStep === 2`，`getCurrentMermaidCode()` 才返回 `contextMermaidCode`

### 1.3 SSE 流式数据路径

```
SSE Event: 'done'
    ↓
setMermaidCode(parsedData.mermaidCode)  // useDDDStream 内部
    ↓
streamMermaidCode 更新
    ↓
useEffect 检测 streamStatus === 'done'
    ↓
setContextMermaidCode(streamMermaidCode) + setCurrentStep(2)
    ↓
getCurrentMermaidCode() 返回 contextMermaidCode
    ↓
MermaidPreview 渲染
```

**问题**: SSE 生成过程中（`streamStatus === 'thinking'`），`streamMermaidCode` 已经有值，但未被渲染逻辑使用。

---

## 二、影响范围分析

### 2.1 直接影响

| 功能 | 影响程度 | 说明 |
|------|----------|------|
| 限界上下文实时预览 | 🔴 高 | SSE 过程中不显示 |
| 领域模型实时预览 | 🔴 高 | SSE 过程中不显示 |
| 业务流程实时预览 | 🔴 高 | SSE 过程中不显示 |

### 2.2 关联功能

| 功能 | 文件 | 是否受影响 |
|------|------|------------|
| ThinkingPanel | HomePage.tsx | ❌ 不受影响（使用 SSE 状态） |
| /confirm 页面 | confirm/page.tsx | ❌ 不受影响（使用 streamMermaidCode） |
| PreviewCanvas | PreviewCanvas.tsx | ⚠️ 可能受影响（相同逻辑） |

### 2.3 验证：/confirm 页面实现

```typescript
// confirm/page.tsx - 正确实现
<MermaidPreview 
  code={streamMermaidCode || contextMermaidCode}
  ...
/>
```

`/confirm` 页面直接使用 `streamMermaidCode`，**不受此 bug 影响**。

### 2.4 验证：PreviewCanvas 组件

```typescript
// PreviewCanvas.tsx
const getCurrentMermaidCode = (): string => {
  switch (currentStep) {
    case 1: return mermaidCodes.contexts || '';  // ⚠️ 类似问题
    case 2: return mermaidCodes.contexts || '';
    ...
  }
};
```

PreviewCanvas 组件有类似问题，但它是通过 props 接收 `mermaidCodes`，需要检查调用方。

---

## 三、解决方案

### 3.1 方案 A：修改渲染条件（推荐）

**修改思路**: 在渲染条件中优先使用 SSE 流式返回的 mermaidCode。

```typescript
// 修改 HomePage.tsx

// 新增：获取实时渲染用的 mermaidCode
const getRenderMermaidCode = () => {
  // 优先使用 SSE 流式返回的 mermaidCode
  if (streamStatus !== 'idle') return streamMermaidCode;
  if (modelStreamStatus !== 'idle') return streamModelMermaidCode;
  if (flowStreamStatus !== 'idle') return streamFlowMermaidCode;
  
  // SSE 完成后使用静态状态
  return getCurrentMermaidCode();
};

// 渲染条件修改
{getRenderMermaidCode() ? (
  <MermaidPreview code={getRenderMermaidCode()} ... />
) : (
  <div className={styles.previewEmpty}>...</div>
)}
```

### 3.2 方案 B：修改 getCurrentMermaidCode 函数

```typescript
// 修改 getCurrentMermaidCode 函数
const getCurrentMermaidCode = () => {
  // SSE 进行中时，返回流式数据
  if (streamStatus === 'thinking') return streamMermaidCode;
  if (modelStreamStatus === 'thinking') return streamModelMermaidCode;
  if (flowStreamStatus === 'thinking') return streamFlowMermaidCode;
  
  // SSE 完成后，返回静态状态
  switch (currentStep) {
    case 1: return mermaidCode;
    case 2: return contextMermaidCode;
    case 3: return modelMermaidCode;
    case 4: return flowMermaidCode;
    default: return '';
  }
};
```

### 3.3 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A: 新增函数 | 职责分离、易测试 | 多一个函数 | ⭐⭐⭐⭐⭐ |
| B: 修改现有函数 | 改动最小 | 逻辑混合 | ⭐⭐⭐⭐ |

**推荐方案 A**，职责更清晰。

---

## 四、验收标准

### 4.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| MR-001 | 点击"开始生成"后，预览区实时显示限界上下文图表 | 手动测试：输入需求 → 点击生成 → 验证实时渲染 |
| MR-002 | SSE 流式返回 mermaidCode 时，图表实时更新 | 手动测试：观察 SSE 过程中的渲染 |
| MR-003 | SSE 完成后，图表正确显示 | 手动测试：等待完成 → 验证最终图表 |
| MR-004 | 领域模型生成时实时渲染 | 手动测试：点击"生成领域模型" → 验证实时渲染 |
| MR-005 | 业务流程生成时实时渲染 | 手动测试：点击"生成业务流程" → 验证实时渲染 |

### 4.2 回归测试

| 功能 | 验证点 |
|------|--------|
| ThinkingPanel | 确保 SSE 状态正确显示 |
| /confirm 页面 | 确保不受影响 |
| 步骤切换 | 确保状态同步正确 |

---

## 五、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | 分析问题、定位根因 | 0.5h |
| 2 | 实现方案 A（新增 getRenderMermaidCode） | 1h |
| 3 | 测试验证（三个 SSE 场景） | 1h |
| **总计** | | **2.5h** |

---

## 六、风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| SSE 状态竞争 | 低 | 中 | 确保状态更新顺序正确 |
| 预览闪烁 | 低 | 低 | 添加加载状态过渡 |
| 回归问题 | 低 | 中 | 完整测试三个 SSE 场景 |

---

## 七、下一步行动

1. **Dev**: 实现 `getRenderMermaidCode()` 函数
2. **Tester**: 验证三个 SSE 场景的实时渲染
3. **Reviewer**: 代码审查

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-mermaid-render-bug/analysis.md`