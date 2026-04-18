# P1-001: ChapterPanel.tsx 使用原生 confirm() 阻塞 UI

**严重性**: P1（影响体验）
**Epic**: E1
**Spec 引用**: specs/E1-chapter-management.md

## 问题描述
`ChapterPanel.tsx` 使用原生 `confirm()` dialog，阻塞 UI 线程，体验差且无法自定义样式。

## 代码证据

```typescript
// src/components/dds/canvas/ChapterPanel.tsx 第 388 行
if (confirm('确定删除此卡片？')) {
  // ...
}
```

## 修复建议

替换为 `ConfirmationModal` 组件：
```tsx
const [confirmModal, setConfirmModal] = useState<{ onConfirm: () => void } | null>(null);
<ConfirmationModal
  open={!!confirmModal}
  title="确认删除"
  message="确定删除此卡片？"
  onConfirm={() => { confirmModal?.onConfirm(); setConfirmModal(null); }}
  onCancel={() => setConfirmModal(null)}
/>
```

## 影响范围
- `src/components/dds/canvas/ChapterPanel.tsx`
- 删除卡片交互体验
