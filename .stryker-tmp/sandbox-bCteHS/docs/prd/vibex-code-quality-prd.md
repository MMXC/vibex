# PRD - VibeX 代码质量自动化

**项目代号**: vibex-code-quality-impl  
**状态**: In Progress  
**创建时间**: 2026-03-06  
**负责人**: PM Agent  

---

## 1. 功能需求 (Functional Requirements)

### 1.1 核心功能

| 功能点 | 描述 | 优先级 |
|-------|------|-------|
| ESLint 安全规则 | 集成安全相关 ESLint 规则 | P0 |
| Pre-commit Hook | 使用 husky 设置 commit 前检查 | P0 |
| Lint-staged | 只检查暂存文件，提升性能 | P0 |
| 质量报告 | 生成可读的质量检查报告 | P1 |
| CI 集成 | GitHub Actions 中运行检查 | P1 |

### 1.2 用户故事

#### Epic 1: ESLint 安全规则

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-001 | 安全规则配置 | 集成 eslint-plugin-security 等安全规则 |
| US-001a | XSS 防护规则 | 检测潜在 XSS 漏洞 |
| US-001b | 代码注入防护 | 检测潜在代码注入 |
| US-001c | 敏感信息检测 | 检测硬编码密码/密钥 |
| US-002 | TypeScript 规则 | 严格类型检查规则 |
| US-003 | React 规则 | React 最佳实践规则 |

#### Epic 2: Pre-commit Hook

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-010 | Husky 安装 | 正确安装并配置 husky |
| US-011 | Commit 前检查 | git commit 时自动运行 ESLint |
| US-012 | 检查失败阻止提交 | 检查不通过无法提交 |
| US-013 | Hook 脚本可调试 | 提供跳过 Hook 的选项 (--no-verify) |

#### Epic 3: Lint-staged 集成

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-020 | 只检查暂存文件 | 只对 git add 的文件运行检查 |
| US-021 | 性能优化 | 检查时间 < 10s |
| US-022 | 缓存机制 | 利用 ESLint 缓存加速 |

#### Epic 4: 质量报告与 CI

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-030 | 格式化报告 | 生成 HTML/JSON 格式报告 |
| US-031 | GitHub Actions | CI 中运行质量检查 |
| US-032 | PR 检查 | PR 中显示检查结果 |

---

## 2. 配置文件结构

### 2.1 目录结构

```
vibex-frontend/
├── .eslintrc.js           # ESLint 配置
├── .eslintignore          # 忽略文件
├── .husky/
│   ├── pre-commit         # pre-commit hook
│   └── commit-msg         # commit msg hook (可选)
├── .lintstagedrc.js       # lint-staged 配置
├── .github/
│   └── workflows/
│       └── code-quality.yml
└── reports/
    └── lint/              # 报告输出
```

### 2.2 ESLint 规则列表

```javascript
// 需集成的规则
{
  "plugins": ["security", "react", "react-hooks", "jsx-a11y"],
  "rules": {
    // 安全规则
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-fs-filename": "error",
    
    // React 规则
    "react/prop-types": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // JSX 可访问性
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/click-events-have-key-events": "warn"
  }
}
```

---

## 3. Epics 拆分 (业务级)

| Epic | 名称 | 描述 | 工作量 |
|------|------|------|-------|
| Epic 1 | ESLint Security Rules | 集成安全规则和 React 规则 | 2h |
| Epic 2 | Pre-commit Hook | husky + pre-commit 配置 | 1h |
| Epic 3 | Lint-staged | 暂存文件检查配置 | 1h |
| Epic 4 | CI Integration | GitHub Actions 集成 | 1h |

---

## 4. 非功能需求 (Non-Functional Requirements)

| 需求类型 | 要求 |
|---------|------|
| 性能 | pre-commit 检查 < 10s |
| 可靠性 | 不阻塞正常开发流程 |
| 可维护性 | 配置清晰，易于调整 |
| 兼容性 | 支持 ESLint 9.x |

---

## 5. 验收标准 (可写 expect() 断言)

### 5.1 ESLint 配置验收

```typescript
expect(fs.existsSync('.eslintrc.js')).toBe(true)
const eslintConfig = require('./.eslintrc.js')
expect(eslintConfig.plugins).toContain('security')
expect(eslintConfig.plugins).toContain('react')
expect(eslintConfig.rules['security/detect-object-injection']).toBe('error')
expect(eslintConfig.rules['react/prop-types']).toBe('error')
```

### 5.2 Husky 配置验收

```typescript
expect(fs.existsSync('.husky/pre-commit')).toBe(true)
const hookContent = fs.readFileSync('.husky/pre-commit', 'utf8')
expect(hookContent).toContain('npm run lint')
expect(hookContent).toContain('npx lint-staged')

// Husky 安装验证
const huskyInstalled = execSync('npx husky --version').toString()
expect(huskyInstalled).toMatch(/\d+\.\d+/)
```

### 5.3 Lint-staged 验收

```typescript
expect(fs.existsSync('.lintstagedrc.js')).toBe(true)
const lintStagedConfig = require('./.lintstagedrc.js')
expect(lintStagedConfig['*.{ts,tsx}']).toBeDefined()
expect(lintStagedConfig['*.{ts,tsx}'][0]).toContain('eslint')

// 只检查暂存文件
const stagedFiles = execSync('git diff --cached --name-only').toString()
expect(stagedFiles.split('\n').length).toBeGreaterThan(0)
```

### 5.4 CI 集成验收

```yaml
# .github/workflows/code-quality.yml
expect(fs.existsSync('.github/workflows/code-quality.yml')).toBe(true)
const workflow = yaml.parse(fs.readFileSync('.github/workflows/code-quality.yml'))
expect(workflow.on.pull_request).toBeDefined()
expect(workflow.jobs.lint).toBeDefined()
```

### 5.5 报告生成验收

```typescript
// 运行 ESLint 生成报告
execSync('npm run lint -- --format json -o reports/lint/report.json')
expect(fs.existsSync('reports/lint/report.json')).toBe(true)

const report = JSON.parse(fs.readFileSync('reports/lint/report.json'))
expect(Array.isArray(report)).toBe(true)
```

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 检查时间过长 | 中 | 使用 lint-staged + 缓存 |
| 规则过于严格 | 中 | 可配置警告级别 |
| CI 时间增加 | 低 | 仅在 PR 中运行 |

---

*PRD 创建完成于 2026-03-06 20:35 (Asia/Shanghai)*
