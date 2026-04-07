# PRD: canvas-flowtree-api-fix

> **项目**: canvas-flowtree-api-fix  
> **目标**: 将 autoGenerateFlows 从 mock 替换为真实 API 调用  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
`autoGenerateFlows` 在 `flowStore.ts` 中是 mock 实现（1500ms 延迟 + 硬编码模板），所有上下文生成相同流程，AI 生成能力完全不可用。

### 目标
- P0: 替换为真实 API 调用
- P1: 支持 flowId 关联
- P1: 错误处理

### 成功指标
- AC1: API 调用成功
- AC2: flowId 正确关联
- AC3: 错误状态处理

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | API 调用替换 | P0 | 2h |
| E2 | flowId 关联 | P1 | 1h |
| E3 | 错误处理 | P1 | 1h |
| **合计** | | | **4h** |

---

### E1: API 调用替换

**根因**: mock 实现导致 AI 生成能力不可用。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | API 集成 | 2h | `expect(api).toBeCalled()` ✓ |

**验收标准**:
- `expect(flowStore.generateFlows).toCall(api)` ✓

**DoD**:
- [ ] 移除 mock 代码
- [ ] API 调用成功

---

### E2: flowId 关联

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | flowId 正确 | 1h | `expect(flowId).toMatch(/^flow-/)` ✓ |

**验收标准**:
- `expect(flow.id).toBeDefined()` ✓

**DoD**:
- [ ] flowId 正确生成

---

### E3: 错误处理

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 错误状态 | 1h | `expect(error).toBeHandled()` ✓ |

**验收标准**:
- `expect(flowGenerating).toBe(false)` on error ✓

**DoD**:
- [ ] 错误状态正确处理

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | API 集成 | E1 | expect(api.called).toBe(true) | 【需页面集成】 |
| F2.1 | flowId 关联 | E2 | expect(flow.id).toMatch(/^flow-/) | 无 |
| F3.1 | 错误处理 | E3 | expect(flowGenerating).toBe(false) | 无 |

---

## 4. DoD

- [ ] 移除 mock，API 调用成功
- [ ] flowId 正确生成
- [ ] 错误状态处理正确

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
