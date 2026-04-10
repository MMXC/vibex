# PRD: VibeX Sprint 2026-04-13 — JSON渲染风格适配 + 自定义组件主题系统

**项目**: vibex-proposals-20260413
**Agent**: pm
**日期**: 2026-04-10
**版本**: rev 1

---

## 1. 执行摘要

### 背景

VibeX 前端使用赛博青（#00ffff）+ 玻璃态 + 霓虹发光的深色设计系统，所有 CSS 变量集中定义在 `design-tokens.css`。然而 `JsonTreeRenderer` 组件引入时沿用了组件默认的浅色主题（#fafafa 背景），导致 Canvas 页面出现明显的"风格断层"——组件区域浅色背景、硬编码 hex 颜色，与周围深色玻璃态 UI 格格不入。

更深层的问题是：各组件独立维护 CSS，design token 硬编码重复，缺乏组件级的样式复用机制。`JsonTreeRenderer` 的风格孤岛问题只是更大问题的表象。

### 目标

| 目标 | 指标 |
|------|------|
| JsonTreeRenderer 风格对齐 VibeX 深色主题 | 0 个硬编码 hex 颜色残留 |
| 建立统一的 theme-utilities 工具层 | ≥10 个可复用工具类 |
| 组件样式代码量精简 | CSS 行数减少 ≥ 30% |
| 接入主题层后组件跟随设计系统变更 | design-tokens.css 修改变量后自动生效 |

### 成功指标

- [ ] `JsonTreeRenderer` 深色主题 QA 截图验证通过
- [ ] `theme-utilities.css` 包含 ≥10 个工具类
- [ ] `JsonTreeRenderer.module.css` CSS 行数减少 ≥ 30%（基线: 213 行，目标: ≤149 行）
- [ ] 至少 1 个其他组件（ComponentTree）接入主题层
- [ ] 无浅色背景、硬编码背景色残留

---

## 2. Epic 拆分

### Epic: P001 — JsonTreeRenderer 风格适配 VibeX Design Tokens

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 渲染器容器背景改用玻璃态 | 0.5h | 背景色使用 `var(--color-bg-glass)`，含 `backdrop-filter: blur(12px)` |
| S1.2 | 工具栏和搜索栏改用深色玻璃态 | 0.5h | 工具栏使用 `var(--color-bg-elevated)` + `border-bottom` |
| S1.3 | JSON 类型值颜色改为 neon 色系 | 0.3h | string=var(--color-green), number=var(--color-primary), boolean=var(--color-accent), null=var(--color-text-muted) |
| S1.4 | 行悬停/选中状态添加 neon glow | 0.3h | 悬停: `var(--color-bg-tertiary)` + 左侧 neon 边框; 选中: `var(--color-primary-muted)` + `border-left: 2px solid var(--color-primary)` |
| S1.5 | 搜索高亮和空状态风格统一 | 0.2h | 高亮: `var(--color-accent-muted)`; 空状态图标为代码风格 `{}` |
| S1.6 | 工具按钮样式对齐 | 0.2h | 按钮使用 `var(--color-bg-secondary)` + `var(--color-border)` + hover glow |

### Epic: P002 — 自定义组件统一主题层

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S2.1 | 创建 `theme-utilities.css` 工具层 | 1h | 文件位于 `src/styles/theme-utilities.css`，导出 ≥10 个工具类 |
| S2.2 | 定义玻璃态容器工具类 | 0.3h | `.vx-glass`: `background: var(--color-bg-glass)` + `backdrop-filter: blur(12px)` + border |
| S2.3 | 定义霓虹悬停工具类 | 0.3h | `.vx-neon-hover`: hover 时 `border-color: var(--color-primary)` + `box-shadow: var(--shadow-glow-cyan)` |
| S2.4 | 定义工具栏/搜索行工具类 | 0.3h | `.vx-toolbar` + `.vx-search` + `.vx-row-hover` |
| S2.5 | JsonTreeRenderer 接入主题层（重构） | 1h | `JsonTreeRenderer.module.css` 引用 `theme-utilities.css` 工具类 |
| S2.6 | ComponentTree 接入主题层（示范） | 1h | 至少 3 个样式类从硬编码迁移到 `theme-utilities.css` |

---

## 3. 验收标准（expect() 断言）

### P001 — JsonTreeRenderer 风格适配

**S1.1 — 渲染器容器背景**
```js
// JsonTreeRenderer 在深色模式下渲染
expect(container.querySelector('.renderer')).toBeTruthy();
// 容器背景为玻璃态（半透明深色 + 模糊）
const bg = getComputedStyle(container.querySelector('.renderer')).background;
expect(bg).toMatch(/rgba\(18,\s*18,\s*26/); // var(--color-bg-glass) ≈ rgba(18,18,26,0.88)
// backdrop-filter blur 生效
expect(getComputedStyle(container.querySelector('.renderer')).backdropFilter).toBe('blur(12px)');
```

**S1.2 — 工具栏和搜索栏**
```js
// 工具栏背景为 elevated 层级色
expect(getComputedStyle(toolbar).backgroundColor).not.toBe('#f3f4f6');
// 搜索栏不使用白色背景
expect(getComputedStyle(searchBar).backgroundColor).not.toMatch(/255,\s*255,\s*255/);
// 工具栏底部有边框
expect(getComputedStyle(toolbar).borderBottomWidth).not.toBe('0px');
```

**S1.3 — JSON 类型值颜色**
```js
const stringEl = container.querySelector('.string');
const numberEl = container.querySelector('.number');
const boolEl = container.querySelector('.boolean');
const nullEl = container.querySelector('.null');
expect(stringEl?.style.color || getComputedStyle(stringEl).color).toMatch(/rgba?\(0,\s*255,\s*136/); // green
expect(numberEl?.style.color || getComputedStyle(numberEl).color).toMatch(/rgba?\(0,\s*255,\s*255/); // cyan
expect(boolEl?.style.color || getComputedStyle(boolEl).color).toMatch(/rgba?\(139,\s*92,\s*246/); // purple
expect(nullEl?.style.color || getComputedStyle(nullEl).color).not.toMatch(/255/); // not white
```

**S1.4 — 悬停和选中状态**
```js
// 悬停行有 neon 左边框
fireEvent.mouseEnter(row);
expect(getComputedStyle(row).boxShadow).toMatch(/rgba\(0,\s*255,\s*255/);
// 选中行有主色左边框
expect(getComputedStyle(selectedRow).borderLeftColor).toMatch(/rgba?\(0,\s*255,\s*255/);
```

**S1.5 — 搜索高亮和空状态**
```js
// 搜索匹配行高亮色为 accent muted
const matchRow = container.querySelector('.rowMatch');
expect(getComputedStyle(matchRow).backgroundColor).not.toMatch(/254,\s*249,\s*195/); // not #fef9c3
// 空状态不使用浅色背景
const emptyEl = container.querySelector('.empty');
expect(getComputedStyle(emptyEl).backgroundColor).not.toMatch(/250,\s*250,\s*250/);
```

**S1.6 — 工具按钮样式**
```js
// 按钮不使用白色背景
expect(getComputedStyle(btn).backgroundColor).not.toMatch(/255,\s*255,\s*255/);
// 按钮有边框
expect(getComputedStyle(btn).borderWidth).not.toBe('0px');
```

### P002 — 自定义组件统一主题层

**S2.1 — theme-utilities.css 存在且可用**
```js
// 文件存在
const themeUtils = fs.readFileSync('src/styles/theme-utilities.css', 'utf8');
// 至少 10 个工具类
const classMatches = themeUtils.match(/\.[a-z][\w-]*\s*\{/g) || [];
expect(classMatches.length).toBeGreaterThanOrEqual(10);
```

**S2.2 — 玻璃态工具类**
```js
expect(themeUtils).toMatch(/\.vx-glass\s*\{/);
expect(themeUtils).toMatch(/var\(--color-bg-glass\)/);
expect(themeUtils).toMatch(/backdrop-filter:\s*blur\(12px\)/);
```

**S2.3 — 霓虹悬停工具类**
```js
expect(themeUtils).toMatch(/\.vx-neon-hover\s*\{/);
expect(themeUtils).toMatch(/var\(--color-primary\)/);
expect(themeUtils).toMatch(/var\(--shadow-glow-cyan\)/);
```

**S2.5 — JsonTreeRenderer 接入主题层**
```js
// CSS 行数减少 ≥ 30%
const css = fs.readFileSync('src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css', 'utf8');
const lineCount = css.split('\n').filter(l => l.trim().length > 0).length;
expect(lineCount).toBeLessThanOrEqual(149); // 213 * 0.7 ≈ 149
// 无硬编码背景色残留（#fafafa, #f3f4f6, white）
expect(css).not.toMatch(/#[fafaf9]{6}/i);
expect(css).not.toMatch(/#[f3f]{6}/i);
expect(css).not.toMatch(/background:\s*white/i);
```

**S2.6 — ComponentTree 接入主题层**
```js
// ComponentTree CSS 中引用了 theme-utilities
const ctCss = fs.readFileSync('src/components/canvas/ComponentTree.module.css', 'utf8');
// 至少 3 个样式迁移到工具类
const migrated = ['.vx-glass', '.vx-toolbar', '.vx-row-hover'].filter(c => ctCss.includes(c));
expect(migrated.length).toBeGreaterThanOrEqual(1); // 至少接入 1 个作为示范
```

---

## 4. 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 玻璃态渲染器容器 | JsonTreeRenderer 容器背景改为半透明深色 + blur | expect(backdropFilter).toBe('blur(12px)') | 【需页面集成】Canvas 页面 |
| F1.2 | 深色工具栏/搜索栏 | 工具栏和搜索栏使用 elevated 背景色 | 工具栏无 #f3f4f6 残留 | 【需页面集成】Canvas 页面 |
| F1.3 | JSON 类型 neon 色系 | string=green, number=cyan, boolean=purple | 每种类型颜色符合预期 | 【需页面集成】Canvas 页面 |
| F1.4 | 行悬停/选中 neon glow | 悬停行有左侧 neon 边框，选中行有主色强调 | hover 有 rgba(0,255,255) glow | 【需页面集成】Canvas 页面 |
| F1.5 | 搜索高亮和空状态 | 搜索匹配行和空状态使用深色系风格 | 不含 #fef9c3 / #fafafa 浅色残留 | 【需页面集成】Canvas 页面 |
| F1.6 | 工具按钮深色化 | 工具栏按钮使用深色背景和边框 | 无 white 背景残留 | 【需页面集成】Canvas 页面 |
| F2.1 | theme-utilities.css 创建 | 新建工具层文件，≥10 个工具类 | ≥10 个 CSS 类定义 | 无（纯 CSS 文件） |
| F2.2 | 玻璃态工具类 .vx-glass | 通用玻璃态容器样式 | backdrop-filter + border | 无 |
| F2.3 | 霓虹悬停工具类 .vx-neon-hover | 悬停时触发 neon glow 边框 | hover 时有 primary glow | 无 |
| F2.4 | 工具栏/搜索行工具类 | .vx-toolbar / .vx-search / .vx-row-hover | 3 个类均存在 | 无 |
| F2.5 | JsonTreeRenderer 重构接入 | 组件 CSS 引用工具类，CSS 行数减少 ≥ 30% | 行数 ≤149，无硬编码 hex | 【需页面集成】Canvas 页面 |
| F2.6 | ComponentTree 示范接入 | ComponentTree 接入主题层 ≥1 个工具类 | 接入至少 1 个工具类 | 【需页面集成】Canvas 页面 |

---

## 5. Definition of Done (DoD)

### P001 — JsonTreeRenderer 风格适配

- [ ] `JsonTreeRenderer.module.css` 中 0 个硬编码 hex 背景色残留（#fafafa, #f3f4f6, #dbeafe, #fef9c3, white）
- [ ] 容器使用 `var(--color-bg-glass)` + `backdrop-filter: blur(12px)`
- [ ] JSON 类型值（string/number/boolean/null）颜色使用 design token
- [ ] 行悬停有 neon glow 反馈（box-shadow 或 border）
- [ ] 行选中状态有主色强调边框
- [ ] 工具栏和搜索栏使用深色背景（无 white/浅色）
- [ ] QA 截图验证：Canvas 页面 JSON 可视化区域与周围 UI 风格统一

### P002 — 自定义组件统一主题层

- [ ] `src/styles/theme-utilities.css` 已创建，包含 ≥10 个工具类
- [ ] 工具类命名使用 `vx-` 前缀，无命名空间污染
- [ ] `.vx-glass` 包含玻璃态三要素：半透明背景 + blur + 边框
- [ ] `.vx-neon-hover` hover 时触发 neon 发光效果
- [ ] `JsonTreeRenderer.module.css` 行数减少 ≥ 30%（基线 213 行）
- [ ] `JsonTreeRenderer.module.css` 引用了 `theme-utilities.css` 中的类
- [ ] `ComponentTree` 至少接入 1 个工具类作为示范
- [ ] Design token 修改变量后，接入组件自动跟随（无需手动改组件 CSS）

### 通用 DoD

- [ ] 所有改动通过 CI（lint + test）
- [ ] PR 包含截图对比（before/after）
- [ ] 变更文件不超过 5 个核心文件（避免范围蔓延）
- [ ] 不破坏现有功能（现有测试全部通过）

---

## 6. 依赖关系

```
analysis.md (上游: analyst)
    ↓
prd.md (本文件: pm)
    ↓
specs/ (并行: pm 产出)
    ↓
实施 (dev)
    ↓
QA 截图验证 (tester)
    ↓
上线
```

**关键依赖**:
- `design-tokens.css` 必须已存在且变量完整（本项目已确认存在）
- Canvas 页面必须已集成 JsonTreeRenderer 组件
- ComponentTree 组件 CSS 文件路径已知

**无外部依赖**，纯前端 CSS 改动，风险可控。

---

## 7. 实施计划

| 阶段 | 内容 | 负责 | 预计工时 |
|------|------|------|----------|
| Sprint Day 1 AM | 创建 `theme-utilities.css`（S2.1-S2.4） | dev | 2h |
| Sprint Day 1 PM | JsonTreeRenderer 风格适配 + 接入主题层（S1.1-S1.6, S2.5） | dev | 2.5h |
| Sprint Day 2 | ComponentTree 示范接入（S2.6）+ QA 截图验证 | dev + tester | 2h |

**总工时**: 约 1.5 人日（6.5h）

---

## 8. 关联文档

- 上游提案: `/root/.openclaw/vibex/proposals/20260410/analyst.md`
- Design Tokens: `/root/.openclaw/vibex/vibex-fronted/src/styles/design-tokens.css`
- JsonTreeRenderer CSS: `/root/.openclaw/vibex/vibex-fronted/src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.module.css`
- 已有 PRD 框架: `/root/.openclaw/vibex/docs/vibex-proposals-20260413/prd.md`
- Specs 目录: `/root/.openclaw/vibex/docs/vibex-proposals-20260413/specs/`
