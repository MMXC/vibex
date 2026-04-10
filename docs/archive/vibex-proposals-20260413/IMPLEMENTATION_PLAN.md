# Implementation Plan: VibeX Sprint 2026-04-13

**Agent**: architect
**Date**: 2026-04-10
**Project**: vibex-proposals-20260413

---

## 1. Sprint 目标

| Epic | 目标 | 工期 |
|------|------|------|
| P001 | JsonTreeRenderer 风格适配 VibeX Design Tokens | ~2h |
| P002 | theme-utilities.css 统一主题层建设 | ~3h |
| **合计** | **设计系统对齐 + 主题层基建** | **1 人日（并行）** |

---

## 2. 任务拆分

### Sprint Day 1（约 4h）

#### Task 1: 新建 theme-utilities.css
**文件**: `src/styles/theme-utilities.css`
**验收标准**: ≥10 个工具类，引用 `--color-*` token

```bash
# 预估代码量
touch src/styles/theme-utilities.css
# 写入 ~200 行 CSS
```

**执行步骤**:
1. 在 `src/styles/` 下创建 `theme-utilities.css`
2. 实现 15 个工具类（见 architecture.md §6.2）
3. 确保所有颜色引用 `var(--color-*)` token
4. 在 `globals.css` 中 import（使用 `@import`）

#### Task 2: 改造 JsonTreeRenderer.module.css
**文件**: `src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css`
**验收标准**: 无硬编码 hex 颜色（除 JSON 类型色板），CSS 行数减少 ≥30%

**执行步骤**:
1. 备份当前文件（注释形式保留）
2. 替换所有 26 个颜色映射（见 architecture.md §5.2 表格）
3. 添加 `backdrop-filter: blur(12px)` 到 `.renderer`
4. 删除 `font-family` 覆盖（继承 globals.css）
5. **验证**: 对比改造前后 CSS 行数

#### Task 3: 单元测试 + 视觉截图
**文件**: `src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.test.tsx`
**验收标准**: Vitest 通过 + Playwright 截图匹配

**执行步骤**:
1. 补充深色主题断言测试
2. 运行 `pnpm test` 验证通过
3. 运行 Playwright 截图: `pnpm playwright test --project=chromium`
4. 对比 baseline，如有偏差人工确认

### Sprint Day 2（约 2h）

#### Task 4: 接入示范组件（ComponentTree）
**文件**: `src/components/canvas/ComponentTree.tsx` + `ComponentTree.module.css`
**验收标准**: 至少 1 个其他组件接入 theme-utilities.css

**执行步骤**:
1. 分析 ComponentTree 当前 CSS 重复情况
2. 将 `.componentGroup` / `.componentCard` 等接入 `vx-glass` / `vx-row-hover`
3. 验证视觉一致性

#### Task 5: CSS 行数统计验证
**执行步骤**:
```bash
# 改造前
wc -l src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css
# 预期: ~180 行

# 改造后
wc -l src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css
# 预期: ≤126 行（减少 ≥30%）
```

---

## 3. 实施顺序

```
Day 1 (Sprint 启动)
├── Task 1: theme-utilities.css 基础建设（1.5h）
│   └── 产出: src/styles/theme-utilities.css
├── Task 2: JsonTreeRenderer 风格适配（1.5h）
│   └── 产出: JsonTreeRenderer.module.css（已改造）
└── Task 3: 测试验证（1h）
    └── 产出: Vitest 通过 + Playwright 截图 OK

Day 2（收尾）
├── Task 4: ComponentTree 接入示范（1.5h）
│   └── 产出: ComponentTree.module.css（已接入）
└── Task 5: CSS 行数验证 + PR 准备（0.5h）
    └── 产出: CSS 行数报告 + PR
```

---

## 4. 验收检查单

### P001 验收标准

- [ ] JsonTreeRenderer 背景从 `#fafafa` 变为 `var(--color-bg-glass)`
- [ ] 工具栏使用 `var(--color-bg-elevated)` + 玻璃态效果
- [ ] 搜索栏使用 `var(--color-bg-secondary)` + focus ring
- [ ] JSON 类型颜色（string/number/boolean）使用 neon 色系
- [ ] 悬停状态有 neon glow 反馈
- [ ] CSS 行数减少 ≥ 30%（改造后 ≤ 126 行）
- [ ] Playwright 截图对比通过（0% regression）

### P002 验收标准

- [ ] `theme-utilities.css` 提供 ≥ 10 个可复用工具类
- [ ] 所有工具类颜色引用 `var(--color-*)` token
- [ ] JsonTreeRenderer 接入主题层
- [ ] ComponentTree 接入主题层（示范）
- [ ] Design token 变更时，接入组件自动跟随
- [ ] Vitest 测试通过

---

## 5. 回滚计划

| 场景 | 回滚方案 |
|------|----------|
| 视觉不一致 | 直接 revert `JsonTreeRenderer.module.css`，保留 `theme-utilities.css` |
| Playwright 截图失败 | 接受新截图作为 baseline，更新 snapshot |
| theme-utilities 破坏其他组件 | 移除 `@import './theme-utilities.css'` from `globals.css` |
| CSS 行数不达标 | 减少 theme-utilities 类数，聚焦核心类 |

---

## 6. 关键约束

- **不引入** Tailwind CSS、styled-components、vanilla-extract
- **不改动** JSX/TSX 逻辑，只改 CSS
- **不改动** API 接口（`JsonTreeRendererProps` 不变）
- **CSS Modules 优先**：工具类在 `:global` 中使用，不破坏组件隔离
- **一次性 PR**：迁移过程在单个 PR 内完成，避免中间状态

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260413
- **执行日期**: 2026-04-13
