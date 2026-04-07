# 内联样式提取 PRD

**项目**: vibex-inline-styles-extract  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

项目前端代码中存在 **402 处** 内联样式 (`style={{}}`)，分布在 30+ 个文件中。大量重复的样式模式导致：
- 代码冗余，维护困难
- 颜色/间距不一致
- 难以实现主题切换

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 提取高频样式模式为 CSS 类
- 建立 CSS 变量系统统一颜色/间距
- 确保无内联样式回归

### 2.2 Non-Goals
- 不修改组件逻辑
- 不添加新功能
- 不涉及运行时动态样式

---

## 3. CSS 变量命名规范

### 3.1 颜色变量

| 变量名 | 值 | 用途 |
|-------|---|------|
| `--color-text-primary` | `#1e1e2e` | 主要文本 |
| `--color-text-secondary` | `#64748b` | 次要文本 |
| `--color-text-muted` | `#94a3b8` | 描述/占位文本 |
| `--color-border` | `#e2e8f0` | 边框 |
| `--color-border-light` | `#e5e5e5` | 浅边框 |
| `--color-primary` | `#0070f3` | 主色调 |
| `--color-success` | `#10b981` | 成功状态 |
| `--color-accent` | `#00d4ff` | 强调色 |
| `--color-bg-dark` | `#1e1e2e` | 深色背景 |

### 3.2 间距变量

| 变量名 | 值 | 用途 |
|-------|---|------|
| `--spacing-xs` | `4px` | 极小间距 |
| `--spacing-sm` | `8px` | 小间距 |
| `--spacing-md` | `12px` | 中间距 |
| `--spacing-lg` | `16px` | 大间距 |
| `--spacing-xl` | `24px` | 特大间距 |
| `--spacing-2xl` | `32px` | 双倍间距 |

### 3.3 圆角变量

| 变量名 | 值 | 用途 |
|-------|---|------|
| `--radius-sm` | `4px` | 小圆角 |
| `--radius-md` | `8px` | 中圆角 |
| `--radius-lg` | `12px` | 大圆角 |

---

## 4. Extraction Priority (提取优先级)

### 4.1 P0 - 立即提取 (高收益/低风险)

| # | 样式类 | 模式 | 出现次数 | 目标文件 |
|---|--------|------|---------|---------|
| P0-1 | `.text-secondary` | `color: #64748b` | 99 | 全局 |
| P0-2 | `.text-muted` | `color: #94a3b8` | 16 | 全局 |
| P0-3 | `.mb-4` | `marginBottom: 16px` | 5 | 全局 |
| P0-4 | `.mb-6` | `marginBottom: 24px` | 7 | 全局 |
| P0-5 | `.border-default` | `border: 1px solid #e2e8f0` | 10+ | 全局 |

### 4.2 P1 - 短期提取 (中收益/低风险)

| # | 样式类 | 模式 | 出现次数 | 目标文件 |
|---|--------|------|---------|---------|
| P1-1 | `.white-card` | `padding: 16px; bg: white; radius: 8px; border: 1px solid #e2e8f0` | 4 | 页面 |
| P1-2 | `.dark-card` | `background: #1e1e2e; border-radius: 8px` | 6 | 页面 |
| P1-3 | `.label-text` | `display: block; mb: 8px; fontWeight: 500` | 6 | 表单 |
| P1-4 | `.form-label` | `fontSize: 13px; color: #94a3b8; display: block; mb: 4px` | 4 | 表单 |
| P1-5 | `.flex-center` | `display: flex; align-items: center; gap: 8px` | 11+ | 布局 |
| P1-6 | `.flex-column` | `display: flex; flex-direction: column; gap: 12px` | 8+ | 布局 |

### 4.3 P2 - 中期提取 (中收益/中风险)

| # | 样式类 | 模式 | 出现次数 | 目标文件 |
|---|--------|------|---------|---------|
| P2-1 | `.input-field` | `width: 100%; padding: 12px; border: 1px solid #e5e5e5; radius: 8px` | 5 | 表单 |
| P2-2 | `.table-header` | `padding: 14px 20px; text-align: left; font-weight: 500; color: #64748b; font-size: 13px` | 4 | 表格 |
| P2-3 | `.table-cell` | `padding: 16px 20px` | 2+ | 表格 |
| P2-4 | `.centered-section` | `padding: 2rem; text-align: center` | 4 | 页面 |

---

## 5. 文件迁移计划

### 5.1 迁移优先级

| 优先级 | 文件 | 内联样式数 | 预计提取 |
|-------|------|-----------|---------|
| 1 | `app/preview/page.tsx` | 60 | 20-25 |
| 2 | `app/pagelist/page.tsx` | 55 | 18-22 |
| 3 | `app/project-settings/page.tsx` | 54 | 18-22 |
| 4 | `app/prototype/editor/page.tsx` | 42 | 12-15 |
| 5 | `app/prototype/page.tsx` | 32 | 10-12 |

### 5.2 保留内联样式的场景

以下情况**保留内联样式**，不提取：
- 动态计算样式: `style={{ width: column.width }}`
- 条件样式: `style={{ color: isActive ? '#0070f3' : '#64748b' }}`
- 动画样式: `style={{ transform: rotate(...) }}`
- 唯一样式: 仅出现 1 次的样式

---

## 6. Migration Steps

### 步骤 1: 创建 CSS 变量文件
```bash
# 创建全局样式文件
src/app/globals.css
```

### 步骤 2: 定义 CSS 变量和工具类
- 颜色变量
- 间距变量
- 圆角变量
- 通用工具类

### 步骤 3: 逐文件迁移
按优先级顺序迁移页面

### 步骤 4: 验证回归
- 视觉回归测试
- 交互功能测试

---

## 7. Definition of Done (验收标准)

### 7.1 功能验收

| # | 验收条件 | 测试方法 |
|---|---------|---------|
| DoD-1 | 提取后的页面布局与原来一致 | 视觉对比 |
| DoD-2 | 交互组件(按钮/输入框)功能正常 | 手动测试 |
| DoD-3 | 响应式布局正常工作 | 浏览器缩放测试 |
| DoD-4 | 动态样式仍能正常工作 | 检查 state/props 引用 |

### 7.2 质量验收

| # | 验收条件 | 目标值 |
|---|---------|-------|
| DoD-5 | 内联样式减少 | 从 402 减少到 ≤250 (-38%) |
| DoD-6 | 无新增编译错误 | 0 errors |
| DoD-7 | ESLint 检查通过 | 0 errors |
| DoD-8 | 设计一致性提升 | 颜色使用 95%+ 来自变量 |

### 7.3 回归测试用例

| 场景 | 预期结果 |
|------|---------|
| 首页项目卡片 | 布局/间距/颜色一致 |
| 项目设置页面 | 所有输入框样式正常 |
| 原型编辑器 | 画布布局正常 |
| 预览页面 | 图表显示正常 |
| 暗色主题区域 | 背景/文字颜色正常 |

---

## 8. Risk Mitigation

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| 样式冲突 | 🟡 中 | 使用 BEM 命名或 CSS Modules |
| 动态样式丢失 | 🟡 中 | 保留动态计算样式为内联 |
| 响应式断点不一致 | 🟢 低 | 使用已有的 Tailwind 断点 |
| 覆盖优先级问题 | 🟢 低 | CSS 层叠规则明确 |

---

## 9. Non-Functional Requirements

| 需求类型 | 要求 |
|---------|-----|
| **性能** | 不增加运行时开销 |
| **兼容性** | 兼容现有 Tailwind 配置 |
| **可维护性** | 样式类命名清晰文档化 |
| **可访问性** | 保持原有对比度 |

---

## 10. Timeline Estimate

| 阶段 | 工作量 | 说明 |
|-----|-------|------|
| CSS 变量 + 工具类 | 2h | 定义变量/工具类 |
| 页面迁移 (top 5) | 4h | 批量迁移高频文件 |
| 验证回归 | 2h | 视觉/功能测试 |
| **总计** | **8h (1 人日)** | |

---

## 11. Expected Outcome

| 指标 | 当前 | 目标 | 改善 |
|-----|------|------|------|
| 内联样式数量 | 402 | ≤250 | -38% |
| 重复样式模式 | 50+ | 0 | -100% |
| 颜色值一致性 | 60% | 95% | +35% |

---

*PRD 完成于 2026-03-05 (PM Agent)*
