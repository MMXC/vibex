# E1: flowId 字段修复 - 详细规格

## S1.1 flowId schema + prompt 修复

### 目标
在 AI schema 和 prompt 中添加 flowId 字段，确保 AI 输出包含正确的 flowId。

### 现状问题
```typescript
// 问题：schema 缺少 flowId
const componentResult = await aiService.generateJSON<Array<{
  name: string
  type: string
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>(componentPrompt, ...)

// 问题：prompt 未要求 flowId
// 每个组件需包含：name, type, props, api
// 缺少：flowId（明确告诉 AI 每个组件属于哪个 flow）
```

### 实施方案
```typescript
// 1. 修改 schema
const componentResult = await aiService.generateJSON<Array<{
  name: string
  type: string
  flowId: string  // ✅ 新增
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>(componentPrompt, ...)

// 2. 修改 prompt
const componentPrompt = `基于以下业务流程，生成组件树节点。

业务流程：${flowSummary}
步骤：${steps.map(s => `- ${s.name}`).join('\n')}

每个组件需包含：
- name: 组件名（名词短语）
- type: 类型（button|form|table|card|modal|input|list|navigation）
- flowId: 所属流程ID（从上述流程中选择，如 ${flows.map(f => f.id).join('|')}）  // ✅ 新增
- props: 默认属性
- api: 接口（如有）

重要：每个组件必须标注正确的 flowId，不能留空或使用 unknown。`;
```

### 验收断言
```typescript
// __tests__/generate-components.test.ts

describe('flowId in AI response', () => {
  it('should include flowId in component schema', () => {
    const mockAiResponse = {
      data: [
        { name: 'OrderCard', type: 'card', flowId: 'flow-1', props: {}, api: {} },
        { name: 'PayButton', type: 'button', flowId: 'flow-1', props: {}, api: {} }
      ]
    };
    
    expect(mockAiResponse.data[0]).toHaveProperty('flowId');
    expect(mockAiResponse.data[0].flowId).toMatch(/^flow-/);
  });

  it('should not fallback to unknown', async () => {
    const components = await generateComponents(flows, steps);
    
    components.forEach(comp => {
      expect(comp.flowId).not.toBe('unknown');
      expect(comp.flowId).toMatch(/^flow-/);
    });
  });
});
```

### DoD Checklist
- [ ] schema 包含 `flowId: string`
- [ ] prompt 明确要求 flowId
- [ ] jest 测试通过
