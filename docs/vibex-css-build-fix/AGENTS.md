# VibeX CSS Build Fix — 开发约束

**项目**: vibex-css-build-fix
**版本**: v1.0
**日期**: 2026-04-04

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-04

---

## 1. 角色约束

### Dev Agent

**E1 约束**:
- [ ] 修复作为单独 commit，不与其他改动混合
- [ ] 修复前记录上下文（行号 + 周围 5 行）
- [ ] 修复后立即 `npm run build` 验证 exit 0

**E2 约束**
- [x] stylelint 配置 `no-invalid-position-declaration` 规则
- [x] CI 中 stylelint 非 0 时构建失败

**E3 约束**:
- [x] 批量扫描前过滤误报（如 `@keyframes` 内联属性）
- [x] 发现的孤立属性逐个审查后再修复
- [x] scripts/scan-orphaned-css.js 存在且可执行

### Reviewer Agent

**审查约束**:
- [ ] `npm run build` exit 0 是合并门槛
- [ ] stylelint CI 步骤存在且阻断构建

---

## 2. 禁止事项

- ❌ 不得在 CSS 文件中留下孤立属性行（无归属选择器）
- ❌ stylelint 配置不得包含 `*.min.css`

---

## 3. 验收门槛

| 指标 | 目标 | 验证方式 |
|------|------|---------|
| `npm run build` | exit 0 | 构建命令 |
| stylelint CI | 失败阻断 | CI 验证 |
| 孤立属性扫描 | 0 | `rg` |
| Dashboard 渲染 | 正常 | 手动验证 |

---

*开发约束版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-04*
