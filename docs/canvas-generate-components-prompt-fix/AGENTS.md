# 开发约束: Canvas Generate Components Prompt Fix

> **项目**: canvas-generate-components-prompt-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有行为

- **API 接口**: `generateComponentsSchema` 不变
- **ComponentNode 类型**: 不修改，只在 AI 输入侧加 flowId
- **fallback 逻辑**: 第 307 行 fallback 保留（向后兼容）

### 1.2 禁止事项

- **禁止** 在 schema 中删除现有字段（name, type, props, api）
- **禁止** 修改 API 路由的 `withValidation` 包装器
- **禁止** 在 prompt 中提及 `unknown` 作为有效值

---

## 2. 代码风格

### 2.1 Prompt 修改规范

```typescript
// ✅ 正确: 明确列出可选的 flowId
- flowId: 所属流程ID（从上述流程中选择，如 ${flows.map(f => f.id).join('|')})

// ❌ 错误: 模糊描述
- flowId: 流程ID
```

### 2.2 Schema 修改规范

```typescript
// ✅ 正确: 在 name, type 后添加
await aiService.generateJSON<Array<{
  name: string
  type: string
  flowId: string  // ✅ 新增
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>(...)

// ❌ 错误: 修改 ComponentNode 类型
```

---

## 3. 测试要求

```typescript
// generate-components.test.ts
it('should not fallback to unknown when AI provides flowId', async () => {
  const mockAIResponse = {
    data: [{ name: 'Test', type: 'card', flowId: 'flow-1', props: {}, api: {} }]
  };
  // 验证 flowId 被正确读取，不走 fallback
});
```

---

## 4. 审查清单

- [ ] `pnpm test` 全部通过
- [ ] schema 添加 `flowId: string`
- [ ] prompt 明确列出可选 flowId 值
- [ ] ComponentNode 类型未修改
- [ ] fallback 逻辑保留

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
