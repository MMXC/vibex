# Spec: E6 - 竞品与市场分析

## 概述
建立竞品对比矩阵、用户旅程图和定价策略文档。

## F6.1: 竞品功能对比矩阵

### 规格
- 竞品: ≥ 5 个（Cursor, GitHub Copilot, Claude Code, Codeium, Amazon CodeWhisperer）
- 对比维度: 价格、模型、平台支持、离线模式、协作功能
- 数据来源: 官网定价页 + gstack browse 截图

### 验收
```typescript
expect(competitorCount).toBeGreaterThanOrEqual(5);
expect(matrix).toContain('price');
expect(matrix).toContain('model');
```

---

## F6.2: 用户旅程图

### 规格
- 关键场景: ≥ 5 个（注册 → 首次画布 → 发送 → 查看结果 → 导出）
- 工具: Mermaid journey map
- 痛点: 每个场景标注已知痛点

### 验收
```typescript
expect(keySceneCount).toBeGreaterThanOrEqual(5);
expect(scenes).toContain('first-canvas');
expect(painPoints.length).toBeGreaterThanOrEqual(3);
```

---

## F6.3: 用户细分与定价策略

### 规格
- 用户群体: ≥ 4 个（Individual, Pro, Team, Enterprise）
- 定价方案: ≥ 3 个（含免费/Pro/Enterprise）
- 付费意愿: 基于竞品数据估算

### 验收
```typescript
expect(pricingPlanCount).toBeGreaterThanOrEqual(3);
expect(plans).toContain('free');
expect(plans).toContain('pro');
```
