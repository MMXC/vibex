# Spec: E4 - 交互反馈标准化

## 1. 概述

**工时**: 4-6h | **优先级**: P1
**依赖**: 无外部依赖

## 2. 修改范围

### 2.1 移除 window.confirm

**搜索范围**: `packages/canvas/src/`
**替换方案**: toast 确认

```tsx
// 之前
if (window.confirm('确认删除？')) {
  deleteNode(nodeId);
}

// 之后
toast({
  message: '确认删除？',
  action: { label: '删除', onClick: () => deleteNode(nodeId) },
  duration: 5000,
});
```

### 2.2 FeedbackToken 类型

**文件**: `packages/canvas/src/types/FeedbackToken.ts`（新建）

```typescript
export enum FeedbackToken {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Info = 'info',
}

export interface ToastOptions {
  type: FeedbackToken;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number; // ms，默认 3000
}
```

### 2.3 拖拽样式

```tsx
const draggingStyle = {
  opacity: 0.7,
  transform: 'scale(1.02)',
};
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E4-AC1 | 全文搜索 | packages/canvas/src | window.confirm = 0 |
| E4-AC2 | 删除操作 | 点击删除 | toast 有撤销按钮 |
| E4-AC3 | 类型检查 | FeedbackToken | 包含 success/warning/error/info |
| E4-AC4 | 拖拽元素 | 拖拽中 | opacity = 0.7, scale = 1.02 |

## 4. DoD

- [ ] window.confirm = 0
- [ ] toast 确认有撤销
- [ ] FeedbackToken 类型定义
- [ ] 拖拽样式反馈
