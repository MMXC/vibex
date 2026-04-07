# 代码质量自动化方案 PRD

**项目名称**: vibex-code-quality-dev  
**版本**: 1.0  
**状态**: Draft  
**创建日期**: 2026-03-06  
**目标目录**: `/root/.openclaw/vibex`

---

## 1. 项目概述

### 1.1 背景

当前 vibex 项目已配置 ESLint v9 和 eslint-config-next，但缺少代码质量自动化的完整工具链：
- **Prettier**: 代码格式化工具未安装
- **husky**: Git 钩子未配置
- **lint-staged**: 暂存文件检查未实施

这导致代码风格不统一、提交前检查缺失等问题。

### 1.2 目标

建立完整的代码质量自动化方案，实现：
1. 统一的代码格式化（Prettier）
2. 自动化的 Git 提交前检查（husky + lint-staged）
3. 与现有 ESLint 的无缝集成

---

## 2. 功能需求

### 2.1 Prettier 配置

| 需求编号 | 描述 | 优先级 |
|---------|------|--------|
| PRE-001 | 创建 `.prettierrc` 配置文件 | P0 |
| PRE-002 | 创建 `.prettierignore` 忽略文件 | P0 |
| PRE-003 | 配置 ESLint 与 Prettier 兼容（eslint-config-prettier） | P0 |
| PRE-004 | 添加 Prettier 相关 npm scripts | P1 |

### 2.2 husky Git 钩子

| 需求编号 | 描述 | 优先级 |
|---------|------|--------|
| HUSKY-001 | 安装并初始化 husky | P0 |
| HUSKY-002 | 配置 pre-commit 钩子 | P0 |
| HUSKY-003 | 配置 commit-msg 钩子（可选） | P2 |

### 2.3 lint-staged 集成

| 需求编号 | 描述 | 优先级 |
|---------|------|--------|
| LINTSTAGED-001 | 安装 lint-staged | P0 |
| LINTSTAGED-002 | 配置 package.json 中的 lint-staged | P0 |
| LINTSTAGED-003 | 设置暂存文件的检查规则（格式化+检查） | P0 |

---

## 3. 技术方案

### 3.1 工具栈

| 工具 | 版本 | 用途 |
|-----|------|------|
| Prettier | latest | 代码格式化 |
| eslint-config-prettier | latest | ESLint 与 Prettier 兼容 |
| husky | latest | Git 钩子管理 |
| lint-staged | latest | 暂存文件检查 |

### 3.2 配置文件结构

```
vibex-fronted/
├── .prettierrc           # Prettier 配置
├── .prettierignore       # Prettier 忽略文件
├── .husky/
│   └── pre-commit        # pre-commit 钩子
├── .lintstagedrc         # lint-staged 配置
├── eslint.config.mjs     # ESLint 配置（更新）
└── package.json          # 更新 scripts 和依赖
```

### 3.3 配置详情

#### 3.3.1 .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### 3.3.2 .lintstagedrc

```json
{
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{css,scss,less,md,json}": ["prettier --write"]
}
```

#### 3.3.3 pre-commit 钩子

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

## 4. 实施计划

### Phase 1: 基础配置（第1天）

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1.1 | 安装 Prettier 和 eslint-config-prettier | `package.json` 更新 |
| 1.2 | 创建 `.prettierrc` 配置文件 | 格式化规则定义 |
| 1.3 | 创建 `.prettierignore` 忽略文件 | 忽略文件清单 |
| 1.4 | 更新 ESLint 配置集成 Prettier | `eslint.config.mjs` 更新 |

### Phase 2: Git Hooks（第2天）

| 步骤 | 任务 | 产出 |
|------|------|------|
| 2.1 | 安装并初始化 husky | `.husky/` 目录 |
| 2.2 | 创建 pre-commit 钩子 | `.husky/pre-commit` |

### Phase 3: 集成（第3天）

| 步骤 | 任务 | 产出 |
|------|------|------|
| 3.1 | 安装 lint-staged | `package.json` 更新 |
| 3.2 | 配置 lint-staged 规则 | `.lintstagedrc` |
| 3.3 | 完整流程测试 | 验证通过 |

---

## 5. 验收标准

| 编号 | 验收条件 | 验证方法 |
|------|---------|---------|
| AC-001 | Prettier 配置完成且与项目代码格式兼容 | 运行 `npx prettier --check .` 无报错 |
| AC-002 | husky pre-commit 钩子正常工作 | 提交代码时自动触发检查 |
| AC-003 | lint-staged 对暂存文件执行检查 | 暂存文件被正确格式化 |
| AC-004 | ESLint 与 Prettier 无冲突 | `npm run lint` 无格式相关警告 |
| AC-005 | 本地开发流程无阻塞 | 开发体验顺畅 |
| AC-006 | CI/CD 流程包含代码质量检查 | GitHub Actions 配置更新 |

---

## 6. 风险与依赖

### 6.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| ESLint 与 Prettier 冲突 | 代码检查失败 | 使用 eslint-config-prettier |
| 钩子执行时间过长 | 开发体验下降 | 限制检查文件范围 |
| 旧代码格式不兼容 | 大量变更 | 先格式化再配置钩子 |

### 6.2 前置依赖

- ✅ ESLint v9 已安装
- ✅ eslint-config-next 16.1.6 已安装
- ✅ 项目使用 Git 管理

---

## 7. 后续计划

- **v2.0**: 添加 TypeScript 类型检查
- **v2.1**: 集成 CI/CD 自动检查
- **v2.2**: 添加 commit message 规范检查（commitlint）

---

*本文档基于分析报告 `vibex-code-quality-gap-analysis.md` 生成*
