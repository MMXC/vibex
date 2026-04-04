# PRD: Canvas Generate Components Prompt Fix

> **项目**: canvas-generate-components-prompt-fix  
> **目标**: 修复 prompt 丢失 flowId 导致组件 flowId=unknown  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
generate-components API 的 prompt 缺少 `flowId` 字段要求，AI 输出缺少 flowId，代码 fallback 为 `flows[0]?.id || 'unknown'`，导致组件树无法正确关联流程。

### 目标
- P0: prompt 和 schema 添加 flowId 字段

### 成功指标
- AC1: AI 输出包含 flowId
- AC2: 组件 flowId 不再是 'unknown'
- AC3: 组件正确关联到业务流程

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | flowId 字段修复 | P0 | 0.3h |
| **合计** | | | **0.3h** |

### E1: flowId 字段修复

**问题根因**: AI schema 缺少 `flowId`，prompt 未明确要求 AI 输出 flowId。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | flowId schema + prompt 修复 | 0.3h | 见下方 |

**S1.1 验收标准**:
- `expect(component.flowId).toMatch(/^flow-/)` ✓
- `expect(component.flowId).not.toBe('unknown')` ✓
- AI 输出包含 flowId 字段 ✓

**DoD**:
- [ ] schema 添加 `flowId: string`
- [ ] prompt 明确要求每个组件标注 flowId
- [ ] 组件正确关联到业务流程

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | flowId schema 修复 | AI response schema 包含 flowId | E1 | expect(flowId).toBeDefined() | 无 |
| F1.2 | flowId prompt 修复 | prompt 明确要求 flowId | E1 | expect(aiOutput).toContain('flowId') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | AI 生成组件 | 检查 componentResult.data | 每个组件有 flowId |
| AC2 | 组件渲染 | 检查 flowId | 不是 'unknown' |
| AC3 | 组件树 | 展开节点 | 组件正确归属 flow |

---

## 5. DoD (Definition of Done)

- [ ] `aiService.generateJSON<>` schema 包含 `flowId: string`
- [ ] prompt 明确说明每个组件需标注 `flowId`
- [ ] 测试验证 AI 输出包含 flowId
- [ ] 组件不再 fallback 到 'unknown'

---

## 6. 实施计划

### Sprint 1 (0.3h)

| 阶段 | 内容 | 工时 |
|------|------|------|
| Phase 1 | E1: flowId schema + prompt 修复 | 0.3h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 兼容性 | 不破坏现有组件渲染逻辑 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
