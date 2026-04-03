# PRD: Mermaid 实时渲染 Bug 修复

**项目**: vibex-mermaid-render-bug
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

限界上下文生成后（及生成过程中）mermaid 图形未实时渲染。用户点击"开始生成"后，预览区显示空状态，需等待 SSE 完成才显示图表。

### 目标

修复 `getCurrentMermaidCode()` 函数，使其在 SSE 流式过程中也返回实时 mermaidCode。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 实时渲染覆盖率 | 100% |
| 图表显示延迟 | < 500ms |

---

## 2. 问题陈述

### 2.1 用户痛点

- 点击"开始生成"后预览区显示空状态
- SSE 流式过程中不显示图表
- 只有 SSE 完成后才显示图表

### 2.2 根因

`getCurrentMermaidCode()` 基于 `currentStep` 返回静态状态，未考虑 SSE 流式返回的 `streamMermaidCode`。

---

## 3. 功能需求

### F1: 实时 Mermaid 渲染

**描述**: 预览区在 SSE 流式过程中实时显示图表

**验收标准**:
- AC1.1: SSE 过程中 `streamStatus === 'thinking'` 时显示 `streamMermaidCode`
- AC1.2: SSE 完成后状态切换正常
- AC1.3: 领域模型生成时实时渲染 `streamModelMermaidCode`
- AC1.4: 业务流程生成时实时渲染 `streamFlowMermaidCode`

### F2: 状态优先级

**描述**: SSE 状态优先于 currentStep

**验收标准**:
- AC2.1: 任意 SSE 状态非 idle 时优先使用流式数据
- AC2.2: SSE idle 时回退到静态状态

---

## 4. Epic 拆分

### Epic 1: 实现 getRenderMermaidCode 函数

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 新增 getRenderMermaidCode 函数 | expect(getRenderMermaidCode()).toReturn(streamMermaidCode) |
| S1.2 | 替换渲染条件使用新函数 | expect(preview.code).toEqual(getRenderMermaidCode()) |

---

### Epic 2: 测试验证

**负责人**: Tester | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 限界上下文实时渲染 | expect(preview).toShowDuringSSE('contexts') |
| S2.2 | 领域模型实时渲染 | expect(preview).toShowDuringSSE('models') |
| S2.3 | 业务流程实时渲染 | expect(preview).toShowDuringSSE('flows') |

---

## 5. UI/UX 流程

```
用户点击「开始生成」
    ↓
streamStatus 变为 'thinking'
    ↓
getRenderMermaidCode() 检测非 idle
    ↓
返回 streamMermaidCode
    ↓
MermaidPreview 实时渲染 ✓
    ↓
SSE 完成，streamStatus 变为 'done'
    ↓
状态同步到静态变量
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 渲染延迟 < 500ms |
| 兼容性 | Chrome/Edge/Firefox |
| 回归 | /confirm 页面不受影响 |

---

## 7. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 实现 getRenderMermaidCode | 1h |
| Phase 2 | 测试验证 | 1h |

**总计**: 2h

---

## 8. 验收 CheckList

- [ ] AC1.1: 限界上下文 SSE 过程实时渲染
- [ ] AC1.2: SSE 完成后状态正常
- [ ] AC1.3: 领域模型实时渲染
- [ ] AC1.4: 业务流程实时渲染
- [ ] AC2.1: 状态优先级正确
- [ ] AC2.2: idle 回退正确

---

**DoD**:
1. 代码合并
2. 三个场景测试通过
3. 无回归问题
