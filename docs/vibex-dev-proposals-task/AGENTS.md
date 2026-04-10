# AGENTS.md — 开发约束

**项目**: vibex-dev-proposals-task
**角色**: Architect
**日期**: 2026-04-11

---

## 1. 代码规范

### 1.1 CSS Module 规范（Epic 1 & 2）

**强制规则**:
- ✅ 使用 CSS Module 替代内联 `style={{...}}`
- ✅ 所有颜色值使用 CSS 变量（`var(--color-*)`）
- ✅ 组件样式文件命名: `*.module.css`
- ✅ 类名命名: kebab-case（`auth-form`, `preview-container`）
- ❌ 禁止 `style={{...}}` 在 Auth/Preview 页面新增内联样式

**CSS 变量规范**:
```css
/* 必须在 globals.css 中定义的设计 token */
:root {
  --color-primary: #00d4d4;
  --color-primary-hover: #00e5e5;
  --color-surface: #ffffff;
  --color-surface-elevated: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
}
```

### 1.2 renderer 重构规范（Epic 3）

**强制规则**:
- ✅ 5 个子模块职责单一：types/style-utils/component-renderers/theme-resolver/main-renderer
- ✅ 保留原 `renderer.ts` 作为备份，直到新模块验证通过
- ✅ 每个子模块必须有独立 Vitest 测试
- ❌ 禁止循环依赖（用 `madge --circular` 检测）
- ❌ 禁止在拆分过程中修改渲染逻辑，只做拆分

### 1.3 Canvas 拆分规范（Epic 4）

**强制规则**:
- ✅ CanvasPage.tsx 职责: 状态编排 + props 分发，≤ 150 行
- ✅ 子组件各自独立: CanvasLayout/CanvasHeader/CanvasPanels
- ✅ 样式迁移同步进行，每个子组件有独立 `*.module.css`
- ❌ 禁止在 CanvasPage.tsx 中新增业务逻辑

### 1.4 Store 规范（Epic 5）

**强制规则**:
- ✅ 新增 store 必须先建文档，再写代码
- ✅ 职责矩阵定义: 根 stores（全局状态）vs canvas/stores（画布局部状态）
- ❌ 禁止新增与现有 store 功能重复的 store

---

## 2. 变更范围约束

**允许操作**:
- ✅ 修改/新建 `*.module.css` 文件
- ✅ 提取子组件（CanvasLayout/CanvasHeader/CanvasPanels）
- ✅ 拆分 renderer 子模块
- ✅ 创建 Store 架构文档
- ✅ 更新 README / ESLINT_EXEMPTIONS.md

**禁止操作**:
- ❌ 在 Auth/Preview 页面新增 `style={{...}}`
- ❌ 修改业务逻辑（只做拆分和迁移）
- ❌ 删除 renderer.ts 直到新模块验证通过
- ❌ 修改 API 接口或数据模型
- ❌ 修改认证/授权逻辑

---

## 3. 质量门槛

| Epic | 验收项 | 门槛 |
|------|--------|------|
| Epic 1 | 内联样式残留 | 0 处 |
| Epic 2 | 内联样式残留 | 0 处 |
| Epic 3 | renderer 行数 | < 600 行（原 2175 行）|
| Epic 3 | Vitest 覆盖率 | ≥ 70% |
| Epic 4 | CanvasPage.tsx 行数 | ≤ 150 行（原 723 行）|
| Epic 5 | Store 重复 | 0 对 |
| 全项目 | pnpm build | 退出码 0 |
| 全项目 | Vitest 测试 | 全通过 |

---

## 4. 审查要求

### 提交前检查清单

```bash
# Epic 1/2
grep -rn "style={{" vibex-fronted/src/app/auth/ --include="*.tsx"
grep -rn "style={{" vibex-fronted/src/app/preview/ --include="*.tsx"
# 两个命令均应无输出

# Epic 3
wc -l vibex-fronted/src/lib/prototypes/renderer.ts
pnpm exec madge --circular vibex-fronted/src/lib/prototypes/renderer/

# Epic 4
wc -l vibex-fronted/src/components/canvas/CanvasPage.tsx
# 应 ≤ 150 行

# 全局
cd vibex-fronted && pnpm build
cd vibex-fronted && pnpm exec vitest run
```
