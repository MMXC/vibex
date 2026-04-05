# VibeX 测试规范 — Agent 执行指南

**项目**: vibex-tester-proposals-vibex-proposals-20260406
**版本**: v1.0
**日期**: 2026-04-06
**适用**: 所有 Agent（dev, tester, reviewer, architect 等）

---

## 1. 强制规范

### 1.1 测试框架归属

| 文件后缀 | 框架 | Runner | 说明 |
|----------|------|--------|------|
| `*.test.ts` / `*.test.tsx` | **Jest** | `pnpm test` | 后端 API + 前端 React 组件单元测试 |
| `*.vitest.ts` / `*.vitest.tsx` | **Vitest** | `pnpm vitest run` | 需要 Vite ESM 环境的前端测试 |
| `tests/*.spec.ts` | **Playwright** | `pnpm test:e2e` | E2E 端到端测试，独立进程运行 |
| `tests/performance/*.spec.ts` | **Playwright** | `pnpm test:e2e` | 性能测试 |

**禁止**:
- ❌ 禁止在 `*.test.ts` / `*.test.tsx` 中使用 `import { vi } from 'vitest'`
- ❌ 禁止在 `*.vitest.tsx` 中使用 `jest.fn()`（Vitest 中用 `vi.fn()`）
- ❌ 禁止在 E2E spec 文件中使用 Jest globals
- ❌ 禁止在同一个进程内同时加载 Jest 和 Playwright

### 1.2 测试命名规范

```
✅ 正确
  src/schemas/auth.test.ts          — Jest API 测试
  src/components/TabBar.test.tsx    — Jest 组件测试
  src/lib/api.vitest.ts             — Vitest ESM 测试
  tests/e2e/login.spec.ts           — Playwright E2E
  tests/performance/load.spec.ts    — Playwright 性能

❌ 错误
  src/auth-vitest.test.ts            — 混用框架名
  tests/login.test.ts               — E2E 用 *.test.ts
  src/api-test.ts                   — 缺少框架标识
```

### 1.3 进程隔离（铁律）

```
Jest Runner ←→ 禁止加载 Playwright
Vitest Runner ←→ 禁止加载 Jest
Playwright Runner ←→ 独立进程，无其他 Runner 依赖
```

违反进程隔离将导致：
- E2E 测试抛出 `Class extends value undefined is not a constructor or null`
- CI 结果不可信
- 测试覆盖率计算错误

### 1.4 Test 脚本执行约定

| 命令 | 范围 | CI 状态 |
|------|------|---------|
| `pnpm test` | Jest（前端 + 后端） | 失败 → PR blocking |
| `pnpm vitest run` | Vitest | 失败 → PR blocking |
| `pnpm test:e2e` | Playwright E2E | 失败 → PR blocking |
| `pnpm test:all` | Jest + Vitest + E2E | 任一失败 → PR blocking |

---

## 2. 测试覆盖率要求

### 2.1 覆盖率基线

| 模块 | 最低覆盖率 | 测量工具 |
|------|-----------|----------|
| API Routes (`/api/**`) | **80%** | Jest + Istanbul |
| Schema 校验 (`src/schemas/**`) | **85%** | Jest |
| React 组件 (`src/components/**`) | **70%** | Vitest + React Testing Library |
| 核心业务逻辑 (`src/lib/core/**`) | **80%** | Jest |
| E2E 核心路径 | **80%** | Playwright |

### 2.2 E2E 核心路径定义

必须覆盖的 E2E 测试路径：

```
1. 登录/注册流程
   ✅ 用户注册 → 邮箱验证 → 登录 → 登出

2. 项目管理流程
   ✅ 创建项目 → 编辑项目 → 删除项目

3. Canvas 核心交互
   ✅ 打开项目 → Canvas 加载 → 节点操作 → 保存

4. 上下文选择流程
   ✅ BoundedContextTree → checkbox 多选 → 生成组件

5. 冲突解决流程
   ✅ 多端同步 → 冲突提示 → 合并/覆盖选择
```

### 2.3 前端变更 /qa 强制要求

**触发条件**: 任何涉及以下目录/文件的变更：
- `src/components/**`
- `src/pages/**`
- `src/stores/**`
- `src/styles/**`
- CSS / Tailwind 类名修改

**要求**:
1. 使用 gstack `/qa` 拍摄关键交互截图（至少 2 张）
2. 控制台无 Error 级别日志截图
3. 截图上传到 PR comment 或 artifact
4. Reviewer 检查截图后方可 approve

**截图命名**: `qa-<feature-name>-<description>.png`

**示例**:
```bash
# 使用 gstack 进行 /qa 验收
cd ~/openclaw-workspace
qa-start
# 导航到变更页面，截图
screenshot qa-canvas-checkbox-fix-interaction.png
screenshot qa-canvas-checkbox-fix-console.png
```

---

## 3. 审查清单

### 3.1 PR 提交前（Dev/Test Agent 自查）

```
测试隔离检查
  □ 测试文件命名符合框架规范（*.test.ts / *.spec.ts）
  □ 测试文件中无 vitest/Jest 混用 import
  □ E2E 测试使用独立 playwright.config.ts 运行
  □ 无在 Jest 中加载 Playwright 的代码

覆盖率检查
  □ 新增代码有对应的测试文件
  □ 测试使用 describe-it 结构，描述清晰
  □ 核心路径（登录/Canvas/项目）有 E2E 覆盖
  □ 断言具体，验证行为而非实现细节

/qa 验证（前端变更）
  □ 已在 gstack 中验证 UI 变更
  □ 截图已保存并上传 PR
  □ 控制台无 Error 截图已提供

Pre-existing 失败检查
  □ 本次修改不引入新的测试失败
  □ `pnpm test` 输出 0 FAIL 后再提交
```

### 3.2 Reviewer 审核检查

```
代码审查
  □ 测试文件位置正确（jest/vitest/playwright 分类）
  □ 无进程隔离违规（Jest + Playwright 混用）
  □ 测试描述清晰，描述行为而非实现

/qa 截图审查（前端变更必查）
  □ PR 包含 gstack /qa 截图证据
  □ 截图覆盖所有 UI 变更
  □ 控制台无 Error 级别日志
  □ 截图清晰可读

覆盖率审查
  □ 新增测试覆盖新增代码
  □ 核心路径测试未缺失
  □ 断言有效（不是 toBeTruthy() 滥用）

回归检查
  □ 不存在 pre-existing 测试失败被掩盖
  □ `pnpm test` 完整运行通过
  □ E2E 测试独立运行正常
```

### 3.3 CI 检查（自动）

```yaml
# GitHub Actions 自动检查项
check-jest:
  run: pnpm test
  fail-on: any test failure

check-vitest:
  run: pnpm vitest run
  fail-on: any test failure

check-e2e:
  run: pnpm test:e2e
  fail-on: any test failure
  artifacts: playwright-report on failure

check-coverage:
  run: pnpm test --coverage
  thresholds:
    lines: 80%
    functions: 80%
    branches: 70%
    statements: 80%
```

---

## 4. 违规处理

| 违规类型 | 处理方式 |
|----------|----------|
| 测试框架混用（vitest import in Jest file） | PR blocking，dev 立即修复 |
| E2E 测试 crash（非 flaky） | PR blocking，tester 优先修复 |
| Pre-existing 失败未报告 | Reviewer 要求修复后 approve |
| 前端变更无 /qa 截图 | PR blocking，reviewer blocking |
| 覆盖率低于基线 | PR blocking，dev 补充测试 |

---

## 5. 快速参考

```bash
# 检查测试状态
pnpm test              # Jest — 全部通过才可提交
pnpm vitest run        # Vitest — 前端组件测试
pnpm test:e2e          # Playwright — E2E 测试（独立进程）

# 检查覆盖率
pnpm test --coverage   # Jest coverage 报告

# 快速验证单文件
pnpm test --testPathPattern="auth"  # 只跑 auth 测试
pnpm test:e2e --grep="login"         # 只跑 login E2E

# /qa 截图（gstack）
screenshot qa-<feature>-<desc>.png   # 上传到 PR
```

---

*规范版本: v1.0 | 最后更新: 2026-04-06*
