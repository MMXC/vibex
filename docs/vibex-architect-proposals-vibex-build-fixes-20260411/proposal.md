# 架构提案: VibeX 构建修复方案

**提案编号**: vibex-build-fixes-20260411  
**角色**: Architect  
**日期**: 2026-04-11  
**状态**: 待评审

---

## 背景

VibeX 项目存在两个阻塞性构建失败：

| # | 问题 | 影响范围 | 严重度 |
|---|------|----------|--------|
| 1 | 前端 Storybook 构建失败：`CanvasHeader.stories.tsx` 引用了已删除的组件 | `vibex-fronted` | 🔴 P0 |
| 2 | 后端 TypeScript 构建失败：Unicode 弯引号字符 | `vibex-backend` | 🔴 P0 |

---

## 问题 1: 前端构建失败 — `CanvasHeader.stories.tsx`

### 根因分析

```
Git 历史链路:
  de829cd5 feat(storybook): Canvas 组件 Story 覆盖 (vibex-third E3-S2)
    ↓ feat/e2-code-cleanup 分支删除了 CanvasHeader 组件（但该分支未合入 main）
    ↓ d0557ab0 fix(tsc): remove orphaned CanvasHeader.stories.tsx  ← 在 main 上执行了修复
    ↓ 79ebe010 Revert "fix(tsc): remove orphaned CanvasHeader.stories.tsx" ← 又 revert 回来了！
```

**核心问题**: `feat/e2-code-cleanup` 分支的删除操作未正确传播到 story 文件，导致：
1. `CanvasHeader` 组件本身被删除 → story 文件引用失效
2. 有人在 main 上修复了 story（d0557ab0）
3. 随后又 revert 了该修复（79ebe010），将已损坏的 story 文件复活

**这是一个典型的"孤立引用"（Orphaned Reference）问题**，本质是组件删除和 story 删除不同步。

### 当前状态确认

- `vibex-fronted/src/components/canvas/CanvasHeader.tsx` → **不存在**
- `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx` → **存在**，引用不存在的组件
- `git log` 显示 79ebe010 为 HEAD，revert 操作将损坏的 story 文件带回来了

### 修复方案

| 方案 | 操作 | 优点 | 缺点 |
|------|------|------|------|
| A | 删除 `CanvasHeader.stories.tsx` | 简单直接，与组件删除历史一致 | 如果未来重建组件需重新写 story |
| B | 创建空的 `CanvasHeader.tsx` 存根 | 保留 story 文件，TypeScript 通过 | 技术债：空组件可能误导其他开发者 |
| C | 保留删除，在 `stories/` 目录添加 `.storybookignore` 规则 | 防止未来误加 | 不解决当前问题 |

**推荐方案 A**：删除 `CanvasHeader.stories.tsx`，与组件删除历史保持一致。这与 d0557ab0 的原始修复意图相同，79ebe010 的 revert 是错误回滚。

```bash
# 修复命令
rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
git add vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
git commit -m "fix(tsc): remove orphaned CanvasHeader.stories.tsx (component already deleted in feat/e2-code-cleanup)"
```

---

## 问题 2: 后端构建失败 — Unicode 弯引号

### 根因分析

**现场调查结论**: 当前三个文件（`agents/route.ts`、`pages/route.ts`、`prototype-snapshots/route.ts`）均使用标准 ASCII 单引号，**未检测到 Unicode 弯引号**。

这说明：
1. 要么弯引号问题已被其他 Agent 修复
2. 要么问题描述中提到的文件是更早期的版本

**Unicode 弯引号来源分析**（用于预防同类问题）：

```
标准单引号:    ' (U+0027)  ' (U+0027)
Unicode 弯引号: ' (U+2018)  ' (U+2019)
```

常见引入途径：
- 从 Word/Google Docs 复制代码
- Markdown 渲染后复制
- 非英语键盘输入法
- AI 代码生成工具输出

### 修复方案（如问题仍存在）

| 方案 | 操作 | 适用范围 |
|------|------|----------|
| A | `sed -i "s/['\xE2\x80\x98]/'/g; s/['\xE2\x80\x99]/'/g" *.ts` | 批量替换当前目录 |
| B | ESLint rule `no-irregular-whitespace` | 预防 + 检测 |
| C | pre-commit hook 检测 | 预防 |

**推荐方案 A + B**：立即修复 + 长期防护。

---

## 长期防护措施

### 1. 孤立引用检测

在 `package.json` 或 `tsconfig.json` 中添加构建前检查：

```json
// tsconfig.json 或单独的 check-refs.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*.tsx", "src/**/*.ts"]
}
```

```bash
# 构建前运行（建议加入 CI pre-check）
pnpm tsc --noEmit 2>&1 | grep "Cannot find module" | head -20
```

或使用 `ts-prune` / 自定义脚本扫描未引用的文件。

### 2. Story-Component 引用同步

建立组件删除 SOP：
- 删除组件时，**必须**同时删除对应的 `.stories.tsx`
- Storybook 的 `autodocs` 会自动生成文档，孤立 story 会导致构建失败
- 建议在 PR 模板中添加检查项：

```markdown
## Component/Story Sync Check
- [ ] 删除组件时已同步删除对应的 `*.stories.tsx`
- [ ] 新增组件时已创建对应的 `*.stories.tsx`
```

### 3. Unicode 字符检测

#### ESLint Rule
```bash
pnpm add -D eslint-plugin-no-irregular-whitespace
```

```js
// .eslintrc.js
module.exports = {
  rules: {
    'no-irregular-whitespace': 'error',
    'no-tabs': 'error',
  }
}
```

#### Pre-commit Hook
```bash
pnpm add -D lint-staged husky
```

```json
// package.json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "tsc --noEmit"],
    "*.tsx": ["eslint --fix", "tsc --noEmit"]
  }
}
```

### 4. CI/CD 增强

#### 当前 CI 状态
- ✅ 有 Chromatic 视觉测试
- ✅ 有 CHANGELOG Guard
- ❌ 缺少 TypeScript 类型检查 Gate

#### 建议新增 CI Jobs

```yaml
# .github/workflows/tsc-check.yml
name: TypeScript Check
on: [push, pull_request]

jobs:
  tsc-check-frontend:
    name: Frontend TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter vibex-fronted tsc --noEmit
        # 立即失败：报告所有类型错误，不只是第一个

  tsc-check-backend:
    name: Backend TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter vibex-backend tsc --noEmit
```

#### 构建失败快进策略
```yaml
# 任何类型检查失败立即终止后续构建
- name: TypeScript Check
  run: pnpm tsc --noEmit
  # fail-fast: true (default in GitHub Actions)
```

---

## CI/CD 增强完整建议

| 层级 | 措施 | 优先级 | 预期效果 |
|------|------|--------|----------|
| L1 预防 | `eslint no-irregular-whitespace` | P1 | 阻止弯引号进入代码库 |
| L1 预防 | pre-commit `tsc --noEmit` | P1 | 阻止类型错误进入代码库 |
| L1 预防 | story-component 同步 SOP | P1 | 防止孤立 story 文件 |
| L2 检测 | CI TypeScript Gate (frontend) | P1 | PR 级别阻断 |
| L2 检测 | CI TypeScript Gate (backend) | P1 | PR 级别阻断 |
| L3 监控 | Chromatic visual regression | P2 | UI 退化检测 |
| L3 监控 | 构建时间基线监控 | P2 | 性能退化预警 |
| L4 恢复 | 快速 revert 策略文档化 | P2 | 减少 MTTR |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 附录：Git 历史记录

```
79ebe010 Revert "fix(tsc): remove orphaned CanvasHeader.stories.tsx (component no longer exists)"
d0557ab0 fix(tsc): remove orphaned CanvasHeader.stories.tsx (component no longer exists)
9ae7a43f fix(tsc): remove 9 orphaned story files with broken component refs
de829cd5 feat(storybook): Canvas 组件 Story 覆盖 (vibex-third E3-S2)
```

关键洞察：`9ae7a43f` 显示这是批量问题（删除了 9 个孤立 story 文件），说明类似问题**可能存在其他孤立引用**，建议对 `src/components/**/stories/` 目录做全量扫描。
