# 页面风格差异分析报告

**项目**: VibeX Style Unify
**日期**: 2026-03-04
**作者**: Analyst Agent

---

## 1. 风格参照页面

### 1.1 Dashboard (`/dashboard`)
**文件**: `src/app/dashboard/dashboard.module.css`

**核心设计元素**:
- **背景**: 网格叠加层 + 发光球体 (`.gridOverlay`, `.glowOrb`)
- **配色**: CSS 变量系统 (`var(--color-primary)`, `var(--color-bg-secondary)`)
- **侧边栏**: 固定宽度 240px，玻璃态背景
- **动画**: 使用 `var(--duration-normal)` 和 `var(--ease-out-expo)`

**颜色主题**:
- 主色调: 青色 (`#00ffff` 系列)
- 背景: `#0a0a0f` 深色
- 边框: `rgba(255, 255, 255, 0.1)`

### 1.2 Project (`/project`)
**文件**: `src/app/project/project.module.css`

**核心设计元素**:
- 与 Dashboard 相同的设计语言
- 发光球体颜色为紫色 (`rgba(139, 92, 246, 0.1)`)
- 使用相同 CSS 变量系统

---

## 2. 待调整页面分析

### 2.1 注册登录页 (`/auth`)

**问题**: ❌ **完全不同的设计风格**

| 项目 | 参照页面 | 当前实现 |
|------|---------|---------|
| **样式方式** | CSS Module + 设计变量 | 内联样式 |
| **背景** | 深色 + 网格 + 发光球 | 浅灰色 `#f8f9fa` |
| **卡片** | 玻璃态 + 边框发光 | 白色 + 简单阴影 |
| **按钮** | 渐变 + 霓虹发光 | 蓝色实心 `#0070f3` |
| **输入框** | 深色 + 发光边框 | 浅色 + 灰色边框 |
| **动画** | 设计系统动画 | 无 |

**代码示例** (当前问题):
```tsx
// auth/page.tsx - 使用内联样式
<div style={{
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',  // ❌ 浅色背景
}}>
  <div style={{
    backgroundColor: 'white',   // ❌ 白色卡片
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',  // ❌ 简单阴影
  }}>
```

**需要调整**:
1. 创建 `auth.module.css` 文件
2. 应用背景特效 (`.bgEffect`, `.gridOverlay`, `.glowOrb`)
3. 使用玻璃态卡片样式
4. 使用设计变量系统
5. 添加霓虹发光效果

---

### 2.2 需求输入页 (`/confirm`)

**问题**: ⚠️ **部分风格不一致**

| 项目 | 参照页面 | 当前实现 |
|------|---------|---------|
| **背景** | 网格 + 发光球 | 渐变背景 `#1a1a2e → #16213e` |
| **卡片** | 玻璃态 | 半透明 `rgba(255, 255, 255, 0.05)` |
| **主色调** | 青色 `cyan` | 绿色 `#4ade80` |
| **设计变量** | 使用 | 未使用 |
| **动画** | 设计系统 | 简单过渡 |

**需要调整**:
1. 背景改为网格叠加层 + 发光球
2. 主色调从绿色改为青色
3. 引入设计变量系统
4. 卡片样式与 Dashboard 统一

---

### 2.3 领域模型确认界面 (`/domain`)

**问题**: ⚠️ **配色略有差异**

| 项目 | 参照页面 | 当前实现 |
|------|---------|---------|
| **背景** | 青色发光球 | 紫色发光球 |
| **主色调** | 青色 | 青色 ✅ |
| **设计变量** | 使用 | 使用 ✅ |

**需要调整**:
1. 发光球颜色统一为青色
2. 与 Dashboard 完全一致

---

## 3. 具体差异点

### 3.1 背景系统

**参照页面**:
```css
.bgEffect { position: fixed; z-index: -1; }
.gridOverlay {
  background-image: 
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
}
.glowOrb {
  background: radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%);
}
```

**Auth 页面**: ❌ 无背景特效
**Confirm 页面**: ⚠️ 使用渐变背景，无网格

### 3.2 卡片样式

**参照页面**:
```css
.card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
```

**Auth 页面**: ❌ 白色背景，无玻璃态
**Confirm 页面**: ⚠️ 半透明但无模糊效果

### 3.3 颜色变量

**参照页面使用的变量**:
- `--color-primary`: 主色调 (青色)
- `--color-bg-primary`: 主背景
- `--color-bg-secondary`: 次背景
- `--color-bg-glass`: 玻璃态背景
- `--color-border`: 边框颜色
- `--color-text-primary`: 主文字
- `--color-text-secondary`: 次文字

**Auth 页面**: ❌ 硬编码颜色值
**Confirm 页面**: ⚠️ 部分硬编码

---

## 4. 修复优先级

| 优先级 | 页面 | 问题严重程度 | 工作量 |
|--------|------|-------------|--------|
| **P0** | Auth | 完全不同风格 | 创建新 CSS Module |
| **P1** | Confirm | 部分不一致 | 修改现有 CSS |
| **P2** | Domain | 轻微差异 | 调整发光球颜色 |

---

## 5. 修复方案

### 5.1 Auth 页面改造

**步骤**:
1. 创建 `auth.module.css`
2. 复用 Dashboard 的背景系统
3. 使用设计变量
4. 添加玻璃态卡片
5. 统一按钮和输入框样式

**预估工作量**: 2-3 小时

### 5.2 Confirm 页面改造

**步骤**:
1. 替换背景为网格叠加层
2. 主色调从 `#4ade80` 改为 `var(--color-primary)`
3. 引入设计变量
4. 统一卡片样式

**预估工作量**: 1-2 小时

### 5.3 Domain 页面微调

**步骤**:
1. 发光球颜色从紫色改为青色

**预估工作量**: 15 分钟

---

## 6. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `auth/auth.module.css` | 新建 | 创建风格统一的样式文件 |
| `auth/page.tsx` | 修改 | 移除内联样式，使用 CSS Module |
| `confirm/confirm.module.css` | 修改 | 统一背景和颜色 |
| `domain/domain.module.css` | 修改 | 发光球颜色 |

---

## 7. 验收标准

### 视觉一致性
- [ ] 所有页面使用相同的背景系统
- [ ] 所有页面使用相同的主色调
- [ ] 所有卡片使用玻璃态效果
- [ ] 所有按钮使用霓虹发光效果

### 代码规范
- [ ] 所有页面使用 CSS Module
- [ ] 所有颜色使用设计变量
- [ ] 无硬编码颜色值

---

*分析完成时间: 2026-03-04 03:50*
*分析者: Analyst Agent*