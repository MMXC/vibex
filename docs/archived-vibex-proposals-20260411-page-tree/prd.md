# PRD: 组件树按页面组织 — 修复 flowId 匹配问题

**项目**: vibex-proposals-20260411-page-tree
**版本**: v1.0
**日期**: 2026-04-12
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景
Canvas 编辑器的组件树按 `flowId` 分组展示页面归属。AI 生成组件时，`flowId` 字段填充不正确（常为 `'common'` 或与实际 BusinessFlowNode.nodeId 不匹配），导致组件被错误归入"通用组件"或"未知页面"虚线框，用户无法理解组件属于哪个页面。

### 历史根因（已确认）
- `vibex-component-tree-page-classification` (2026-03-30): flowId 有值但无法匹配 flowNodes.nodeId
- `vibex-component-tree-grouping` (2026-03-30): AI 生成 flowId='common' 触发 COMMON_FLOW_IDS
- 两问题同根：**AI 生成阶段 flowId 填充不正确**

### 目标
确保 AI 生成的组件 `flowId` 与实际 BusinessFlowNode.nodeId 正确关联，组件树中页面组件显示正确页面名称，不再出现"通用组件"或"未知页面"错误归组。

### 成功指标
- AI 生成组件后，组件树中 >90% 的页面组件显示正确页面名称（非"❓unknown"或"🔧 通用组件"）
- 通用组件（modal/button 等）仍正确归入"🔧 通用组件"组（回归）
- `matchFlowNode()` 各层 fallback 逻辑有单元测试覆盖

---

## 2. Epic 拆分

### Epic E1: 修复 flowId 匹配问题

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E1-S1 | AI Prompt 强化 | 在 AI 生成组件的 prompt 中增加 flowId 填充指令 | 1h | prompt 包含明确的 flowId = nodeId 指令 |
| E1-S2 | 模糊匹配能力增强 | 扩展 `matchFlowNode()` 的名称模糊匹配逻辑（L2/L3 层） | 0.5h | 见下方 expect() 条目 |
| E1-S3 | 回归验证 | 通用组件归组逻辑不变，单元测试通过 | 0.5h | 见下方 expect() 条目 |

**总工时估算**: 2h（1h 前端 + 1h AI prompt）

---

## 3. 验收标准（expect() 断言）

### E1-S1: AI Prompt 强化

```typescript
// 验证 AI prompt 包含 flowId 填充指令
expect(aiPromptText).toContain('flowId');
expect(aiPromptText).toContain('nodeId');
expect(aiPromptText).toMatch(/flowId\s*[=:]\s*.*nodeId/i);
```

```typescript
// 验证生成组件的 JSON response 中 flowId 不为空且非 'common'
const component = JSON.parse(aiResponse);
expect(component.flowId).toBeTruthy();
expect(component.flowId).not.toBe('common');
expect(component.flowId).not.toBe('mock');
expect(component.flowId).not.toBe('manual');
expect(component.flowId).not.toBe('');
```

### E1-S2: 模糊匹配能力增强

```typescript
// L2: Prefix 匹配
const result = matchFlowNode('flow-abc-123', flowNodes);
expect(result).not.toBeNull();
// 即使 flowId 包含 UUID 后缀，只要 prefix 匹配到 flowNodes 中的 nodeId 即返回该节点

// L3: 名称模糊匹配（忽略 - _ 空格）
const result2 = matchFlowNode('loginPage', flowNodes);
expect(result2?.name).toMatch(/登录|login/i);

// 兜底: 无法匹配时返回 null（不抛错）
const result3 = matchFlowNode('nonexistent', flowNodes);
expect(result3).toBeNull();
```

```typescript
// 完整 fallback 链路测试
const testCases = [
  { flowId: 'flow-login-001', expected: '登录页面' },
  { flowId: 'LOGINPAGE', expected: '登录页面' },     // case insensitive
  { flowId: 'login-page', expected: '登录页面' },     // hyphen
  { flowId: 'login_page', expected: '登录页面' },     // underscore
  { flowId: '__invalid__', expected: null },           // 无匹配
];
testCases.forEach(({ flowId, expected }) => {
  const result = matchFlowNode(flowId, flowNodes);
  expect(result?.name ?? null).toBe(expected);
});
```

### E1-S3: 回归验证

```typescript
// 通用组件归组逻辑不变
const commonComponent = { flowId: 'common', name: 'FooterModal', type: 'modal' };
expect(inferIsCommon(commonComponent)).toBe(true);

const commonTypeComponent = { flowId: 'flow-xyz', name: 'ConfirmButton', type: 'button' };
expect(inferIsCommon(commonTypeComponent)).toBe(true);

// 非通用组件不应归入通用组
const pageComponent = { flowId: 'flow-login-001', name: 'LoginForm', type: 'form' };
expect(inferIsCommon(pageComponent)).toBe(false);

// groupByFlowId 输出中，通用组件在单独分组中
const groups = groupByFlowId(components, flowNodes);
const commonGroup = groups.find(g => g.isCommon);
const pageGroups = groups.filter(g => !g.isCommon);
expect(commonGroup).toBeDefined();
expect(pageGroups.every(g => g.label !== '🔧 通用组件')).toBe(true);
```

---

## 4. 功能点明细

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | AI Prompt flowId 指令 | AI 生成组件时 prompt 包含 `flowId = nodeId` 指令 | expect(aiPrompt).toContain('flowId'); expect(aiPrompt).toMatch(/nodeId/) | 否 |
| F1.2 | matchFlowNode L2 Prefix 匹配 | flowId prefix 匹配 BusinessFlowNode.nodeId | expect(matchFlowNode('flow-abc', nodes)).not.toBeNull() | 否 |
| F1.3 | matchFlowNode L3 名称模糊匹配 | flowId 名称（忽略 -_ 空格）匹配 BusinessFlowNode.name | expect(matchFlowNode('loginpage', nodes)?.name).toMatch(/登录/i) | 否 |
| F1.4 | 通用组件归组回归 | modal/button 等类型组件归入通用组件组 | expect(inferIsCommon({type:'button'})).toBe(true) | 否 |
| F1.5 | 单元测试覆盖 | matchFlowNode() 模糊匹配有完整测试 | 29+ tests pass | 否 |

---

## 5. DoD (Definition of Done)

### E1-S1 完成标准
- [ ] AI prompt 文件（`prompts/generate-component.ts` 或等价）包含 `flowId` 和 `nodeId` 相关指令
- [ ] Prompt 修改有对应的变更记录（commit message 提及 flowId）
- [ ] 本地测试验证 prompt 生成结果中 flowId 字段有值且非 common

### E1-S2 完成标准
- [ ] `matchFlowNode()` 函数的 L2/L3 逻辑已在代码中实现
- [ ] 单元测试文件 `ComponentTree.test.tsx` 或 `matchFlowNode.test.ts` 包含 L2/L3 测试用例
- [ ] 测试运行 `pnpm test -- --testPathPattern=ComponentTree` 全通过

### E1-S3 完成标准
- [ ] 现有 `inferIsCommon` 逻辑未修改
- [ ] 通用组件归组回归测试 100% pass
- [ ] 手动测试验证：生成一个 modal 组件，它出现在"🔧 通用组件"组而非任何页面组

---

## 6. 依赖关系

```
E1-S1 (AI Prompt) → E1-S2 (matchFlowNode) → E1-S3 (回归测试)
```

- E1-S1 和 E1-S2 可并行开发
- E1-S3 依赖 E1-S1 和 E1-S2 完成后执行

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| AI prompt 改动后 flowId 仍不匹配 | 中 | 保留前端 matchFlowNode fallback 作为兜底 |
| 名称模糊匹配误匹配同名页面 | 低 | Prefix 匹配（L2）优先于名称匹配（L3） |
| AI 模型忽略 prompt 中的 flowId 指令 | 中 | prompt 中用示例 JSON 展示期望格式 |

---

*PM: vibex-proposals-20260411-page-tree | 生成日期: 2026-04-12*
