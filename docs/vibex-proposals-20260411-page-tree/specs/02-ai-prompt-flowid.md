# Spec: AI prompt flowId 填充强化

**关联 PRD**: F1.1（AI prompt 强化 flowId 填充）
**关联 Story**: S1.1
**关联验收标准**: AC1.1、AC1.2、AC1.3

---

## 概述

当前 AI 生成组件时，prompt 中未明确指定 `flowId` 的来源规则，导致 AI 返回的 `flowId` 与实际 `BusinessFlowNode` 的 `nodeId` 不一致，组件被错误归入"未知页面"。

本规格通过强化 AI prompt 模板，确保 AI 在生成组件时直接使用当前活跃页面（activeFlowNode）的 `nodeId` 作为 `flowId`，从源头消除匹配问题。

---

## 详细设计

### 问题根因

AI 生成组件的 prompt 缺少以下信息：
1. 不知道当前活跃页面（activeFlowNode）的 `nodeId` 是什么
2. 不知道组件必须归属到哪个 `flowId`
3. 不知道哪些组件类型（modal/button）应该使用 `flowId='common'`

### Prompt 强化策略

在现有 AI 生成 prompt 模板中，**注入以下结构化指令**：

```markdown
## 组件归属规则

当前活跃页面:
- nodeId: {activeFlowNode.nodeId}
- 名称: {activeFlowNode.name}

**重要**: 你生成的组件必须设置 flowId 为上述 nodeId。
例如：flowId = "{activeFlowNode.nodeId}"

**通用组件规则**:
以下类型的组件 flowId 必须为 "common":
- modal / Modal
- button / Button
- tooltip / Tooltip
- dropdown / Dropdown
- badge / Badge
- icon / Icon
- avatar / Avatar
- loading / Loading / Spinner
- 任何可复用的 UI 基础组件
```

### 关键设计决策

1. **activeFlowNode 传入**
   - 由调用方（ComponentTree 或 AI 生成触发层）在请求前从 context 获取
   - 保证 prompt 中 nodeId 是当前用户所在页面的真实 nodeId

2. **flowId 显式赋值指令**
   - 避免 AI 自行推断，使用 `flowId = "{nodeId}"` 格式
   - 减少 AI 幻觉（hallucination）风险

3. **通用组件类型白名单**
   - 枚举常见 UI 基础组件类型，明确告知 AI 使用 `common`
   - 与 ComponentTree.tsx 的 `isCommonType` 逻辑保持一致

4. **fallback 策略**
   - 如果 AI 仍未返回有效 flowId，由 ComponentTree 的 `matchFlowNode()` 兜底
   - 如果 `matchFlowNode()` 也失败，组件暂时归入"未知页面"（而非崩溃）

### prompt 模板位置

假设 AI prompt 模板存放于 `src/prompts/generate-component.md` 或内联于 AI service 层。实际路径以代码库为准。

---

## API/接口

### Prompt 模板参数

```typescript
interface GenerateComponentPromptParams {
  /** 当前活跃页面的 BusinessFlowNode */
  activeFlowNode: BusinessFlowNode;
  /** 正在创建的组件类型（如 'form', 'card'） */
  componentType: string;
  /** 用户对组件的描述 */
  description: string;
  /** 通用组件类型白名单 */
  commonComponentTypes: string[];
}
```

### 模板渲染函数

```typescript
function renderGenerateComponentPrompt(params: GenerateComponentPromptParams): string {
  // 注入 flowId 归属规则
  // 返回完整 prompt 字符串
}
```

### 返回值（AI response schema）

```typescript
interface GenerateComponentResponse {
  flowId: string; // 必须是 activeFlowNode.nodeId 或 'common'
  componentType: string;
  // ... 其他字段
}
```

---

## 实现步骤

1. **定位 Prompt 模板**
   - 找到 AI 生成组件的 prompt 模板文件或内联字符串
   - 确认当前 prompt 中无 flowId 归属规则

2. **增加 flowId 归属规则段落**
   - 在模板末尾追加结构化指令
   - 参数化 `activeFlowNode.nodeId` 和 `activeFlowNode.name`

3. **增加通用组件规则段落**
   - 枚举 `commonComponentTypes` 列表
   - 说明这些类型的 flowId 必须为 "common"

4. **适配 AI service 层**
   - 修改调用 `renderGenerateComponentPrompt` 时传入 `activeFlowNode`
   - 确保 context 中可获取当前活跃页面

5. **验证 AI response**
   - 检查 response 中 flowId 是否为有效 nodeId 或 "common"
   - 如 AI 返回其他值，触发 `matchFlowNode()` 兜底

---

## 验收测试

> 引用 PRD 验收标准：AC1.1、AC1.2、AC1.3

### AC1.1: prompt 含 flowId 指令 → response 中 flowId 为有效 nodeId

```typescript
// Mock AI service 返回值
const mockAIResponse = {
  flowId: 'flow-abc-123',
  componentType: 'form',
  name: '登录表单',
};

const flowNodes = [
  { nodeId: 'flow-abc-123', name: '登录流程' },
  { nodeId: 'flow-def-456', name: '订单管理' },
];

// AC1.1: AI response 中 flowId 为有效 nodeId
const isValidNodeId = flowNodes.some(n => n.nodeId === mockAIResponse.flowId);
expect(isValidNodeId).toBe(true);

// AC1.1: flowId 来自 activeFlowNode
const activeFlowNode = flowNodes[0];
expect(mockAIResponse.flowId).toBe(activeFlowNode.nodeId);
```

### AC1.2: AI 生成后组件保存到 store → flowId 与生成时一致

```typescript
// Mock component store
const store = new ComponentStore();

// 模拟 AI 生成后保存
const component = {
  id: 'comp-001',
  flowId: 'flow-abc-123',
  name: '登录表单',
  type: 'form',
};

store.addComponent(component);

// AC1.2: 保存后组件的 flowId 与生成时一致
const saved = store.getComponent('comp-001');
expect(saved.flowId).toBe('flow-abc-123');
expect(saved.flowId).toBe(component.flowId);
```

### AC1.3: flowId='common' 时组件正确归入通用组件

```typescript
// Mock AI response 返回 common
const mockAIResponseCommon = {
  flowId: 'common',
  componentType: 'modal',
  name: '确认弹窗',
};

// AC1.3: flowId='common' 归入通用组件（不触发"未知页面"）
const isCommon = mockAIResponseCommon.flowId === 'common';
expect(isCommon).toBe(true);

// AC1.3: matchFlowNode 对 'common' 返回 null（由 ComponentTree 侧判断 isCommon）
const result = matchFlowNode('common', flowNodes);
expect(result).toBeNull();

// AC1.3: ComponentTree 侧判断 flowId === 'common' 时归入"通用组件"
const componentGroup = mockAIResponseCommon.flowId === 'common'
  ? '通用组件'
  : matchFlowNode(mockAIResponseCommon.flowId, flowNodes)?.node.name ?? '未知页面';

expect(componentGroup).toBe('通用组件');
expect(componentGroup).not.toBe('未知页面');
```

### Prompt 模板内容验证

```typescript
const prompt = renderGenerateComponentPrompt({
  activeFlowNode: { nodeId: 'flow-abc-123', name: '登录流程' },
  componentType: 'form',
  description: '创建一个登录表单',
  commonComponentTypes: ['modal', 'button', 'tooltip', 'dropdown'],
});

// AC1.1: prompt 中包含 nodeId 指令
expect(prompt).toContain('flow-abc-123');
expect(prompt).toContain('flowId');

// AC1.1: prompt 中包含通用组件规则
expect(prompt).toContain('common');
expect(prompt).toContain('modal');
expect(prompt).toContain('button');
```

---

## 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| AI 未严格遵守 prompt 指令，仍生成无效 flowId | 中 | 通过 matchFlowNode() L2/L3 兜底；定期监控 AI response 质量 |
| activeFlowNode 为空时 prompt 渲染失败 | 中 | 增加空值判断；无 activeFlowNode 时跳过 flowId 指令段落 |
| 通用组件类型白名单不全 | 中 | 与 UI 团队对齐；可配置化白名单，后续迭代 |
| AI prompt 过长导致响应质量下降 | 低 | flowId 指令控制在 5-8 行，不添加过多上下文 |
| 回归风险：改动 prompt 影响其他 AI 生成场景 | 低 | 仅修改组件生成 prompt，不影响其他 prompt 模板 |
