# 首页布局代码草图

**项目**: vibex-homepage-layout-iteration
**角色**: Dev
**日期**: 2026-03-14

---

## 1. 当前代码结构

### 1.1 页面层级 (page.tsx)

```
page.tsx
├── ParticleBackground (粒子特效)
├── bgEffect (背景光晕)
├── navbar (导航栏 ~60px)
│   ├── logo
│   ├── navLinks (功能/价格)
│   └── ctaButton (开始使用)
├── hero (英雄区域 - 需移除)
│   ├── badge
│   ├── title + subtitle
│   └── heroCta (主要按钮组)
├── featuresSection (功能展示 - 需移除)
│   └── featuresGrid
│       └── featureCard × 4
├── mainContainer (三栏布局)
│   ├── sidebar (15%, ~180px)
│   │   ├── sidebarTitle
│   │   └── stepList (5个流程步骤)
│   ├── content (60%, flex: 1)
│   │   ├── contentInner
│   │   ├── tabContainer (输入/预览Tab)
│   │   └── inputSection / previewSection
│   └── aiPanel (25%, ~280px)
│       └── ThinkingPanel (AI思考过程)
```

### 1.2 CSS 宽度配置 (homepage.module.css)

| 组件 | 当前代码 | PRD 要求 | 差异 |
|------|----------|----------|------|
| `.sidebar` | 15% (180px min) | 15% | ✅ 一致 |
| `.content` | flex: 1 (~60%) | 70% | 🔴 -10% |
| `.aiPanel` | 25% (280px min) | 15% | 🔴 +10% |

### 1.3 关键代码位置

| 功能 | 文件位置 | 行号 |
|------|----------|------|
| Hero 区域 | page.tsx | 500-527 |
| Features 区域 | page.tsx | 528-548 |
| Sidebar | homepage.module.css | - |
| AI Panel | homepage.module.css | - |
| ThinkingPanel 引用 | page.tsx | 10, 964 |

---

## 2. 需要修改的代码

### 2.1 移除 Hero 区域 (F1.1)

**位置**: `page.tsx` 第 500-527 行

```tsx
// 需删除:
<header className={styles.hero}>
  <div className={styles.heroContent}>
    {/* badge, title, subtitle, heroCta */}
  </div>
</header>
```

**相关 CSS 类** (homepage.module.css):
- `.hero`
- `.heroContent`
- `.badge`
- `.title`
- `.subtitle`
- `.heroCta`
- `.primaryButton`
- `.secondaryButton`

### 2.2 移除 Features 区域 (F1.2)

**位置**: `page.tsx` 第 528-548 行

```tsx
// 需删除:
<section className={styles.featuresSection} id="features">
  <div className={styles.featuresGrid}>
    {/* featureCard × 4 */}
  </div>
</section>
```

**相关 CSS 类**:
- `.featuresSection`
- `.featuresGrid`
- `.featureCard`
- `.featureIcon`
- `.featureTitle`
- `.featureDesc`

### 2.3 调整 AI Panel 宽度 (F2.3)

**位置**: `homepage.module.css`

```css
/* 当前 */
.aiPanel {
  width: 25%;
  min-width: 280px;
}

/* 修改为 */
.aiPanel {
  width: 15%;
  min-width: 200px; /* 调整最小宽度 */
}
```

### 2.4 Content 区域会自动扩展

由于使用 `flex: 1`，AI Panel 宽度从 25% 调整到 15% 后，Content 会自动扩展到 70%。

---

## 3. 实施计划

| 步骤 | 任务 | 文件 | 预估工时 |
|------|------|------|----------|
| 1 | 注释掉 Hero 区域 | page.tsx | 0.1h |
| 2 | 注释掉 Features 区域 | page.tsx | 0.1h |
| 3 | 调整 AI Panel 宽度 | homepage.module.css | 0.1h |
| 4 | 验证布局 | 浏览器 | 0.2h |
| **总计** | | | **0.5h** |

---

## 4. 验收标准

| ID | 检查项 | 验证方法 |
|----|--------|----------|
| AC1 | Hero 区域已移除 | `expect(hero).not.toExist()` |
| AC2 | Features 区域已移除 | `expect(features).not.toExist()` |
| AC3 | Sidebar 保持 15% | 视觉检查 |
| AC4 | AI Panel 为 15% | 视觉检查 + DevTools |

---

**产出物**: 本文档
**审核人**: 待定
**状态**: ⏳ 待实施
