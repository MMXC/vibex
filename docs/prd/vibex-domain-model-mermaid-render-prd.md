# PRD: 领域模型 Mermaid 实时渲染切换修复

**项目**: vibex-domain-model-mermaid-render
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

领域模型生成时，预览区 Mermaid 图表未从限界上下文图表切换到领域模型图表。预览区使用 `getCurrentMermaidCode()` 静态状态，而非 SSE 流式数据。

### 目标

修复预览区图表切换逻辑，实现领域模型和业务流程生成时实时切换图表。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 图表切换成功率 | 100% |
| 实时渲染延迟 | < 500ms |

---

## 2. 问题陈述

### 2.1 用户痛点

- 领域模型生成时，预览区仍显示限界上下文图
- 业务流程生成时，预览区仍显示领域模型图
- 只有 SSE 完成后才切换图表

### 2.2 根因

预览区 `getCurrentMermaidCode()` 基于 `currentStep` 返回静态状态，而非 SSE 流式数据。

---

## 3. 功能需求

### F1: 预览区实时切换

**描述**: 预览区根据 SSE 状态实时切换 mermaid 图表

**验收标准**:
- AC1.1: 领域模型生成时从限界上下文图切换到领域模型图
- AC1.2: 业务流程生成时从领域模型图切换到业务流程图
- AC1.3: SSE 流式过程中实时更新

### F2: 统一数据源

**描述**: 预览区与 ThinkingPanel 使用相同的 `getActiveStreamData()` 逻辑

**验收标准**:
- AC2.1: 预览区使用 activeStream.mermaidCode
- AC2.2: 无 SSE 时回退到静态状态

---

## 4. Epic 拆分

### Epic 1: 预览区逻辑修改

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 修改预览区使用 activeStream | expect(preview.mermaidCode).toEqual(activeStream.mermaidCode) |
| S1.2 | 添加空状态处理 | expect(emptyState).toShowPlaceholder() |

---

### Epic 2: 测试验证

**负责人**: Tester | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 领域模型切换测试 | expect(preview).toSwitchTo('model') |
| S2.2 | 业务流程切换测试 | expect(preview).toSwitchTo('flow') |
| S2.3 | 回归测试 | expect(thinkingPanel).toWorkCorrectly() |

---

## 5. UI/UX 流程

```
用户生成领域模型
    ↓
modelStreamStatus 变为 'thinking'
    ↓
getActiveStreamData() 返回 modelStream
    ↓
预览区显示 streamModelMermaidCode ✓
    ↓
SSE 完成，切换到 Step 3
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 渲染延迟 < 500ms |
| 兼容性 | Chrome/Edge/Firefox |
| 回归 | ThinkingPanel 不受影响 |

---

## 7. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 修改预览区逻辑 | 1h |
| Phase 2 | 测试验证 | 1h |

**总计**: 2h

---

## 8. 验收 CheckList

- [ ] AC1.1: 领域模型图表切换
- [ ] AC1.2: 业务流程图表切换
- [ ] AC1.3: SSE 实时更新
- [ ] AC2.1: 统一数据源
- [ ] AC2.2: 空状态回退

---

**DoD**:
1. 代码合并
2. 测试通过
3. 无回归问题
