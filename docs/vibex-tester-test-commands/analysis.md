# Analysis: vibex-tester-test-commands

## 1. Problem Statement

Test commands are fragmented across **两套系统**：

1. **npm/pnpm scripts** — 30+ 条分散在 `package.json` 中
2. **独立 shell 脚本** — 存放在 `scripts/` 和 `tests/e2e/` 目录下

Tester/Developer 需要记忆大量命令碎片，无法快速找到"我想做 X 应该用什么命令"。主要痛点：

- 测试场景入口不清晰（单元/集成/E2E/可访问性/稳定性/Flaky检测）
- npm script 命名不一致（`test:*` vs `coverage:*` vs `lint:*`）
- 没有统一的顶层入口文档
- CI 环境 vs 本地环境的命令差异未明确隔离

---

## 2. Current State

### 2.1 npm Scripts（package.json）

| 命令 | 功能 | 场景 |
|------|------|------|
| `pnpm test` | `vitest run` | 快速运行单元测试 |
| `pnpm test:unit` | `vitest run` | 等同 test |
| `pnpm test:unit:watch` | `vitest` | 本地开发监听模式 |
| `pnpm test:unit:coverage` | vitest + coverage | 生成覆盖率报告 |
| `pnpm test:all` | unit + e2e | 全量测试（CI 用） |
| `pnpm test:ci` | unit + e2e:ci | CI 全量 + Playwright 安装 |
| `pnpm test:contract` | vitest unit with verbose | 契约测试 |
| `pnpm test:json` | JSON 格式输出 | CI 报告解析 |
| `pnpm test:e2e` | Playwright 测试 | E2E 测试（需本地服务） |
| `pnpm test:e2e:ci` | Playwright + chromium 安装 | CI E2E |
| `pnpm test:e2e:local` | Playwright + 自定义 BASE_URL | 本地多环境 E2E |
| `pnpm test:a11y` | Playwright A11Y 配置 | 可访问性测试 |
| `pnpm pretest` / `pretest-check` | `node scripts/pre-test-check.js` | 测试前环境检查 |
| `pnpm coverage:check` | coverage 阈值检查 | |
| `pnpm coverage:diff` | 覆盖率 diff | 与基线对比 |
| `pnpm coverage:history` | `bash scripts/save-coverage-history.sh` | 历史覆盖率记录 |
| `pnpm lint` | ESLint + Prettier | 代码检查 |
| `pnpm lint:css` | stylelint | CSS 检查 |
| `pnpm pre-commit-check` | tsc + ESLint | 提交前检查 |

### 2.2 Shell Scripts（scripts/ & tests/e2e/）

| 脚本 | 功能 | 使用场景 |
|------|------|------|
| `scripts/test-stability-report.sh` | E2E 稳定性报告 | 日常 CI 分析 |
| `scripts/flaky-detector.sh` | Flaky 测试检测（默认跑10次） | 排查不稳定测试 |
| `scripts/pre-submit-check.sh` | 提交前代码质量验证 | CI/CD Pre-commit |
| `scripts/update-baseline.sh` | 更新覆盖率基线 | PR 合入后 |
| `scripts/save-coverage-history.sh` | 覆盖率历史持久化 | 定时任务 |
| `tests/e2e/run-e2e-test.sh` | E2E 测试 + 截图 + 报告 | 本地调试/本地CI |
| `scripts/copy-screenshots.sh` | 复制截图 | 测试结果存档 |
| `scripts/parse-playwright-report.py` | 解析 Playwright 报告 | 报告生成 |

### 2.3 Playwright 配置

| 配置文件 | 用途 |
|------|------|
| `tests/e2e/playwright.config.ts` | 标准 E2E |
| `playwright.a11y.config.ts` | 可访问性测试 |
| `playwright.ci.config.ts` | CI 环境（并行数等差异） |

---

## 3. Solution Options

### Option A: 统一 Makefile 入口

**方案**：在项目根目录创建 `Makefile`，将所有测试场景按目标分组。

```
make test          # 单元测试
make test:watch    # 监听模式
make test:coverage # 带覆盖率
make test:e2e      # E2E（需服务运行）
make test:ci       # CI 全量
make test:a11y     # 可访问性
make test:flaky    # Flaky 检测
make test:stability # 稳定性报告
make lint          # 代码检查
make pre-commit    # 提交前全检
make help          # 显示所有可用命令
```

**优点**：
- 单一入口，`make help` 即可查看所有可用命令
- 跨平台（Linux/macOS/Windows WSL 均原生支持）
- 可以在 Makefile 顶层 doc 中内嵌使用说明
- 场景分组清晰，适合 Tester 和 Developer

**缺点**：
- 引入额外的 Makefile 需要开发者学习 Make 语法
- 部分 CI 环境（如某些 GitHub Actions 步骤）已有 npm/pnpm 习惯

---

### Option B: 优化 npm scripts 分层 + README 文档

**方案**：
1. 将现有 `test:*` 脚本重组为分层结构（`test/` 命名空间）
2. 在 `package.json` 同级创建 `TEST_COMMANDS.md`
3. 添加 `test:help` 脚本打印可用命令

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ci": "npx playwright install --with-deps chromium && playwright test",
    "test:e2e:local": "BASE_URL=http://localhost:3000 playwright test",
    "test:a11y": "playwright test --config playwright.a11y.config.ts",
    "test:all": "pnpm run test:unit && pnpm run test:e2e",
    "test:ci": "pnpm run test:unit && pnpm run test:e2e:ci",
    "test:flaky": "bash scripts/flaky-detector.sh",
    "test:stability": "bash scripts/test-stability-report.sh",
    "test:update-baseline": "bash scripts/update-baseline.sh",
    "test:help": "cat TEST_COMMANDS.md",
    ...
  }
}
```

**优点**：
- 无需引入新工具栈，纯 pnpm 生态
- 开发者已有 npm script 使用习惯

**缺点**：
- shell 脚本（flaky-detector, stability-report 等）仍需记忆路径
- 没有统一的场景化入口
- 帮助信息需要额外维护 markdown 文件

---

## 4. Recommended Approach

**推荐 Option A：统一 Makefile 入口**

原因：
1. Tester 天然需要一个"测试场景 → 命令"的一对一映射，Makefile 完美对应这个需求
2. 项目已有多个 shell 脚本，说明团队已有独立脚本实践，Makefile 是这个生态的自然延伸
3. `make help` 提供自助式文档，降低 onboard 成本
4. Makefile 本身有标准格式，便于 CI/CD 直接调用（如 `make test:ci`）

### 实施要点

```
/root/.openclaw/vibex/vibex-fronted/Makefile
```

Makefile 应包含：
- **测试类目标**：`test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ci`, `test:e2e:local`, `test:a11y`, `test:flaky`, `test:stability`, `test:all`, `test:ci`
- **代码质量目标**：`lint`, `lint:fix`, `pre-commit`
- **覆盖率目标**：`coverage`, `coverage:check`, `coverage:history`, `coverage:update-baseline`
- **帮助目标**：`help` — 列出所有目标和简要说明
- **文档**：`TEST_COMMANDS.md` — 详细说明每个命令的用途、依赖前置条件、输出位置

---

## 5. Acceptance Criteria

| ID | 标准 | 验证方式 |
|----|------|---------|
| AC1 | `make help` 能列出所有测试相关命令及其说明 | 执行 `make help`，输出包含 test/flaky/stability 等章节 |
| AC2 | `make test` 执行单元测试，等价于 `pnpm test` | 对比两者输出 |
| AC3 | `make test:e2e` 能运行 Playwright E2E（需 BASE_URL） | 检查脚本调用正确 |
| AC4 | `make test:flaky` 调用 flaky-detector.sh 并支持自定义 runs 参数 | `make test:flaky RUNS=5` 能正常执行 |
| AC5 | `make test:stability` 调用 test-stability-report.sh | 检查调用链路 |
| AC6 | `make test:ci` 等价于 `pnpm test:ci` | 对比脚本逻辑 |
| AC7 | Makefile 包含 pre-commit 目标（lint + type check） | 检查目标定义 |
| AC8 | `TEST_COMMANDS.md` 详细说明每个命令的使用场景 | 文件存在且内容完整 |
| AC9 | CI pipeline 能直接使用 `make test:ci` 替代原有 npm 命令 | CI 配置更新验证 |
| AC10 | 开发者无需记忆任何 shell 脚本路径 | 通过 `make help` 可找到所有命令 |

---

*分析时间: 2026-04-05*
*分析人: analyst subagent*
