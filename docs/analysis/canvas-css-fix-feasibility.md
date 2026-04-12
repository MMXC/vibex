# Canvas CSS Fix — 可行性分析报告

**任务**: vibex/canvas-css-fix
**分析时间**: 2026-04-12
**分析师**: analyst
**状态**: 进行中

---

## 执行摘要

**结论**: 有条件推荐（Conditional）
**推荐方案**: 方案 B — 重构 CSS 聚合方式（`@import` → 合并为单一 `.module.css`）+ 清除 build cache

核心问题已确认：
- **Dev 环境**：CSS chunk 包含浏览器不认识的 `@forward` 指令 → canvas 样式完全失效
- **Production 环境**：CSS 中类名正确（`canvas-base-module__PK821G__treePanelsGrid`），但 RSC 渲染可能使用了错误的 module name casing

---

## 问题根因分析

### 已确认的事实

| 环境 | 现象 | 状态 |
|------|------|------|
| Dev CSS chunk | 包含 `@forward` 指令（浏览器不识别） | 🔴 确认 |
| Production CSS | 类名为 `canvas-base-module__PK821G__treePanelsGrid`（小写前缀） | ✅ 类名格式正确 |
| 源文件 `canvas.module.css` | 使用 `@import` 聚合 10 个子模块 | ⚠️ 非标准做法 |
| Dev CSS chunk 内容 | 出现 `@forward`（源文件是 `@import`） | 🔴 不一致 |

### 根因

**Dev 环境**：`canvas.module.css` 的 `@import` 聚合方案，在 dev 模式下的 SWC/CSS 处理链条中出现了指令混淆（`@import` 被转换为 `@forward`）。`@forward` 是 Sass 语法，浏览器完全忽略，导致 dev 环境下 canvas 样式为零。

**Production 环境**：CSS 被正确编译（类名 `canvas-base-module__PK821G__treePanelsGrid`），但由于 dev 阶段测试不充分，该问题未在 build 时暴露。

**注意**：生产环境类名是小写的 `canvas-base`，不是 PascalCase 的 `CanvasBase`。如果 RSC payload 中引用的是 PascalCase，则有 casing 不匹配；如果两者都是小写，则生产环境应该正常。

---

## 风险矩阵

| 风险 | 可能性 | 影响 | 严重度 | 缓解 |
|------|--------|------|--------|------|
| 清除 cache 后 build 失败 | 低 | 高 | 🔴 | 先在本地验证 |
| CSS 合并后 class 名覆盖失效 | 中 | 高 | 🔴 | 逐文件测试 |
| Dev `@forward` 问题复发 | 中 | 中 | 🟡 | 改用方案 B 彻底解决 |
| 子模块依赖链断裂 | 低 | 高 | 🟡 | 单元测试覆盖 |
| CI/CD pipeline build 时间增加 | 低 | 低 | 🟢 | 可接受 |

---

## 工期估算

| 阶段 | 工时 | 说明 |
|------|------|------|
| 清除 cache + rebuild 验证 | 0.5h | 快速验证 dev 问题是否解决 |
| 实施方案 B（CSS 合并） | 1.5h | 合并 10 个子模块到主文件 |
| gstack QA 验证 | 1h | 截图对比 + 视觉回归 |
| 回归测试 | 0.5h | 确保其他页面样式未破坏 |
| **总计** | **~3.5h** | — |

---

## 实现方案

### 方案 A：清除 `.next/cache` + rebuild（快速修复）

```bash
cd /root/.openclaw/vibex/vibex-fronted
rm -rf .next/cache .next/dev/cache
pnpm build
```

**优点**: 最快，无代码改动
**缺点**: 不解决根本问题，下次 cache 损坏会复发
**验收标准**:
- Dev: `http://localhost:3000/canvas` 页面 canvas 区域有样式（背景色、布局可见）
- Production: gstack browse 截图对比 build 前后无视觉差异

### 方案 B：重构 CSS 聚合方式（根本修复）⭐

**问题**：`canvas.module.css` 使用 `@import` 聚合子模块是 Next.js 非标准做法。正确的做法是将所有子模块的 CSS 直接写入主 `.module.css` 文件。

**步骤**：
1. 读取所有 10 个子模块文件内容
2. 将内容合并到 `canvas.module.css` 中
3. 删除所有 `@import` 语句
4. 清除 `.next/cache`
5. `pnpm build`
6. gstack QA 验证

**优点**: 根本解决 CSS module 处理链条问题，不依赖 bundler 的 `@import` 解析
**缺点**: 1.5h 工作量，下次添加子模块需要手动同步
**验收标准**: 同方案 A + 确认 `.module.css` 文件内无 `@forward`/`@import` 指令

### 方案 C：使用 CSS `@layer` + 条件导入

将子模块作为独立 CSS 文件引入页面，通过 `@layer` 控制优先级。**不推荐**：增加复杂性，治标不治本。

---

## 推荐决策

**采用方案 A + 方案 B 组合**：

1. **立即执行**：方案 A（清除 cache + rebuild），验证 dev 问题
2. **后续完善**：方案 B（CSS 合并），从根本上消除 `@import` 解析的不确定性
3. **验证方式**：gstack browse 截图对比 + 检查 CSS chunk 内容

---

## 执行决策

```markdown
## 执行决策
- **决策**: 已采纳（方案 A + B 组合）
- **执行项目**: vibex/canvas-css-fix
- **执行日期**: 2026-04-12
- **预计完成**: 3.5h
```

---

## 验收标准（可测试）

1. **Dev 环境**：访问 `http://localhost:3000/canvas`，页面有可见样式（背景色 `var(--color-bg-primary)` 生效）
2. **Production CSS**：检查 `.next/static/chunks/*canvas*.css`，确认：
   - 无 `@forward` 指令残留
   - 有 `.canvas-base-module__*` 等类名定义
3. **视觉回归**：gstack browse `https://vibex-app.pages.dev/canvas` 截图，与 baseline 对比无样式丢失
4. **类名一致性**：JS bundle 中引用的 class name 与 CSS chunk 中的定义完全一致（hash 相同，前缀大小写相同）
