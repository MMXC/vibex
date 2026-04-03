# 开发检查清单 - Epic 2: Sidebar + Navbar 拆分

**项目**: vibex-homepage-modular-refactor  
**任务**: impl-epic2-sidebar-navbar  
**日期**: 2026-03-15  
**Agent**: dev

---

## 验收标准检查

| ID | 功能点 | 验收标准 | 状态 |
|----|--------|----------|------|
| F2.1 | Navbar 组件 | `expect(navbar).toRender()` | ✅ |
| F2.2 | Sidebar 组件 | `expect(sidebar).toRender()` | ✅ |
| F2.3 | 导航链接 | `expect(link).toWork()` | ✅ |

---

## 详细检查

### F2.1: Navbar 组件 ✅

**文件**:
- `components/homepage/Navbar/Navbar.tsx`
- `components/homepage/Navbar/Navbar.module.css`

**Props**:
- `isAuthenticated: boolean`
- `onLoginClick: () => void`
- `title?: string`
- `className?: string`

**功能**:
- Logo 展示 (VibeX)
- 导航链接 (设计、模板)
- CTA 按钮 (开始使用/我的项目)
- 响应式布局

### F2.2: Sidebar 组件 ✅

**文件**:
- `components/homepage/Sidebar/Sidebar.tsx`
- `components/homepage/Sidebar/Sidebar.module.css`

**Props**:
- `steps: Step[]`
- `currentStep: number`
- `completedStep: number`
- `onStepClick: (step: number) => void`
- `isStepClickable?: (step: number) => boolean`
- `className?: string`

**功能**:
- 步骤列表展示 (5步流程)
- 当前步骤高亮
- 完成步骤标记 (✓)
- 进度统计
- 响应式布局

### F2.3: 导航链接 ✅

- `/confirm` → 设计页面
- `/templates` → 模板页面
- `/auth` → 登录/注册

---

## 页面集成

**文件**: `src/app/page.tsx`

**修改内容**:
1. 导入 Navbar, Sidebar 组件
2. 替换内联 nav 元素为 Navbar 组件
3. 替换内联 aside 元素为 Sidebar 组件
4. STEPS 数组添加 description 字段

**验证**: TypeScript 编译通过 ✅

---

## 产出物

- `components/homepage/Navbar/Navbar.tsx`
- `components/homepage/Navbar/Navbar.module.css`
- `components/homepage/Sidebar/Sidebar.tsx`
- `components/homepage/Sidebar/Sidebar.module.css`
- `src/app/page.tsx` (已集成)

---

## 备注

- Navbar 和 Sidebar 已从 page.tsx 拆分为独立组件
- 样式使用 CSS Modules，支持响应式
- 导航链接功能保持正常
- 下一任务: impl-epic3-preview-input