# Implementation Plan: VibeX PM 提案

**项目**: vibex-pm-proposals-20260402_201318
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Sprint | Epic | 工时 | 优先级 | 依赖 |
|--------|------|------|--------|------|
| PM-0 | E1 + E2 | 3h | P0 | E1依赖D-E1/E2 |
| PM-1 | E3 + E4 | 5h | P1 | E3依赖D-003 |
| PM-2 | E5 + E6 | 7h | P2 | - |
| **总计** | | **15h** | | |

---

## Sprint PM-0: P0（3h）

### E1: 确认状态可视化（2h，依赖 D-E1/E2）

1. 添加 CSS `.nodeUnconfirmed`（黄色虚线边框）
2. 增强 `.nodeConfirmed`（绿色实线边框）
3. 工具栏添加筛选快捷操作
4. 导出弹窗添加"未确认将被忽略"提示

### E2: 面板状态持久化（1h，无依赖）

1. 创建 `usePanelPersistence` hook
2. localStorage 存储 `vibex-panel-collapsed`
3. 首次访问默认全部展开

---

## Sprint PM-1: P1（5h）

### E3: 导出向导（3h，依赖 D-003）

1. Step 1/2/3 向导 UI
2. 必填项红色星号
3. 进度条组件
4. 成功/失败 toast 反馈

### E4: 空状态引导（2h，无依赖）

1. `GuideCard` 组件
2. 快捷操作按钮
3. `hasData` 检测，隐藏引导

---

## Sprint PM-2: P2（7h）

### E5: 移动端降级（3h）

1. `isMobile` 检测
2. `MobileDegradedView` 组件
3. 只读预览入口

### E6: PRD 导出（4h）

1. Markdown 模板
2. Mermaid 上下文图生成
3. 飞书兼容格式

---

## 验收清单

- [ ] E1: 未确认黄色边框 + 已确认绿色边框
- [ ] E1: 工具栏筛选快捷操作
- [ ] E2: localStorage 持久化
- [ ] E2: 首次默认全部展开
- [ ] E3: Step 1/2/3 向导
- [ ] E4: 空画布引导卡片
- [ ] E5: 移动端友好提示
- [ ] E6: Markdown 导出格式
