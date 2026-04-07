# SPEC-005: 交互反馈标准化

**Epic**: Epic-2 / Feature-2.2
**优先级**: P1
**状态**: Draft

---

## 1. 问题描述

当前交互反馈存在不一致：
- `window.confirm()` 浏览器弹窗 (影响 UX 体验)
- `nodeUnconfirmed` 黄色边框 (与 type badge 重复)
- 拖拽状态缺失统一规范

---

## 2. 修复方案

### 2.1 消除 window.confirm()

**现状**:
```ts
// ❌ 现状
if (window.confirm('确定要删除吗？')) {
  deleteItem(id);
}
```

**目标**:
```tsx
// ✅ 目标
import { useConfirmToast } from '@/components/ui/ConfirmToast';

const { showConfirm } = useConfirmToast();
showConfirm({
  title: '确认删除',
  message: '确定要删除此项吗？此操作不可撤销。',
  onConfirm: () => deleteItem(id),
});
```

---

### 2.2 ConfirmToast 组件规范

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 确认对话框标题 |
| message | string | 是 | 确认内容描述 |
| confirmText | string | 否 | 确认按钮文字，默认"确认" |
| cancelText | string | 否 | 取消按钮文字，默认"取消" |
| variant | 'danger' \| 'warning' \| 'info' | 否 | 样式变体 |
| onConfirm | () => void | 是 | 确认回调 |
| onCancel | () => void | 否 | 取消回调 |

---

### 2.3 Feedback Token 分类

| Token | 场景 | 颜色 | 图标 |
|-------|------|------|------|
| `feedback.success` | 操作成功 | 绿色 | ✓ |
| `feedback.error` | 操作失败 | 红色 | ✗ |
| `feedback.warning` | 警告提示 | 黄色 | ⚠ |
| `feedback.loading` | 加载中 | 蓝色 | 旋转图标 |
| `feedback.confirm` | 确认对话框 | 灰色底 | ? |

---

### 2.4 拖拽状态规范

| 状态 | CSS Class | 视觉反馈 |
|------|-----------|----------|
| 拖拽开始 | `dragging` | opacity: 0.6, cursor: grabbing |
| 拖拽悬停 | `drag-over` | 边框高亮, 背景色变浅 |
| 拖拽结束 | — | 恢复默认, 无延迟 |

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 全局搜索 | 搜索 `window.confirm` | 结果为 0 |
| AC2 | 危险操作 | 用户执行删除 | 显示 toast 确认而非浏览器弹窗 |
| AC3 | 拖拽节点 | 拖拽节点 | 显示统一拖拽视觉反馈 |
| AC4 | Feedback Token 文档 | 开发查阅 | 文档完整，包含使用示例 |

---

## 4. 文件变更清单

| 文件 | 操作 |
|------|------|
| `components/ui/ConfirmToast.tsx` | 新建 |
| `hooks/useConfirmToast.ts` | 新建 |
| `styles/feedback-tokens.css` | 新建 |
| `styles/drag-tokens.css` | 新建 |
| `docs/feedback-tokens.md` | 新建 |
| (各业务文件) | 替换 `window.confirm` 调用 |
