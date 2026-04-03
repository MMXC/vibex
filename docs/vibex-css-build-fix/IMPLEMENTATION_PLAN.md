# VibeX CSS Build Fix — 实施计划

**项目**: vibex-css-build-fix
**版本**: v1.0
**日期**: 2026-04-04

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-04

---

## 1. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 | E1 修复 CSS 孤立属性 | 0.5h | 构建通过 |
| Sprint 1 | E2 stylelint 集成 | 1h | CI 防护 |
| Sprint 1 | E3 批量扫描 | 1h | 全局清洁 |

**总工时**: 2.5h

---

## 2. 开发约束

### 修复约束
- 修复作为单独 commit：`fix: remove orphan CSS property in dashboard.module.css`
- 删除前记录上下文（截图/行号）
- 修复后立即 `npm run build` 验证

### stylelint 配置约束
- 配置 `no-invalid-position-declaration` 规则检测孤立属性
- 忽略 `*.min.css` 文件
- CI 中 stylelint 失败时阻断构建

---

## 3. 验证命令

```bash
# E1: 确认孤立属性存在
rg -n '^\s{2,}[a-z-]+\s*:' src/app/dashboard/dashboard.module.css

# E1: 修复后验证构建
cd vibex-fronted && npm run build
# 期望: exit code = 0

# E3: 批量扫描

## 实施结果

- **脚本**: `scripts/scan-orphaned-css.js`
- **命令**: `pnpm run scan:css`
- **扫描文件数**: 209 个 .module.css 文件
- **发现孤立属性数**: 0（所有文件已修复）
- **过滤误报**: `@keyframes`, `@supports`, `@media`, `@container`, `@layer` 内的属性不报错

```bash
pnpm run scan:css
# ✅ No orphaned CSS properties found in 209 files.
```

## 验证结果

- [x] 脚本存在且可执行
- [x] 批量扫描 209 个 .module.css 文件
- [x] 过滤 @keyframes 等误报
- [x] 发现 0 个孤立属性（E1/E2 修复已完成）

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-04*
