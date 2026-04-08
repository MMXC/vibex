# dev-E3-S1: Storybook 配置与 Chromatic CI

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E3 Storybook 组件文档化

---

## 产出

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加 chromatic |
| `.github/workflows/chromatic.yml` | 新建 | Chromatic CI |
| `docs/vibex-third/dev-E3-S1.md` | 新建 | 本文档 |

---

## 实现内容

### Storybook 配置

`.storybook/` 已存在，包含：
- `main.ts` — Storybook 构建配置
- `preview.tsx` — 全局预览配置

### Chromatic CI

`.github/workflows/chromatic.yml`：
- GitHub Actions workflow
- push 到 main 时自动构建 Storybook 并上传到 Chromatic
- PR 时进行 UI regression 检查
- `CHROMATIC_PROJECT_TOKEN` 通过 GitHub Secrets 注入

### Story 覆盖

Storybook stories 已在 `src/**/*.stories.tsx` 中存在，覆盖核心组件。

---

## 验收

- [x] chromatic 包已安装
- [x] GitHub Actions workflow 配置完成
- [x] `npm run build-storybook` 通过
- [x] docs 文档完成

---

## 关联

- E3-S1: Storybook 配置 + Chromatic CI
- E3-S2: 组件 Story 覆盖（待实现）
