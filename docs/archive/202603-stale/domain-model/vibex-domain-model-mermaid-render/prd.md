# PRD: 预览区 Mermaid 实时渲染统一

**项目**: vibex-domain-model-mermaid-render  
**产品经理**: PM Agent  
**日期**: 2026-03-16  
**状态**: ✅ 完成

---

## 一、背景

### 1.1 问题描述

用户在首页生成领域模型时，预览区的 Mermaid 图表没有从限界上下文图切换到领域模型图。SSE 流式返回过程中，预览区显示的是上一步完成的图表，而不是当前正在生成的图表。

### 1.2 影响范围

- 领域模型生成阶段的实时预览
- 业务流程生成阶段的实时预览
- 用户体验（无法看到实时生成过程）

---

## 二、目标

**核心目标**: 预览区在 SSE 流式生成过程中实时显示对应阶段的 Mermaid 图表。

**非目标**: 
- 不修改 SSE 数据流逻辑
- 不修改后端 API

---

## 三、功能需求

### F1: 预览区实时渲染切换

| 属性 | 值 |
|------|-----|
| **描述** | 预览区使用 SSE 实时数据渲染 Mermaid 图表 |
| **优先级** | P0 |
| **验收标准** | 见下表 |

**验收标准**:

| ID | 场景 | 输入 | 预期输出 | 验证方法 |
|----|------|------|----------|----------|
| F1-001 | 限界上下文生成中 | `streamStatus='thinking'` | 预览区显示 `streamMermaidCode` | `expect(getDisplayMermaidCode()).toBe(streamMermaidCode)` |
| F1-002 | 领域模型生成中 | `modelStreamStatus='thinking'` | 预览区显示 `streamModelMermaidCode` | `expect(getDisplayMermaidCode()).toBe(streamModelMermaidCode)` |
| F1-003 | 业务流程生成中 | `flowStreamStatus='thinking'` | 预览区显示 `streamFlowMermaidCode` | `expect(getDisplayMermaidCode()).toBe(streamFlowMermaidCode)` |
| F1-004 | 全部 SSE 完成 | 所有 `status='idle'` 或 `'done'` | 预览区显示静态数据 | `expect(getDisplayMermaidCode()).toBe(getCurrentMermaidCode())` |

### F2: 静态数据回退

| 属性 | 值 |
|------|-----|
| **描述** | SSE 完成后预览区使用静态完成数据 |
| **优先级** | P0 |
| **验收标准** | SSE 完成后，预览区显示正确的最终图表 |

**验收标准**:

| ID | 场景 | currentStep | 预期显示 |
|----|------|-------------|----------|
| F2-001 | 限界上下文完成 | 2 | `contextMermaidCode` |
| F2-002 | 领域模型完成 | 3 | `modelMermaidCode` |
| F2-003 | 业务流程完成 | 4 | `flowMermaidCode` |

---

## 四、非功能需求

### NFR1: 性能

| 指标 | 要求 |
|------|------|
| 渲染延迟 | < 100ms |
| 状态更新 | 使用 `useCallback` 优化 |

### NFR2: 兼容性

| 指标 | 要求 |
|------|------|
| 现有功能 | 不影响限界上下文渲染 |
| 浏览器 | Chrome 90+, Firefox 88+, Safari 14+ |

---

## 五、红线约束

| ID | 约束 | 驳回条件 |
|----|------|----------|
| C1 | 只修改 `HomePage.tsx` | 修改其他文件 → 驳回 |
| C2 | 不修改 SSE 数据流逻辑 | 修改 `useDDDStream` → 驳回 |
| C3 | 不修改后端 API | 修改 API 调用 → 驳回 |
| C4 | 保持向后兼容 | 破坏现有限界上下文渲染 → 驳回 |

---

## 六、验收检查清单

### Dev 检查清单

- [ ] 新增 `getDisplayMermaidCode()` 函数
- [ ] 预览区调用 `getDisplayMermaidCode()`
- [ ] 单元测试覆盖率 > 80%
- [ ] `npm test` 通过
- [ ] `npm run build` 通过

### Tester 检查清单

- [ ] 限界上下文生成预览正常
- [ ] 领域模型生成预览正常切换
- [ ] 业务流程生成预览正常切换
- [ ] SSE 完成后静态数据正确
- [ ] 无回归问题

---

## 七、关联文档

| 文档 | 路径 |
|------|------|
| 分析文档 | `docs/vibex-domain-model-mermaid-render/analysis.md` |
| 架构设计 | `docs/vibex-domain-model-mermaid-render/architecture.md` |

---

## 八、版本历史

| 版本 | 日期 | 变更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-03-16 | 初始版本 | PM Agent |