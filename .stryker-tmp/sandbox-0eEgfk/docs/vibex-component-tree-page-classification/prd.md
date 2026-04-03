# PRD: VibeX Canvas 组件树页面分类修复

> **任务**: vibex-component-tree-page-classification/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/vibex-component-tree-page-classification/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 组件树中除"🔧 通用组件"外的所有组件被归类为"未知页面"，全塞在同一虚线框 |
| **根因** | `getPageLabel()` 中 `flowId` 无法匹配 `flowNodes.nodeId`，AI 生成组件时 flowId 填充不正确 |
| **目标** | 修复 AI 生成阶段 flowId 填充逻辑，确保组件树正确分类 |
| **成功指标** | AI 生成组件后 100% 正确归类，无"未知页面"误报 |

---

## 2. 功能需求

### F1: 修复 AI 生成阶段的 flowId 填充

**描述**：确保 AI 生成组件时，`flowId` 正确填充为对应的 `BusinessFlowNode.nodeId`

**验收标准**：
```
expect(generatedComponent.flowId).toMatch(/^[a-zA-Z0-9-_]+$/);
expect(flowNodes.some(f => f.nodeId === generatedComponent.flowId)).toBe(true);
```

### F2: 实现 fallback 兜底逻辑

**描述**：`getPageLabel()` 匹配失败时，使用 fallback 策略（prefix 匹配、name 模糊匹配）

**验收标准**：
```
expect(getPageLabel('flow-1', [{nodeId: 'flow-1-v2', name: 'Test'}])).toBe('📄 Test');
expect(getPageLabel('unknown-id', [])).toBe('未知页面');
```

### F3: 通用组件正确归类

**描述**：确保 `flowId ∈ COMMON_FLOW_IDS` 的组件正确归入"🔧 通用组件"虚线框

**验收标准**：
```
expect(inferIsCommon({flowId: 'mock'})).toBe(true);
expect(inferIsCommon({flowId: 'manual'})).toBe(true);
expect(inferIsCommon({flowId: 'common'})).toBe(true);
expect(inferIsCommon({flowId: 'user-flow-1'})).toBe(false);
```

### F4: 组件树分组显示正确

**描述**：AI 生成组件后，组件树应显示正确的页面分组（📄 {flowName}）

**验收标准**：
```
expect(pageLabels.every(l => l !== '未知页面')).toBe(true);
expect(pageLabels.filter(l => l.startsWith('📄'))).toHaveLength(componentCount);
```

---

## 3. UI/UX 流程

### 3.1 当前问题结构
```
┌─────────────────────────────────────┐
│ 🔧 通用组件                          │ ← 正确
├─────────────────────────────────────┤
│ ❓ 未知页面                          │ ← 问题：所有非通用组件都被归到这
│  • 组件A                           │
│  • 组件B                           │
│  • 组件C                           │
└─────────────────────────────────────┘
```

### 3.2 目标结构
```
┌─────────────────────────────────────┐
│ 🔧 通用组件                          │
├─────────────────────────────────────┤
│ 📄 创建订单流程                       │ ← 正确分组
│  • 组件A                           │
│  • 组件B                           │
├─────────────────────────────────────┤
│ 📄 用户认证流程                       │
│  • 组件C                           │
└─────────────────────────────────────┘
```

### 3.3 修复流程
```
AI 生成组件
    ↓
检查 flowId 是否匹配 flowNodes.nodeId
    ↓
┌─ 匹配成功 → 直接使用 nodeId 对应的 name
│
└─ 匹配失败 → Fallback 兜底
                ├─ Prefix 匹配（nodeId.startsWith(flowId)）
                ├─ Name 模糊匹配
                └─ 最终兜底：标记"未知页面"
```

---

## 4. Epic 拆分

### Epic 1: AI 生成阶段修复（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S1.1 | 定位 AI component generation 入口 | P0 | 2h |
| S1.2 | 修改 prompt/数据填充逻辑 | P0 | 3h |
| S1.3 | 验证生成结果 | P0 | 1h |

### Epic 2: Fallback 兜底逻辑（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S2.1 | 实现 prefix 匹配 | P0 | 0.5h |
| S2.2 | 实现 name 模糊匹配 | P0 | 0.5h |
| S2.3 | 单元测试覆盖 | P0 | 1h |

### Epic 3: 通用组件归类验证（P1）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S3.1 | 验证 COMMON_FLOW_IDS 列表完整 | P1 | 0.5h |
| S3.2 | gstack 截图验证 | P1 | 1h |

---

## 5. 优先级矩阵

| 功能 | 价值 | 成本 | 优先级 |
|------|------|------|--------|
| F1 AI 生成修复 | 高 | 中 | P0 |
| F2 Fallback 兜底 | 中 | 低 | P0 |
| F3 通用组件归类 | 中 | 低 | P1 |
| F4 分组显示验证 | 高 | 低 | P1 |

**决策**：Epic 1 + 2 为 P0，共 6h；Epic 3 为 P1，共 1.5h

---

## 6. 验收标准

### 6.1 代码检查
```bash
# flowId 匹配验证
grep -rn "getPageLabel\|inferIsCommon" ComponentTree.tsx

# Fallback 逻辑验证
grep -rn "startsWith.*flowId\|includes.*name" ComponentTree.tsx
```

### 6.2 单元测试
```typescript
describe('getPageLabel', () => {
  it('should return page name when flowId matches nodeId', () => {
    expect(getPageLabel('flow-1', [{nodeId: 'flow-1', name: 'Test'}])).toBe('📄 Test');
  });
  
  it('should use prefix fallback when exact match fails', () => {
    expect(getPageLabel('flow-1', [{nodeId: 'flow-1-v2', name: 'Test'}]))
      .toBe('📄 Test');
  });
  
  it('should return 未知页面 when no match found', () => {
    expect(getPageLabel('unknown', [])).toBe('未知页面');
  });
});
```

### 6.3 gstack 验证
```
checklist:
□ AI 生成组件后截图
□ 验证所有组件都归入正确页面（非"未知页面"）
□ 通用组件归入 🔧 通用组件 分组
```

---

## 7. 非功能需求

| 需求 | 要求 |
|------|------|
| 性能 | getPageLabel 调用 < 5ms |
| 兼容性 | 现有 flowId 不受影响 |
| 可测试性 | 覆盖率达到 80%+ |

---

## 8. 依赖

| 依赖 | 来源 |
|------|------|
| ComponentTree.tsx | 现有组件 |
| AI generation prompt | 需定位修改 |
| flowNodes 数据源 | 现有状态 |

---

## 9. DoD (Definition of Done)

- [ ] AI 生成组件的 flowId 100% 匹配 flowNodes.nodeId
- [ ] Fallback 兜底逻辑已实现并通过单元测试
- [ ] gstack 截图验证通过
- [ ] 无"未知页面"误报（除非 flowId 真正无法匹配）
- [ ] git commit + PR 已创建

---

## 10. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| AI prompt 改动影响生成质量 | 修改后用 gstack 验证生成结果 |
| 修复后已有组件 flowId 变化 | 数据 migration 脚本准备 |
