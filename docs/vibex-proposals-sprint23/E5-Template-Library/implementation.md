# E5-Template-Library 实现方案

## 背景

Sprint 23 Epic E5: 需求模板库深耕

## 约束分析

| 约束 | 说明 |
|------|------|
| `useTemplateManager.ts` | **不存在，需创建** |
| `TemplateHistoryPanel` | **不存在，需创建** |
| localStorage key | `template:${templateId}:history` |
| 最多 10 个 snapshot | 超出时删除最旧 |
| data-testid | template-export-btn, template-import-btn, template-history-btn, history-item |

## 方案设计

### S5.1: useTemplateManager hook

```typescript
interface TemplateSnapshot {
  id: string;
  templateId: string;
  data: RequirementTemplate; // JSON serializable
  timestamp: number;
  label?: string;
}

interface TemplateData {
  id: string;
  name: string;
  description: string;
  items: RequirementTemplateItem[];
}

interface TemplateManagerAPI {
  exportTemplate(templateId: string): void;  // Blob download
  importTemplate(file: File): Promise<TemplateData>;  // validate JSON, throw on error
  getHistory(templateId: string): TemplateSnapshot[];  // desc order
  createSnapshot(templateId: string, label?: string): void;  // prune >10
  deleteSnapshot(templateId: string, snapshotId: string): void;
}
```

### S5.2: TemplateHistoryPanel

- 渲染 `getHistory(templateId)` 列表
- 每个 item: data-testid=history-item
- 显示 timestamp + label
- 提供 deleteSnapshot 按钮

### TemplateGallery 集成

- 添加 data-testid="template-export-btn"
- 添加 data-testid="template-import-btn" (file input)
- 添加 data-testid="template-history-btn"

## 实施步骤

1. `useTemplateManager.ts` — hook + localStorage 逻辑
2. `TemplateHistoryPanel.tsx` + CSS Module
3. `TemplateGallery.tsx` — 集成 export/import/history 按钮
4. TypeScript 验证

## 验收标准

- [ ] data-testid="template-export-btn"
- [ ] data-testid="template-import-btn"
- [ ] data-testid="template-history-btn"
- [ ] data-testid="history-item" (in history panel)
- [ ] `pnpm exec tsc --noEmit` → 0 errors
- [ ] IMPLEMENTATION_PLAN.md E5 Epic Unit 状态更新为 ✅
