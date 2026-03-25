# Spec: 上下文树领域关系连线

> **数据来源（已确认）**: AI分析用户需求产出初版，用户觉得不对可以增强描述



## 数据模型

```ts
interface ContextNode {
  id: string;
  name: string;
  description?: string;
  relationships: ContextRelationship[];
}

interface ContextRelationship {
  targetId: string;
  type: 'dependency' | 'aggregate' | 'calls';
  label?: string;
}
```

## SVG 渲染

- `dependency`: 实线箭头（`stroke: #666`, `stroke-width: 1`）
- `aggregate`: 粗实线箭头（`stroke: #1976d2`, `stroke-width: 2`）
- `calls`: 虚线箭头（`stroke-dasharray: 5,3`）

## 交互

- Hover 连线: 高亮 + tooltip 显示关系类型
- 点击连线: 展开关系详情面板
