# Epic 1 Spec: 需求输入质量提升

## S1.1: AI 智能补全（5h）

### 方案设计
基于关键词实时检测 + 多轮澄清追问。

### 实现步骤
1. 在需求输入框添加 `useKeywordDetector` Hook
2. 检测到关键词（实体名/动词/业务术语）时触发追问
3. 多轮澄清历史存储在 `clarificationHistory` 状态
4. 澄清完成后调用 AI 生成

### 触发条件
- 输入 ≥ 50 字且含模糊词（如"订单"、"用户"等）
- 或 AI 置信度 < 0.6

### 澄清 UI
- 输入框下方弹出追问气泡
- 历史可折叠（不影响输入视线）
- 追问响应时间 < 1s

### 验收断言
```typescript
expect(keywordDetector.detect('我要做个电商')).toBeTruthy()
expect(clarifyResponseTime).toBeLessThan(1000)
expect(triggerRate).toBeGreaterThan(0.8)
```

---

## S1.2: 项目搜索过滤（3h）

### 方案设计
前端索引搜索 + 按时间/状态过滤。

### 实现步骤
1. Dashboard 添加全局搜索栏（`useDebounce` 300ms）
2. 支持按名称模糊匹配
3. 过滤选项：时间（最近 7 天/30 天/全部）、状态（草稿/完成）
4. 搜索结果实时更新

### 验收断言
```typescript
expect(searchResponseTime).toBeLessThan(200)
expect(filterByName('proj')).toMatchObject(expected)
expect(debounce300ms).toUpdateResults()
```

---

## S1.3: flowId E2E 验证（2h）

### 方案设计
补充 Playwright E2E 测试验证 flowId 关联正确。

### 实现步骤
1. 创建 `tests/e2e/generate-components-flowid.test.ts`
2. 验证生成的组件关联到正确的 Flow 节点
3. 验证 ComponentRegistry 包含 HMR 支持

### 验收断言
```typescript
expect(flowIdE2E.test.ts).toPass()
expect(ComponentRegistry.get(flowId)).toBeDefined()
expect(newComponent.hmr.reload).toBe(true)
```

---

*Epic 1 Spec — VibeX PM Proposals 2026-04-11*
