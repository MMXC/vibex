# Spec: E7 - 版本历史 + Diff 规格

## projectId 链路

- `projectId = null` → 显示引导 UI"请先创建项目"
- `projectId` 非法（404）→ toast 提示 + `projectId = null`
- URL `?projectId=` 参数 → 自动注入 sessionStore

## Diff 视图

```typescript
interface VersionDiff {
  added: DiffItem[];   // 绿色高亮
  removed: DiffItem[]; // 红色高亮
  modified: DiffItem[]; // 黄色高亮
}
```

## 恢复确认

- 恢复操作需要二次确认 modal
- 确认 modal 显示"将版本 X 恢复到当前？此操作不可撤销"
