# Epic 7: CSS 模块拆分 — Spec

**Epic ID**: E7
**优先级**: P2
**工时**: 9h
**页面集成**: BoundedContextTree / FlowTree / ComponentTree / canvas.module.css

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E7-S1 | 提取 BoundedContextTree 样式 | 从 canvas.module.css 提取 `BoundedContextTree` 相关样式为 `BoundedContextTree.module.css` | `expect(exists('BoundedContextTree.module.css')).toBe(true)`；组件渲染正常 | BoundedContextTree.module.css |
| E7-S2 | 提取 FlowTree 样式 | 提取 FlowTree 样式为 `FlowTree.module.css` | `expect(exists('FlowTree.module.css')).toBe(true)` | FlowTree.module.css |
| E7-S3 | 提取 ComponentTree 样式 | 提取 ComponentTree 样式为 `ComponentTree.module.css` | `expect(exists('ComponentTree.module.css')).toBe(true)` | ComponentTree.module.css |
| E7-S4 | 清理 canvas.module.css | 删除已迁移样式；canvas.module.css 行数降至 < 800 行 | `expect(linesOfCode('canvas.module.css')).toBeLessThan(800)`；无样式回归 | canvas.module.css |
| E7-S5 | 视觉回归测试 | 截图对比工具集成；关键页面视觉回归测试通过 | 6 个月并行期内旧文件仍有效；无视觉回归 | 视觉回归测试 |

---

## 详细验收条件

### E7-S1: BoundedContextTree 样式提取

- [ ] `src/components/BoundedContextTree/BoundedContextTree.module.css` 存在
- [ ] 原 canvas.module.css 中 BoundedContextTree 相关样式已移除
- [ ] BoundedContextTree 组件渲染正常（无样式丢失）

### E7-S2: FlowTree 样式提取

- [ ] `src/components/FlowTree/FlowTree.module.css` 存在
- [ ] FlowTree 组件渲染正常（无样式丢失）

### E7-S3: ComponentTree 样式提取

- [ ] `src/components/ComponentTree/ComponentTree.module.css` 存在
- [ ] ComponentTree 组件渲染正常（无样式丢失）

### E7-S4: canvas.module.css 清理

- [ ] `canvas.module.css` 行数 < 800（原始 1420 行减少 40%+）
- [ ] 剩余样式仅包含 canvas 全局布局（如 flex 容器、滚动区域等）
- [ ] 无样式回归：所有组件样式正常显示

### E7-S5: 视觉回归测试

- [ ] 使用 screenshot diff 工具（如 pixelmatch / puppeteer-screenshot）
- [ ] 三树页面截图对比通过
- [ ] 6 个月并行期：旧 canvas.module.css 标记 `@deprecated`，仍可编译
- [ ] `expect(regressionRate).toBe(0)`

---

## 实现注意事项

1. **并行期**：旧文件标记 `@deprecated`，新文件生效，6 个月后删除旧文件
2. **测试覆盖**：每次样式迁移后截图对比，确保无回归
3. **组件目录结构**：CSS 文件应与组件 TSX 文件在同一目录
