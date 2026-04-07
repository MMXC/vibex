# Canvas Generate Components Prompt Fix 分析报告

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: canvas-generate-components-prompt-fix

---

## 1. 执行摘要

| 项目 | 值 |
|------|-----|
| **Bug 描述** | generate-components API prompt 丢失 `flowId` 和 `steps` 信息，导致 AI 输出 `flowId=unknown` 且组件类型全是 `navigation` |
| **严重度** | P0 — 组件树无法正确关联流程 |
| **根因** | AI 响应 schema 未包含 `flowId` 字段，prompt 也未明确要求 |
| **修复工时** | ~0.3h（改 prompt + 类型定义）|

---

## 2. 根因分析

### 2.1 问题链路

```
1. AI 收到 prompt，包含 flowSummary（flow name + step names）
2. AI 生成组件数组，但 schema 没有 flowId 字段 → AI 不知道要输出 flowId
3. 代码读取 comp.flowId → undefined
4. Fallback: flowId = flows[0]?.id || 'unknown'
5. 结果: 所有组件 flowId=unknown 或第一个 flow
```

### 2.2 关键代码

**Prompt 期望的 schema**（第 289-296 行）:
```typescript
const componentResult = await aiService.generateJSON<Array<{
  name: string
  type: string
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>(componentPrompt, ...)

// 缺少: flowId 字段!
```

**Prompt 内容**（第 269-282 行）:
```
每个组件需包含：
- name: 组件名（名词短语，如"订单卡片"、"支付按钮"）
- type: 类型（button|form|table|card|modal|input|list|navigation）
- props: 默认属性
- api: 接口

// 缺少: flowId（明确告诉 AI 每个组件属于哪个 flow）
```

**Fallback 代码**（第 306-307 行）:
```typescript
const components: ComponentNode[] = componentResult.data.map((comp) => ({
  flowId: comp.flowId || flows[0]?.id || 'unknown',  // ← fallback
  ...
}));
```

### 2.3 为什么 type 全是 navigation？

Prompt 限制 type 为 `button|form|table|card|modal|input|list|navigation`，但没有提供足够上下文让 AI 推断类型。AI 在不确定时可能默认 `navigation`。

---

## 3. 修复方案

### 方案 A：最小修复（推荐，~0.3h）

**修改 Prompt + Schema**:

```typescript
// 1. 修改 prompt，明确要求 flowId
const componentPrompt = `基于以下业务流程，生成组件树节点。

流程列表：
${flowSummary}

每个流程 → 多个组件。
每个组件需包含：
- flowId: 所属流程 ID（使用流程列表中的 ID）
- name: 组件名（名词短语）
- type: 类型（button|form|table|card|modal|input|list|navigation）
- props: 默认属性
- api: 接口 { method, path, params }

输出 JSON 数组，不要其他文字。`

// 2. 修改 AI 响应类型，添加 flowId
const componentResult = await aiService.generateJSON<Array<{
  flowId: string  // ← 新增
  name: string
  type: string
  props: Record<string, unknown>
  api: { method: string; path: string; params: string[] }
}>>(componentPrompt, ...)
```

### 方案 B：增强 Prompt 上下文（~0.5h）

在 prompt 中提供更多上下文帮助 AI 判断 type：

```
每个流程 → 多个组件。
每个组件需包含 flowId、name、type、props、api。

type 选择规则：
- 表单提交 → form
- 数据展示列表 → list
- 详情查看 → card
- 单个操作 → button
- 导航菜单/标签 → navigation
- 模态框确认 → modal
- 输入框 → input
- 表格展示 → table

flowId: 使用上面流程列表中的 ID。
```

---

## 4. 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | AI 响应包含 flowId | 检查 `comp.flowId !== undefined` |
| AC2 | 组件正确关联到流程 | 对比 flowSummary 中的 flow ID |
| AC3 | type 分布合理 | 检查生成的组件 type，多样非全 navigation |
| AC4 | API 调用正常 | Playwright 测试生成流程 |

---

## 5. 相关文件

| 文件 | 行号 | 修改 |
|------|------|------|
| `src/routes/v1/canvas/index.ts` | 269-296 | 修改 prompt + 类型定义 |

---

**结论**: 根因明确，AI schema 缺少 `flowId` 字段，导致 fallback 到 `unknown`。最小修复 0.3h。
