# Epic 6: 交互反馈标准化 — Spec

**Epic ID**: E6
**优先级**: P1
**工时**: 8h
**页面集成**: 全局组件 / 三树 / CONTRIBUTING.md

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E6-S1 | 删除 window.confirm() | 将所有 `window.confirm()` 调用替换为 toast 确认或 inline 确认；高危操作使用 modal | `expect(sourceCode.match(/window\.confirm/g)).toBeNull()`；高危操作均有 toast 或 modal | 全局搜索替换 |
| E6-S2 | 统一 dragging 状态样式 | 定义 `dragging` 状态标准样式：`opacity: 0.7; transform: scale(0.98)`；三树和 Canvas 拖拽行为一致 | `expect(draggingStyle.opacity).toBe(0.7)`；`expect(draggingStyle.transform).toContain('scale(0.98)')` | BoundedContextTree / FlowTree / ComponentTree |
| E6-S3 | Feedback Token 文档 | 创建 `docs/design-system/feedback-tokens.md`，定义所有反馈类型的 token | 文件存在且包含 loading / success / error / warning token 定义 | — |
| E6-S4 | Toast 系统接入 | 全局接入统一 toast 系统，替换散落的 alert 和 confirm | `expect(alertSpy).not.toHaveBeenCalled()`；`expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))` | 全局组件 |
| E6-S5 | UI 变更检查清单 | 在 `CONTRIBUTING.md` 添加 UI 变更 checklist（截图对比命令、reviewer 确认要求） | `CONTRIBUTING.md` 包含 UI 变更 checklist | CONTRIBUTING.md |

---

## 详细验收条件

### E6-S1: 删除 window.confirm()

- [ ] `grep -r "window.confirm" src/` 返回 0 结果
- [ ] 高危操作（如删除数据）使用 toast 确认或 inline 确认按钮
- [ ] 不使用 `alert()` 或 `window.alert()`
- [ ] 验收测试：模拟删除操作，`expect(toast).toHaveBeenCalled()`

### E6-S2: 统一 dragging 状态样式

- [ ] CSS 变量定义：`--drag-opacity: 0.7; --drag-scale: 0.98`
- [ ] 拖拽中元素应用：`opacity: var(--drag-opacity); transform: scale(var(--drag-scale))`
- [ ] 三树拖拽行为一致（ContextTree / FlowTree / ComponentTree）
- [ ] Canvas 内拖拽节点行为一致
- [ ] 验收测试：拖拽节点，`expect(draggedElement).toHaveStyle({ opacity: '0.7', transform: 'scale(0.98)' })`

### E6-S3: Feedback Token 文档

- [ ] 文件路径：`docs/design-system/feedback-tokens.md`
- [ ] 包含 token 类型：
  - `loading`（spinner / skeleton）
  - `success`（绿色 ✓ / toast）
  - `error`（红色 ✗ / toast）
  - `warning`（黄色 ⚠ / inline）
  - `info`（蓝色 ℹ / inline）
- [ ] 每个 token 包含：CSS 变量 / 使用场景 / 示例代码

### E6-S4: Toast 系统接入

- [ ] 全局安装 toast 库（如 react-hot-toast / sonner）
- [ ] 所有确认操作使用 toast 而非 browser confirm
- [ ] toast 包含 type / message / action 属性
- [ ] 验收测试：`expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))`

### E6-S5: UI 变更检查清单

- [ ] `CONTRIBUTING.md` 包含「UI 变更 checklist」章节
- [ ] checklist 包含：
  - [ ] 截图对比（变更前 / 变更后）
  - [ ] 三树截图对比（每棵树）
  - [ ] reviewer 确认签字
  - [ ] 无 CSS 冲突回归

---

## 实现注意事项

1. **渐进替换**：alert/confirm 替换不要求一次性完成，可逐文件迁移
2. **统一 toast**：选择统一的 toast 库，全局只使用一种
3. **CSS 变量**：所有样式使用 CSS 变量，便于主题切换
