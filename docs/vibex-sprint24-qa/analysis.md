# VibeX Sprint24 QA 需求分析报告

**Agent**: Analyst
**日期**: 2026-05-03
**项目**: vibex-sprint24-qa
**任务**: analyze-requirements
**状态**: Draft

---

## 1. 业务场景分析

### 1.1 项目背景

VibeX Sprint 24 完成了 5 个 Epic 的 Phase2 开发，现在需要 QA 验证阶段确认各 Epic 交付物满足验收标准。

这 5 个 Epic 的特点是：
- P001: 配置/脚本验证（无页面变更）
- P002: TypeScript 债务确认（编译验证）
- P003: 前端 Onboarding 组件（页面变更）
- P004: 单元测试覆盖（测试文件变更）
- P005: Canvas 对比功能（页面变更）

### 1.2 各 Epic 交付物分析

#### P001-Slack配置
**已交付 commit**: `b9a00e199` — `feat(P001): add webhook dry-run validation + package.json script`

已确认交付物：
- `.github/workflows/test.yml` L153-157: `Validate Slack Webhook` step，`pnpm run webhook:dryrun`
- `vibex-fronted/scripts/webhook-dryrun.ts`: 完整的 webhook 验证脚本（检查 URL 可达性，exit 0/1）
- `package.json`: `webhook:dryrun` 脚本已注册

**QA 重点**: CI workflow 中 dry-run step 存在，webhook-dryrun.ts 脚本逻辑正确。

#### P002-TS债务
**已交付 commit**: `7fc8b3c39` — `docs: update changelog for P002-TS债务确认`

无新增代码（降级为验证性 Epic）。

**QA 重点**: 确认前端 0 TS errors，后端错误已量化。

#### P003-Onboarding
**已交付 commit**: `80b833c89` + `db240b6a1` + `1f3276bbd`

关键 bug 历史（P003 测试曾因 data-testid 重复失败两次）：
- `onboarding-step-0` 在容器和 actions 中重复 → 修复为 `onboarding-step-0` + `onboarding-step-0-actions`
- `onboarding-skip-btn` 在 steps 和 header 中重复 → 需加前缀区分
- 测试报告：`/root/.openclaw/vibex/reports/qa/P003-epic-verification.md`

**QA 重点**: data-testid 唯一性（getByTestId 不报错），Onboarding 流程完整性。

#### P004-API测试
**已交付 commit**: `4d00daddd` + `2af5c4138` + `3efd9b833` + `6ccfe2945` + `56f424db2`

已确认交付物：
- `vibex-fronted/src/lib/canvas/api/canvasApi.test.ts` — Canvas API 测试
- `vibex-fronted/src/lib/__tests__/canvasDiff.test.ts` — CanvasDiff 独立测试
- `.github/workflows/test.yml` L166-167: coverage threshold ≥ 60%（`node scripts/check-coverage.js 60`）

**QA 重点**: coverage gate 阈值是否为 60%，各模块覆盖率是否达标。

#### P005-Canvas对比
**已交付 commit**: `237ec1e18` + `e62f161fc`

涉及文件：
- `vibex-fronted/src/app/canvas-diff/page.tsx`
- `vibex-fronted/src/app/canvas-diff/canvas-diff.module.css`
- `vibex-fronted/src/components/canvas-diff/CanvasDiffSelector.tsx`
- `vibex-fronted/src/lib/canvasDiff.ts`
- `vibex-fronted/src/lib/__tests__/canvasDiff.test.ts`（独立测试文件）

历史 bug（P005 测试曾因两个问题失败）：
- 加载态使用 spinner（违反 spec 要求骨架屏）
- 核心算法 canvasDiff.ts 无独立测试文件

**QA 重点**: 加载态是否为骨架屏（非 spinner），canvasDiff.ts 是否有测试文件。

---

## 2. 技术方案

### 2.1 QA 验证方法论

**每类 Epic 适用不同验证策略**：

| Epic 类型 | 验证方法 | 关键工具 |
|-----------|----------|----------|
| 配置/脚本 | 文件内容检查 + CI 实际运行 | `grep`, `cat`, `git diff` |
| 编译/类型 | `tsc --noEmit` + 输出分析 | `exec` |
| 前端页面 | gstack 浏览器实际操作 | `/qa` gstack skill |
| 单元测试 | `npm test` + coverage 报告 | `exec` + gstack |
| API/后端 | `curl` + 响应验证 | `exec` |

### 2.2 各 Epic 验证方案

#### P001 验证方案（已确认）
```
1. git show b9a00e199 --stat → 确认 .github/workflows/test.yml + package.json 变更
2. grep "Validate Slack Webhook" .github/workflows/test.yml → 确认 dry-run step
3. test -f vibex-fronted/scripts/webhook-dryrun.ts → 脚本存在
```

#### P002 验证方案
```
1. cd vibex-fronted && pnpm exec tsc --noEmit → 确认 0 errors
2. cd vibex-backend && pnpm exec tsc --noEmit → 量化错误数
3. cd mcp-server && pnpm exec tsc --noEmit → 量化错误数
```

#### P003 验证方案（前端，必须用 gstack）
```
1. 启动 dev server
2. 用 /qa gstack 打开 http://localhost:3000
3. 首次访问时检查 onboarding overlay 出现
4. 检查 data-testid 唯一性（无重复 testId 导致 getByTestId 报错）
5. 测试 skip 按钮功能
6. 检查 NewUserGuide 是否在 DDSCanvasPage 正确集成
```

#### P004 验证方案（已确认）
```
1. npm test → 确认所有测试通过（最后一次通过）
2. test -f vibex-fronted/src/lib/canvas/api/canvasApi.test.ts → 文件存在
3. test -f vibex-fronted/src/lib/__tests__/canvasDiff.test.ts → 文件存在
4. grep "check-coverage.js 60" .github/workflows/test.yml → coverage gate = 60%
```

#### P005 验证方案（已确认文件结构）
```
1. 用 /qa gstack 打开 /canvas-diff 页面
2. 截图确认：
   - 骨架屏（非 spinner）— 这是之前 fail 的关键点
   - 两个 Canvas 选择器
   - Diff 视图区域（新增红/移除绿/修改黄）
   - Export JSON 按钮
3. test -f vibex-fronted/src/lib/__tests__/canvasDiff.test.ts → 核心算法有测试
```

---

## 3. 可行性评估

### 3.1 技术可行性

| Epic | 可行性 | 风险 |
|------|--------|------|
| P001 Slack dry-run | ✅ 高 | webhook secret 需真实配置才能端到端验证 |
| P002 TS 验证 | ✅ 高 | 仅执行编译命令，无风险 |
| P003 Onboarding | ✅ 高 | 需实际浏览器操作（gstack 验证可行） |
| P004 API 测试 | ✅ 高 | 测试套件已通过，验证结果即可 |
| P005 Canvas 对比 | ✅ 高 | 需浏览器验证 UI（gstack 验证可行） |

### 3.2 资源需求

- **gstack 环境**: 需 `browse` + `qa` skill 可用
- **编译环境**: 需 pnpm + tsc 可用
- **时间估算**: 
  - P001: 5 分钟
  - P002: 5 分钟
  - P003: 20 分钟（含浏览器操作）
  - P004: 10 分钟
  - P005: 20 分钟（含浏览器操作）
  - **总计**: ~60 分钟

---

## 4. 初步风险识别

### 4.1 风险矩阵

| 风险 | 影响 | 可能性 | 缓解措施 |
|------|------|--------|----------|
| gstack `/qa` 浏览器无法启动 | 中 | 低 | 降级为手动验证 + 截图报告 |
| P002 后端 TS 错误超出预期 | 中 | 中 | Coord 决策：是否要求修复后再验证 |
| P005 skeleton vs spinner 混用 | 高 | 中 | 必须用 gstack 截图验证，不能只看代码 |
| P003 data-testid 仍有重复 | 高 | 低 | 已修复，需验证 |
| P004 CI coverage gate 阈值仍为 85% | 高 | 低 | 已修复，需验证 |
| P005 canvasDiff.test.ts 不存在 | 中 | 低 | 已修复，需验证 |

### 4.2 历史教训（来自 learnings）

**来自 `vibex-canvas-urgent-bugs-20260411`**：
- Bug-2 的 4 个 404 数字是"预设"而非 gstack 验证产出 → QA 不能假设"PRD 说的数字是对的"，必须实际验证
- localStorage 与 Zustand persist 可能双写 → P003 验证时注意检查是否有 localStorage 双写问题
- ErrorBoundary 测试逻辑方向（测试"bug 消失"而非"bug 存在"）→ P003 data-testid 测试应为 `queryByTestId` 而非 `getByTestId`

---

## 5. 验收标准

### 5.1 统一验收标准（所有 Epic 适用）

- [ ] `pnpm run build` → 0 errors（前端）
- [ ] `pnpm --filter vibex-backend run build` → 0 errors（后端）
- [ ] `pnpm test` → 100% passed
- [ ] `git fetch && git log origin/main -1` → 确认远程已有最新 commit
- [ ] `grep -cF "## [" CHANGELOG.md` → 确认 changelog 有更新

### 5.2 Epic 专项验收标准

#### P001-Slack配置
- [ ] `git show HEAD~1..HEAD --name-only` 包含 CI workflow 文件
- [ ] `.github/workflows/test.yml` 包含 `SLACK_WEBHOOK_URL` dry-run step
- [ ] `package.json` 包含 webhook 相关脚本

#### P002-TS债务
- [ ] `pnpm --filter vibex-fronted exec tsc --noEmit` → 0 errors
- [ ] 后端/mcp-server TS 错误已量化（有记录）

#### P003-Onboarding
- [ ] gstack 验证：Onboarding overlay 在首次访问时出现
- [ ] gstack 验证：`getByTestId('onboarding-skip-btn')` 不报错（无重复 testId）
- [ ] gstack 验证：skip 后 overlay 消失
- [ ] gstack 验证：NewUserGuide 在 DDSCanvasPage 正确渲染
- [ ] 无 localStorage 双写（仅通过 Zustand persist）

#### P004-API测试
- [ ] `src/services/api/modules/auth.test.ts` 存在，覆盖率 ≥ 60%
- [ ] `src/services/api/modules/project.test.ts` 存在，覆盖率 ≥ 60%
- [ ] `src/services/api/modules/canvas.test.ts` 或 `canvasApi.test.ts` 存在
- [ ] CI workflow coverage threshold 为 60%（非 85%）
- [ ] 新增测试用例数 ≥ 20

#### P005-Canvas对比
- [ ] gstack 验证：`/canvas-diff` 页面加载
- [ ] gstack 验证：骨架屏显示（非 spinner）
- [ ] gstack 验证：两个 Canvas 选择器可见
- [ ] gstack 验证：Diff 视图区域存在
- [ ] `src/lib/__tests__/canvasDiff.test.ts` 存在
- [ ] `src/lib/canvasDiff.ts` 有测试覆盖

---

## 6. Research 总结

### 6.1 历史经验（ learnings/ 搜索结果）

| 主题 | 相关文档 | 核心教训 |
|------|----------|----------|
| Onboarding | `vibex-canvas-urgent-bugs-20260411.md` | localStorage 双写风险、ErrorBoundary 测试逻辑方向 |
| Canvas 组件 | `vibex-canvas-urgent-bugs-20260411.md` | skeleton 优先于 spinner（spec 明确要求） |
| 测试断言 | `vibex-canvas-urgent-bugs-20260411.md` | Zustand action 签名不接受参数，断言勿写 objectContaining |

### 6.2 Git History 关键发现

**P001**: 1 次 commit，无 bugfix，范围清晰
**P003**: 3 次 commit，修复了 data-testid 重复问题（两次 reject 后才通过）
**P004**: 5 次 commit，多次失败（coverage 阈值错误、import 失败）
**P005**: 2 次 commit，修复了 skeleton + test file 缺失问题

**结论**: P003、P004、P005 在开发过程中均有失败-修复-重测的迭代，QA 应重点验证这些修复点是否生效。

---

## 7. 执行决策

- **决策**: 条件通过（Conditional）
- **执行条件**: 必须使用 gstack `/qa` 验证 P003、P005 的前端功能，不能仅靠 `npm test`
- **风险项**: 
  1. gstack 浏览器环境不可用时，P003/P005 需人工验证
  2. P002 后端 TS 错误若超出 10 个，Coord 需决策是否要求修复

---

*生成时间: 2026-05-03 20:43 GMT+8*
*Analyst Agent | VibeX Sprint24 QA 需求分析*