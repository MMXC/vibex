# VibeX 构建修复（Tester 视角）— PRD

**项目**: vibex-tester-proposals-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-tester-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX 存在两个阻塞性构建错误，需要从 QA 视角进行修复 + 完整验证。Tester 视角强调：修复后必须通过构建验证 + 回归测试 + 自动化测试补充。

### 目标
1. 立即修复两个 P0 阻塞问题（<20min）
2. 建立 QA 验证体系（Smoke Test + 回归测试 + CI 构建测试 + Unicode 扫描）

### 成功指标
- 前端 `next build` + 后端 `pnpm build` 退出码 = 0
- Smoke Test 核心功能通过（登录/创建项目/画布加载）
- 修复影响范围回归测试通过
- Storybook 构建测试通过
- 全库 Unicode 弯引号扫描无残留

---

## 2. Epic 拆分

### Epic 1: 紧急修复与验证

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 `CanvasHeader.stories.tsx` | 5 min | `expect(fileExists).toBe(false)` |
| **1.2** | 替换 Unicode 弯引号 | 5 min | `expect(弯引号.exitCode).toBe(1)` |
| **1.3** | 前端构建验证 | 5 min | `expect(exec('cd vibex-fronted && next build').exitCode).toBe(0)` |
| **1.4** | 后端构建验证 | 5 min | `expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)` |

**Epic 1 总工时**: 20 分钟

---

### Epic 2: QA 验证体系

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | Smoke Test（核心功能） | 2h | - 登录流程正常<br>- 创建项目成功<br>- 画布页面加载正常<br>- `expect(smokeTestAll).toBe(true)` |
| **2.2** | 回归测试（修复影响范围） | 2h | - Canvas 相关页面功能正常<br>- API route（agents/pages/prototype-snapshots）功能正常<br>- `expect(regressionPassed).toBe(true)` |
| **2.3** | Storybook 构建测试 | 1h | - `build-storybook` CI 验证通过<br>- `expect(exec('build-storybook').exitCode).toBe(0)` |
| **2.4** | Unicode 扫描验证 | 1h | - 全库 `grep` 扫描无弯引号残留<br>- `expect(exec('grep弯引号全库').exitCode).toBe(1)` |

**Epic 2 总工时**: 6h

---

**总工时汇总**: 20min + 6h ≈ **~7h**

---

## 3. 验收标准

### Story 1.1 — 删除 Story 文件

```
expect(fileExists('vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')).toBe(false)
expect(exec('cd vibex-fronted && npx tsc --noEmit').exitCode).toBe(0)
```

### Story 2.1 — Smoke Test

```
// Playwright E2E
test('Smoke: 登录 → 创建项目 → 画布加载', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  // 创建项目
  await page.click('[data-testid="create-project"]');
  await expect(page.locator('[data-testid="project-name"]')).toBeVisible();
  // 画布加载
  await page.click('[data-testid="open-canvas"]');
  await expect(page).toHaveURL(/\/canvas/);
});
```

### Story 2.4 — Unicode 扫描

```
// 全库扫描（前后端）
expect(exec('grep -rP "[\\x{2018}-\\x{2019}\\x{201C}-\\x{201D}]" vibex-backend/src/ vibex-fronted/src/ --include="*.ts" --include="*.tsx"').exitCode).toBe(1)
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `CanvasHeader.stories.tsx` 已删除
- [ ] 弯引号已替换
- [ ] 前端 + 后端构建成功（退出码 0）

Epic 2 完成条件：
- [ ] Smoke Test 全通过
- [ ] 回归测试全通过
- [ ] Storybook 构建成功
- [ ] 全库 Unicode 扫描无残留

项目整体 DoD：
- [ ] Epic 1 + Epic 2 全部完成
- [ ] CI green
- [ ] 测试报告已生成
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story | CanvasHeader.stories.tsx | `fileExists).toBe(false)` | 无 |
| F1.2 | 弯引号替换 | 3个route.ts | `grep.exitCode=1` | 无 |
| F1.3 | 前端构建 | next build | `exitCode=0` | 无 |
| F1.4 | 后端构建 | pnpm build | `exitCode=0` | 无 |
| T2.1 | Smoke Test | 登录/创建/画布加载 | 3个E2E test全pass | ✅ 全页面 |
| T2.2 | 回归测试 | Canvas+API影响范围 | 回归全pass | ✅ /canvas, API |
| T2.3 | Storybook | build-storybook CI | `exitCode=0` | 无 |
| T2.4 | Unicode扫描 | 全库弯引号扫描 | `exitCode=1`（无残留） | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 构建通过但运行时有问题 | 低 | 高 | Epic 2 Smoke + 回归测试 |
| Smoke Test 环境配置问题 | 中 | 低 | 使用现有测试基础设施 |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言（含 E2E Playwright）
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] QA 视角清晰（Smoke + 回归 + CI + 扫描）

---

*Planning 输出: `plan/feature-list.md`*  
*基于: Tester 视角分析 (analysis.md)*
