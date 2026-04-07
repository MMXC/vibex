# PRD: vibex-frontend-build-fail — 前端构建失败修复

**项目**: vibex-frontend-build-fail  
**根因**: zustand 未声明在 package.json  
**分析师**: analyst | **PM**: pm | **工作目录**: /root/.openclaw/vibex  
**日期**: 2026-03-20

---

## Problem Statement

`zustand` 被 20 个 `.ts/.tsx` 文件直接 `import`，但未在 `package.json` 中声明。当前构建依赖 reactflow 的传递依赖侥幸成功，但 CI/CD 使用 `npm ci` 时可能失败，`npm ls` 报告 extraneous 警告。必须明确声明依赖。

---

## Success Metrics

| 指标 | 目标 |
|------|------|
| `package.json` 包含 zustand | ✅ |
| `pnpm build` 成功 | 100% |
| `npm ls zustand` extraneous 警告 | 0 |
| CI 添加依赖完整性检查 | ✅ |

---

## Epics

### Epic 1: zustand 依赖修复（核心，必须）

**目标**: 将 zustand 明确声明在 package.json，消除构建隐患。

**Stories**:

| Story | 描述 | 验收标准 |
|--------|------|----------|
| S1.1: 添加 zustand 依赖 | 在 package.json dependencies 中添加 `"zustand": "^4.5.7"`, 执行 `pnpm install` 更新 lockfile | `expect(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies.zustand).toMatch(/^\\^?4\\.5\\.7$/)` |
| S1.2: 构建验证 | 运行 `pnpm build` 确认成功 | `expect(childProcess.execSync('cd /root/.openclaw/vibex && pnpm build', { encoding: 'utf8' })).toContain('✓')` |
| S1.3: 无 extraneous 警告 | `pnpm ls zustand` 无 extraneous 报告 | `expect(childProcess.execSync('pnpm ls zustand')).not.toContain('extraneous')` |
| S1.4: Git 提交 | 提交 package.json + pnpm-lock.yaml | `expect(gitLog).toContain('zustand')` |

---

### Epic 2: CI 依赖完整性检查（可选跟进）

**目标**: 在 CI 管道中添加依赖检查，防止未来类似问题漏检。

**Stories**:

| Story | 描述 | 验收标准 |
|--------|------|----------|
| S2.1: 添加 CI 检查步骤 | 在 CI 构建脚本中添加 `pnpm ls` 依赖检查，检测 extraneous | `expect(ciConfig).toContain('pnpm ls')` |
| S2.2: 版本控制 CI 配置 | 将 CI 配置文件纳入版本控制 | `expect(fs.existsSync('.github/workflows/ci.yml')).toBe(true)` |

---

## 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 添加 zustand 依赖 | package.json 添加 `"zustand": "^4.5.7"` | `expect(dependencies.zustand).toMatch(/^\\^?4\\.5\\.7$/)` | - |
| F1.2 | 更新 lockfile | 执行 pnpm install | `expect(fs.existsSync('pnpm-lock.yaml')).toBe(true)` | - |
| F1.3 | 构建验证 | pnpm build 成功 | `expect(buildOutput).toContain('✓')` | - |
| F1.4 | CI 检查 | 添加 pnpm ls extraneous 检查 | `expect(ciConfig).toContain('pnpm ls')` | - |

---

## 优先级矩阵

| 功能点 | 紧急 | 重要 | 优先级 |
|--------|------|------|--------|
| F1.1 添加 zustand 依赖 | P0 | P0 | 🔴 P0 |
| F1.2 更新 lockfile | P0 | P0 | 🔴 P0 |
| F1.3 构建验证 | P0 | P0 | 🔴 P0 |
| F1.4 CI 检查 | P1 | P1 | 🟡 P1 |

---

## Out of Scope

- 修改现有 zustand store 代码逻辑
- zustand 版本升级（当前保持 v4.5.7）
- reactflow 依赖变更
- 添加新的 zustand store 文件

---

## Dependencies

- **前置**: analyst 已完成 analysis.md
- **并行**: N/A（单 root cause，直接进入开发）
- **下游**: dev 实现 → tester 验证 → reviewer 审查

---

## Non-Functional Requirements

- **构建时间**: 增加 pnpm install 时间 < 10s
- **版本兼容性**: zustand ^4.5.7 与现有 reactflow@11.11.4 兼容
- **CI 兼容性**: 同时支持 pnpm 和 npm (via package-lock.json 或 pnpm-lock.yaml)
