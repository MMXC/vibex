# 领域模型步骤不推进问题分析

## 问题描述

用户点击「生成领域模型」后：
- ThinkingPanel 正确渲染领域模型图表 ✅
- 但主内容区仍显示「限界上下文」❌
- 侧边栏步骤未推进到步骤3 ❌

## 根因分析

### 原始问题代码 (HomePage.tsx 第 104-145 行)

```javascript
// 错误代码：status !== 'idle' 包含 'done' 状态
if (contextData.status !== 'idle') {
  return { ... contextData ... }  // done 状态也返回，阻塞了领域模型
}
```

### 问题原因

`getActiveStreamData` 函数使用 `status !== 'idle'` 判断活跃流，但这个条件包含了 `done` 状态：

- `idle` → 不活跃
- `thinking` → 活跃（正在生成）
- `done` → 已完成（应该不参与优先级竞争）
- `error` → 错误（应该不参与优先级竞争）

**问题链**：
1. 用户点击「生成限界上下文」→ `contextData.status` 变为 `thinking`
2. 限界上下文生成完成 → `contextData.status` 变为 `done`
3. 用户点击「生成领域模型」→ `modelData.status` 变为 `thinking`
4. **BUG**: `getActiveStreamData` 检测到 `contextData.status === 'done'`，由于 `done !== 'idle'`，仍然返回 contextData
5. 结果：主内容区显示限界上下文，而不是领域模型

## 修复方案

### 已应用的修复 (commit 0ffd61b)

**修改 1: getActiveStreamData 优先级判断**

```javascript
// 修复前
if (contextData.status !== 'idle') { ... }

// 修复后
if (contextData.status === 'thinking') { ... }
```

只有 `thinking` 状态才被认为是活跃的，`done` 状态不再参与优先级竞争。

**修改 2: useEffect 步骤推进条件**

```javascript
// 修复前
if (modelStreamStatus === 'done' && streamDomainModels.length > 0) {
  setCurrentStep(3);
  setCompletedStep(3);
}

// 修复后
if (modelStreamStatus === 'done') {
  setDomainModels(streamDomainModels as DomainModel[]);
  setModelMermaidCode(streamModelMermaidCode);
  // 仅在有结果时推进步骤
  if (streamDomainModels.length > 0 || streamModelMermaidCode) {
    setCurrentStep(3);
    setCompletedStep(3);
  }
}
```

## 修复状态

✅ **已修复** - commit `0ffd61b` (2026-03-16 21:02:39 +0800)

修复内容：
- 放宽 SSE 同步条件，即使 contexts 为空也同步 mermaidCode
- 仅在有结果时推进步骤（需要 `streamDomainModels.length > 0 || streamModelMermaidCode`）

## 影响范围

| 组件 | 影响 | 状态 |
|------|------|------|
| getActiveStreamData | 核心修复 | ✅ 已修复 |
| 限界上下文生成 | 无影响 | ✅ 正常 |
| 领域模型生成 | 步骤推进修复 | ✅ 已修复 |
| 业务流程生成 | 无影响 | ✅ 正常 |

## 验收测试

| ID | 测试场景 | 预期结果 | 状态 |
|----|----------|----------|------|
| V1 | 点击生成限界上下文 | 步骤推进到2，主内容区显示限界上下文 | ✅ 通过 |
| V2 | 点击生成领域模型 | 步骤推进到3，主内容区显示领域模型 | ✅ 通过 |
| V3 | 点击生成业务流程 | 步骤推进到4，主内容区显示业务流程 | ✅ 通过 |
| V4 | 进度条更新 | 显示正确的步骤进度 | ✅ 通过 |

## 结论

该问题已在 commit `0ffd61b` 中修复，无需额外操作。

---

*分析时间: 2026-03-16 21:00 (Asia/Shanghai)*
*分析者: Analyst Agent*