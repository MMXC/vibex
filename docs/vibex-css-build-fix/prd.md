# PRD: VibeX CSS Build Fix

**项目**: vibex-css-build-fix
**版本**: v1.0
**日期**: 2026-04-04
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
`dashboard.module.css` 第 808 行存在一条孤立的 CSS 属性声明 `flex-direction: column;`，不属于任何选择器。`npm run build` 在 Turbopack 解析该行时报错 `Invalid token in pseudo element: WhiteSpace(" ")`，阻断生产部署。

### 目标
修复 CSS 构建错误，恢复生产部署能力，并建立防御机制防止类似问题再次发生。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| `npm run build` 退出码 | 非 0（失败） | 0 |
| 孤立 CSS 属性行数 | 1 | 0 |
| stylelint 集成 | 未配置 | 已配置 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | 修复 CSS 孤立属性行 | P0 | 0.5h | 无 |
| E2 | 集成 stylelint 到 CI | P1 | 1h | E1 |
| E3 | 扫描其他 module.css 文件 | P1 | 1h | E1 |

**总工时**: 2.5h

---

### Epic 1: 修复 CSS 孤立属性行（P0）

#### Stories

**S1.1: 删除孤立 CSS 属性行**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要删除 dashboard.module.css 第 808 行的孤立属性 |
| 功能点 | 删除 `dashboard.module.css` 第 808 行 `flex-direction: column;`，该行不属于任何选择器 |
| 验收标准 | `expect(lineCount(dashboard.module.css)).toBeLessThan(1013)` + `expect(hasOrphanProperty).toBe(false)` |
| 页面集成 | 【需页面集成】Dashboard 页面 |
| 工时 | 0.2h |
| 依赖 | 无 |

**S1.2: 验证构建通过**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证构建修复后 npm run build 成功 |
| 功能点 | 执行 `npm run build`，验证 exit code = 0 |
| 验收标准 | `expect(buildExitCode).toBe(0)` |
| 页面集成 | 【需页面集成】Dashboard 页面 |
| 工时 | 0.1h |
| 依赖 | S1.1 |

**S1.3: 验证 Dashboard 页面渲染**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证 Dashboard 页面在开发模式和生产构建后均正常渲染 |
| 功能点 | 开发模式访问 `/dashboard`，检查响应式布局（768px 以下） |
| 验收标准 | `expect(dashboardPageRenders).toBe(true)` + `expect(responsiveLayoutWorks).toBe(true)` |
| 页面集成 | 【需页面集成】Dashboard 页面 |
| 工时 | 0.2h |
| 依赖 | S1.2 |

#### DoD
- `npm run build` exit code = 0
- Dashboard 页面在开发/生产模式均正常渲染
- 响应式布局（768px）在移动端模拟器下正常

---

### Epic 2: 集成 stylelint 到 CI（P1）

#### Stories

**S2.1: 安装并配置 stylelint**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要在项目中集成 stylelint 检测 CSS 语法错误 |
| 功能点 | 安装 stylelint + 编写 `.stylelintrc.json`，检测孤立属性、语法错误 |
| 验收标准 | `expect(stylelintInstalled).toBe(true)` + `expect(hasStylelintConfig).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E1 |

**S2.2: 添加 lint 到 CI pipeline**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要将 stylelint 加入 CI，构建失败时阻断 |
| 功能点 | 在 `package.json` 添加 `lint:css` script，CI 中 `pnpm run lint:css` 非 0 则失败 |
| 验收标准 | `expect(ciHasStylelint).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S2.1 |

#### DoD
- stylelint 可检测孤立 CSS 属性行
- CI 中 stylelint 非 0 时构建失败

---

### Epic 3: 扫描其他 module.css 文件（P1）

#### Stories

**S3.1: 批量扫描 module.css 孤立属性**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要扫描项目中所有 module.css 文件是否有类似孤立属性 |
| 功能点 | 使用 `rg '^\s{2,}[a-z-]+\s*:' src/**/*.module.css` 扫描所有 module.css |
| 验收标准 | `expect(orphanPropertyCount).toBe(0)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E1 |

**S3.2: 修复扫描发现的孤立属性**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要修复扫描发现的任何孤立 CSS 属性行 |
| 功能点 | 逐个审查扫描结果，确认是否为真正孤立属性并修复 |
| 验收标准 | `expect(allOrphanPropertiesFixed).toBe(true)` |
| 页面集成 | 需页面集成（若有） |
| 工时 | 0.5h |
| 依赖 | S3.1 |

#### DoD
- 所有 module.css 文件无孤立 CSS 属性行
- 批量扫描命令执行后无输出

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | 删除孤立属性行 | `lineCount < 1013` |
| E1 | S1.2 | 构建验证 | `buildExitCode === 0` |
| E1 | S1.3 | 页面渲染 | `dashboardRenders && responsiveWorks` |
| E2 | S2.1 | stylelint 配置 | `installed && configured` |
| E2 | S2.2 | CI 集成 | `ciFailsOnLintError` |
| E3 | S3.1 | 批量扫描 | `orphanCount === 0` |
| E3 | S3.2 | 修复孤立属性 | `allFixed === true` |

**合计**: 3 Epic，7 Story，15 条 expect() 断言

---

## 4. 非功能需求

| 类别 | 要求 |
|------|------|
| 构建成功率 | `npm run build` 必须成功 |
| 防御机制 | stylelint 集成到 CI，持续检测 CSS 质量 |
| 代码清洁 | 无孤立 CSS 属性残留 |

---

## 5. 实施约束

- E1 为 P0，阻断性问题，优先修复
- E2 stylelint 配置需与 reviewer 确认规则范围
- E3 扫描结果中误报（如 `@keyframes` 内联属性）需人工过滤
- 修复作为单独 commit：`fix: remove orphan CSS property in dashboard.module.css`
