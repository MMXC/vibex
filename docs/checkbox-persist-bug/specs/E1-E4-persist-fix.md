# Spec: E1-E4 - Checkbox 勾选状态持久化修复

## 1. 概述

**工时**: 3.5h | **优先级**: P0
**依赖**: 无

## 2. 修改范围

### E1: 数据结构扩展

在 JSON 数据节点中增加 `selected` 字段：
```ts
interface TreeNode {
  nodeId: string;
  name: string;
  selected?: boolean;  // 新增
  // ...
}
```

### E2: 三树勾选持久化

**BoundedContextTree**:
- 修改 onChange：勾选时更新 JSON 数据 `selected = true`
- 取消勾选时 `selected = false`
- 调用持久化方法（如有则复用现有 save 逻辑）

**ComponentTree**:
- 同上

**BusinessFlowTree**:
- 同上

### E3: Prompt 读取持久化

```ts
// 请求构造时
const selectedNodes = jsonData.nodes.filter(n => n.selected);
const prompt = selectedNodes.map(n => n.name).join(', ');
```

### E4: 一键导入恢复

```ts
// 导入解析时
const nodes = parsedJson.nodes.map(n => ({
  ...n,
  selected: n.selected ?? false,  // 默认 false
}));
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | JSON 数据 | 勾选后保存 | selected 字段存在 |
| E2-AC1 | ContextTree | 勾选 | JSON 数据更新 |
| E2-AC2 | ComponentTree | 勾选 | JSON 数据更新 |
| E2-AC3 | FlowTree | 勾选 | JSON 数据更新 |
| E3-AC1 | API 请求 | 构造 body | 只含 selected 节点 |
| E4-AC1 | 一键导入 | 导入含 selected | 勾选状态恢复 |

## 4. DoD

- [ ] selected 字段写入 JSON
- [ ] 三树勾选持久化
- [ ] Prompt 只含 selected 节点
- [ ] 导入恢复勾选状态
