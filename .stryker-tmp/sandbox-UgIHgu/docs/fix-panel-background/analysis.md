# VibeX 未登录用户面板背景可见性修复 — 需求分析

**项目**: fix-panel-background  
**阶段**: analyze-requirements  
**Analyst**: analyst  
**日期**: 2026-03-31  
**状态**: ✅ 完成

---

## 1. 问题定义

### 1.1 根因分析（gstack 验证）

通过 gstack browse 访问 `https://vibex-app.pages.dev/landing` 和 `https://vibex-app.pages.dev/auth`，结合 CSS 变量审计，确认根因如下：

| CSS 变量 | 当前值 | 实际效果 |
|----------|--------|----------|
| `--color-bg-primary` | `#0a0a0f` | 页面 body 背景（几乎纯黑） |
| `--color-bg-secondary` | `#12121a` | 卡片/面板实色背景（与 primary 差异极小） |
| `--color-bg-glass` | `rgba(18, 18, 26, 0.7)` | 玻璃面板背景（70% 透明） |
| `--color-bg-tertiary` | `#1a1a24` | 次级面板背景 |

**核心问题**：`#0a0a0f` 与 `#12121a` 之间仅差 ~8 RGB 值（肉眼几乎无法区分），导致面板与背景几乎融为一体。

### 1.2 受影响场景（gstack 验证结果）

| 页面 | 元素 | 问题 | 验证方式 |
|------|------|------|----------|
| `/landing` | Hero 玻璃卡片 | `rgba(18,18,26,0.7)+blur(20px)`，70% 透明度导致底层深色背景透出 | gstack screenshot |
| `/landing` | Feature Card | `var(--color-bg-secondary)` = `#12121a`，与 body `#0a0a0f` 对比度不足 | `css` query |
| `/landing` | Code Preview textarea | `rgba(0,0,0,0.3)` 在 `#0a0a0f` body 上渲染为深灰，内容难以辨认 | gstack HTML |
| `/auth` | 玻璃卡片 + Input | `rgba(255,255,255,0.03)` 在 `#0a0a0f` 上对比度 ≈ 1.1:1（极差） | CSS 计算 |
| `/canvas` | TreePanel | `rgba(20,20,32,0.88)` 在深色 body 上偏暗 | gstack screenshot |

### 1.3 对比度计算

```
背景: #0a0a0f (luminance ≈ 0.001)
卡片: #12121a (luminance ≈ 0.003)
对比度: ~1.5:1 ← WCAG AA 要求 4.5:1（普通文本）/ 3:1（大文本）均不达标
```

---

## 2. Jobs-To-Be-Done (JTBD)

| # | JTBD | 用户故事 | 优先级 |
|---|------|----------|--------|
| JTBD-1 | **面板可读性** | 作为未登录访客，我希望能清晰区分页面上的不同面板和卡片区域（背景/内容有足够对比度），以便我理解页面结构 | P0 |
| JTBD-2 | **表单可用性** | 作为未登录访客，我希望输入框和文本区域有清晰的背景色和边框，以便我能准确输入内容 | P0 |
| JTBD-3 | **玻璃效果保留** | 作为设计师，我希望能保留玻璃拟态（glassmorphism）的美感，但同时确保内容可读 | P1 |

---

## 3. 技术方案对比

### 方案 A：调整 CSS 变量体系（推荐）

**思路**: 修改 `design-tokens.css` 中的背景色变量，从根本上提升对比度。

```css
/* 方案 A: 修改 design-tokens.css */
--color-bg-primary: #0d0d14;    /* 从 #0a0a0f 提亮到 #0d0d14 */
--color-bg-secondary: #17172a;   /* 从 #12121a 提亮到 #17172a */
--color-bg-glass: rgba(18, 18, 26, 0.85); /* 透明度从 0.7 降到 0.85 */
```

**优点**:
- 全局生效，改一处所有页面受益
- 改动最小，不破坏现有组件
- 对比度提升到 ~2.5:1（仍不完美，但显著改善）

**缺点**:
- 不能完全达到 WCAG AA 标准
- 可能影响已发布页面的外观一致性

**预估工时**: 1-2h

---

### 方案 B：增加玻璃面板不透明度

**思路**: 针对使用 `--color-bg-glass` 的面板，增加 backdrop-filter 下的不透明度。

```css
/* 方案 B: 修改 glass 变量 */
--color-bg-glass: rgba(18, 18, 26, 0.92);
--color-bg-glass-strong: rgba(18, 18, 26, 0.97);

/* 在需要的地方替换使用 */
.glass-panel {
  background: var(--color-bg-glass-strong);
  backdrop-filter: blur(20px);
}
```

**优点**:
- 精准控制，不影响 solid 背景的元素
- 保留 glassmorphism 美感

**缺点**:
- 需要遍历所有 glass 面板，手动替换
- 部分组件内联样式（`style={{background: ...}}`）无法通过 CSS 覆盖

**预估工时**: 3-5h

---

### 方案 C：引入亮色/暗色模式切换

**思路**: 为未登录用户默认使用稍亮的暗色主题，同时支持用户手动切换。

```css
/* body.dark-guest 模式 */
body.dark-guest {
  --color-bg-primary: #111118;
  --color-bg-secondary: #1a1a26;
  --color-bg-glass: rgba(26, 26, 38, 0.9);
}
```

**优点**:
- 为未登录用户提供更好的默认体验
- 可扩展为未来主题系统

**缺点**:
- 改动范围大，涉及 body 样式和主题注入逻辑
- 可能与亮色模式（`homepage.module.css` 中的 `--color-bg-primary: #ffffff`）冲突

**预估工时**: 6-8h

---

## 4. 推荐方案

**推荐方案 A（快速修复）+ B（精准调整）混合**

1. **全局调整**: 将 `--color-bg-primary` 从 `#0a0a0f` 提亮到 `#0d0d16`，`--color-bg-secondary` 提亮到 `#17172a`，同时将 `--color-bg-glass` 从 0.7 改为 0.88
2. **精准覆盖**: 对于内联 `style={{background: ...}}` 的组件（如 auth page inputs），直接在组件中调整

### 混合方案关键改动点

| 文件 | 改动内容 | 范围 |
|------|----------|------|
| `src/styles/design-tokens.css` | 全局 CSS 变量提亮 | 全局 |
| `src/app/auth/page.tsx` | input 背景 `rgba(255,255,255,0.03)` → `rgba(255,255,255,0.08)` | auth 页 |
| `src/app/landing/landing.module.css` | Feature card 可选微调 | landing 页 |

---

## 5. 技术风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 颜色调整导致亮色主题（homepage.module.css）不一致 | 中 | 亮色主题有独立变量覆盖，检查兼容性 |
| 调整影响已上线页面外观 | 中 | 通过 CSS 变量而非硬编码颜色，改动可控 |
| 部分组件内联样式无法通过 CSS 覆盖 | 低 | 手动调整组件文件（范围可控） |
| 对比度仍不满足 WCAG AA | 低 | 这是视觉增强需求，非无障碍强制要求 |

---

## 6. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | `/auth` 页面的登录表单背景与 body 背景对比度 ≥ 2:1 | CSS 计算或浏览器 DevTools Color Picker |
| AC-2 | `/landing` 页面的 Feature Card 背景与 body 背景肉眼可区分 | gstack screenshot 对比 |
| AC-3 | `/landing` 页面的 Code Preview textarea 背景不是"黑成一团" | gstack screenshot 验证 |
| AC-4 | `/canvas` 页面的 TreePanel 背景不是"黑成一团" | gstack screenshot 验证 |
| AC-5 | 改动后 `/auth` 表单输入框仍然可见和可用 | gstack snapshot 检查 input 元素 |
| AC-6 | 改动不影响已登录用户的 dashboard 页面外观 | 对比 dashboard 截图 |

---

## 7. 实施计划（初步）

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 1 | 修改 design-tokens.css 全局变量 | 1h |
| Epic 2 | 修复 auth/page.tsx 内联样式 | 1h |
| Epic 3 | 验证并修复 landing 页 | 1h |
| Epic 4 | 验证 canvas 页 | 1h |
| Epic 5 | 回归测试（auth/dashboard/landing/canvas） | 2h |

**总预估工时**: 6h（Bug fix 级别）

---

## 8. 下一步

1. **PM**: 评审并确认方案，拆分为 Story
2. **Developer**: 从 Epic 1 开始修改 design-tokens.css
3. **Tester**: 使用 gstack 截图验证修复前后对比

---

*分析文档完毕。*
